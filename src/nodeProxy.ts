import {Observable} from "rxjs/internal/Observable";
import {
    concatMap,
    filter,
    concatAll,
    exhaustMap, distinct, mergeAll
} from "rxjs/operators";
import {interval, Observer, Subject, merge} from "rxjs";
import {Subscription} from "rxjs/internal/Subscription";
import {INodeApi} from "./nodeApi";
import {config} from "./config";
import {db} from './storage'
import {fromPromise} from "rxjs/internal-compatibility";
import {filterByAddress} from "./utils";


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
    private readonly heightData: Subject<any> = new Subject<number>();

    constructor(private nodeApi: INodeApi, private pollInterval: number) {
        this.createNewUtxSubscription(this.utxObserver);
        this.createNewBlockSubscription(this.blockObserver);
    }

    private async getTxsAtHeight(h: number) {
        const block = await this.storage.getBlockAt(h);
        let result = [];
        if (block) {
            const txs = JSON.parse(block.data).transactions;
            if (txs) result = txs
        }
        return result;
    }

    public getChannel(channelName: string): Observable<any> {
        const args = channelName.split('/');
        switch (args[0]) {
            case 'utx':
                return this.utxData.asObservable();
            case 'block':
                return this.blockData.asObservable();
            case 'tx':
                if (args[1] === 'confirmed' && parseInt(args[2])) {
                    const confirmations = parseInt(args[2], 10)
                    return this.heightData.pipe(
                        distinct(),
                        concatMap(h => this.getTxsAtHeight(h - confirmations)),
                        concatAll()
                    )
                }
                return this.txData.asObservable();
            case 'address':
                if (!this.nodeApi.checkAddress(args[1])) {
                    throw new Error('Invalid channel')
                } else {
                    if (args[2] === 'confirmed' && parseInt(args[3])) {
                        const confirmations = parseInt(args[3], 10)
                        return this.heightData.pipe(
                            distinct(),
                            concatMap(h => this.getTxsAtHeight(h - confirmations)),
                            concatAll(),
                            filter(filterByAddress(args[1]))
                        )
                    } else {
                        const txData = this.txData
                            .pipe(filter(filterByAddress(args[1])));
                        const utxData = this.utxData
                            .pipe(filter(filterByAddress(args[1])));
                        if (args[2] === 'utx') {
                            return utxData
                        } else if (args[2] === 'tx') {
                            return txData
                        } else {
                            return merge(txData, utxData)
                        }
                    }
                }
            default:
                throw new Error('Unknown channel')
        }
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
        const blockInStorage = await this.storage.getBlockAt(block.height);
        if (blockInStorage && blockInStorage.signature === block.signature){
            /*
              Quite often there are blocks, which have already been proceed. Maybe it is related to node caching
              requests or inconsistency in getting last block signature via node REST API
             */
            console.log(`Duplicate  ${block.signature}`);
            return
        }
        await this.storage.saveBlock(block);
        return block;
    };

    private _getBlockHeightsToSync = async () => {
        //ToDo: What if height, returned from node, is smaller than height, returned from storage
        let blocksToSync: Array<number> = [];

        const {lastHeight, lastSig} = await this.storage.getlastHeightAndSig();
        const {currentHeight, currentSig} = await this.nodeApi.getHeightAndSig();

        if (currentSig !== lastSig) {
            const heightToSync = await this.getHeightToSyncFrom(lastHeight);
            blocksToSync = Array.from(Array(currentHeight - heightToSync).keys())
                .map(x => x + heightToSync + 1)
        }
        console.log(
            `Current height: ${currentHeight}, Blocks to sync: ${blocksToSync}`
        );
        return blocksToSync;
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
            this.heightData.next(block.height);
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

    getHeightToSyncFrom = async (lastHeight: number): Promise<number> => {
        const loop = async (height: number): Promise<number> => {
            const blockInStorage = await this.storage.getBlockAt(height);
            if (!blockInStorage) return height; //reached bottom
            try {
                const blockInChain = await this.nodeApi.getBlockHeaderAt(blockInStorage.height);
                //ToDo: What if we get network exception?
                if (blockInChain.signature === blockInStorage.signature) {
                    return height
                }
                else return await loop(height - 1)
            } catch (e) {
                return await loop(height - 1)
            }
        };

        return await loop(lastHeight);
    }
}

