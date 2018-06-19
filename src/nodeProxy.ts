import {Observable} from "rxjs/internal/Observable";
import {
    concatMap,
    filter,
    concatAll,
    exhaustMap
} from "rxjs/operators";
import {interval, Observer, Subject, merge} from "rxjs";
import {Subscription} from "rxjs/internal/Subscription";
import {INodeApi, NodeApi} from "./nodeApi";
import {config} from "./config";
import {db} from './storage'
import {fromPromise} from "rxjs/internal-compatibility";


export interface INodeProxy {
    getChannel(channel: string): Observable<any>;

    destroy(): void;
}


export class NodeProxy implements INodeProxy {
    private utxPool: Map<string, { timesAbsent: number, utx: {} }> = new Map();
    private txPool: Map<string, any> = new Map<string, any>();
    private subscriptions: Map<string, Subscription> = new Map();
    private storage = db;

    private readonly utxData: Subject<any> = new Subject<any>();
    private readonly txData: Subject<any> = new Subject<any>();
    private readonly blockData: Subject<any> = new Subject<any>();

    constructor(private nodeApi: INodeApi, private pollInterval: number) {
        this.createNewUtxSubscription(this.utxObserver);
        this.createNewBlockSubscription(this.blockObserver);
    }

    private _getBlockHeightsToSync = async () => {
        let blocksToSync: Array<number> = [];

        const {lastHeight, lastSig} = await this.storage.getlastHeightAndSig();
        const {currentHeight, currentSig} = await this.nodeApi.getHeightAndSig();


        if (currentHeight === lastHeight && currentSig !== lastSig) {
            blocksToSync = [currentHeight]
        } else if (currentHeight > lastHeight) {
            blocksToSync = Array.from(Array(currentHeight - lastHeight + 1).keys())
                .map(x => x + lastHeight)
        }
        console.log(
            `Current height: ${currentHeight}, Blocks to sync: ${blocksToSync}`
        );
        return blocksToSync;
    };

    public getChannel(channelName: string): Observable<any> {
        const args = channelName.split('/');
        switch (args[0]) {
            case 'utx':
                return this.utxData.asObservable();
            case 'block':
                return this.blockData.asObservable();
            case 'address':
                if (!this.nodeApi.checkAddress(args[1])) {
                    throw new Error('Invalid channel')
                } else {
                    const txData = this.txData
                        .pipe(filter(utx => [utx.sender, utx.recipient].indexOf(args[1]) > -1));
                    const utxData = this.utxData
                        .pipe(filter(utx => [utx.sender, utx.recipient].indexOf(args[1]) > -1));
                    if (args[2] === 'utx') {
                        return utxData
                    } else if (args[2] === 'tx') {
                        return txData
                    } else {
                        return merge(txData, utxData)
                    }
                }
            default:
                throw new Error('Unknown channel')
        }
        return new Observable()
    }

    public destroy() {
        this.subscriptions.forEach(v => v.unsubscribe());
    }

    private createNewBlockSubscription(observer: Observer<any>) {
        const oldSub = this.subscriptions.get('block');
        if (oldSub) oldSub.unsubscribe();
        const newSub = interval(this.pollInterval)
            .pipe(
                exhaustMap(() => {
                    return fromPromise(this._getBlockHeightsToSync()).pipe(
                        concatAll(),
                        concatMap(h => this.nodeApi.getBlockAt(h)),
                        concatMap(block => this.processBlock(block)),
                        filter(block => block)
                    )
                }),
            ).subscribe(observer);
        this.subscriptions.set('block', newSub)
    }

    private processBlock = async (block: any): Promise<any> => {
        console.log(`Processing block at ${block.height} with signature ${block.signature}`);
        //todo: check if block is duplicate
        const {lastHeight, lastSig} = await this.storage.getlastHeightAndSig();
        if (lastSig === block.signature) {
            console.log(`Duplicate  ${block.signature}`);
            return
        }
        await this.storage.setLastHeightAndSig(block.height, block.signature);
        return block;
    };

    private createNewUtxSubscription(observer: Observer<any>) {
        const oldSub = this.subscriptions.get('utx');
        if (oldSub) oldSub.unsubscribe();
        const newObs = interval(this.pollInterval)
            .pipe(
                concatMap(() => {
                    return this.nodeApi.getUtxs();
                })
            )
            .subscribe(observer);

        this.subscriptions.set('utx', newObs);
    }

    private utxObserver: Observer<any> = {
        closed: false,

        next: (utxs: Array<any>): void => {
            utxs.filter(utx => utx.type === 4)
                .forEach(utx => {
                    if (!this.utxPool.has(utx.signature)) {
                        console.log(`New utx of type 4 with signature: ${utx.signature}`);
                        this.utxData.next(utx);
                        this.utxPool.set(utx.signature, {timesAbsent: -1, utx})
                    } else {
                        const temp = this.utxPool.get(utx.signature);
                        temp.timesAbsent -= 1;
                        this.utxPool.set(utx.signature, temp);
                    }
                });

            for (let key of this.utxPool.keys()) {
                let val = this.utxPool.get(key);
                val.timesAbsent += 1;
                if (val.timesAbsent > config.utxAbsent) this.utxPool.delete(key);
            }
        },

        error: (err: any) => {
            console.log('Utx polling error. Recreating polling subscription');
            this.createNewUtxSubscription(this.utxObserver);
        },

        complete: () => {
        }
    };

    private blockObserver: Observer<any> = {
        closed: false,

        next: (block: any) => {
            this.blockData.next(block);
            block.transactions.forEach((tx: any) => {
                if (!this.txPool.has(tx.signature)) {
                    this.txPool.set(tx.signature, tx);
                    this.txData.next(tx);
                }
            })
        },

        error: (err: any) => {
            console.log('Block polling error. Recreating polling subscription');
            this.createNewBlockSubscription(this.blockObserver);
        },

        complete: () => {
        }
    };
}