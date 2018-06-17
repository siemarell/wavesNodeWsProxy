import {Observable} from "rxjs/internal/Observable";
import {map, concatMap, publish, share, filter, tap} from "rxjs/operators";
import {interval, Observer, Subject} from "rxjs";
import * as request from 'request-promise';
import {asleep} from './utils'
import {async} from "rxjs/internal/scheduler/async";
import {Subscription} from "rxjs/internal/Subscription";

interface IStorage {
    lastUtx: number,
    addresses: Array<any>,
    subjects: Array<any>
}


// export function getObservable(channel: string): Observable<string> {
//     if (channel == 'utx') return sync.utxObs;
//     return interval(1000).pipe(map(x => `${channel} ${x.toString()}`))
// }

export interface INodeProxy {
    getChannel(channel: string): Observable<any>
}

export class NodeProxy implements INodeProxy{
    private utxPool: Map<string, {}> = new Map();
    private utxSubscription: Subscription;

    private _processUtxResponce = (utxs: Array<any>) => {
        const updatedPool = new Map<string, {}>();
        utxs.forEach(utx =>{
            if (!this.utxPool.has(utx.signature)){
                console.log(utx);
                this.utxData.next(utx);
            }
            updatedPool.set(utx.signature, utx)
        });
    };

    private readonly utxData: Subject<any> = new Subject<any>();
    constructor(private nodeUrl: string, private pollInterval: number){
       this.utxSubscription = interval(this.pollInterval)
            .pipe(
                concatMap(async()=>{
                    return await this.getUTXs();
                }),
            )
            .subscribe(this._processUtxResponce)

        // utxObservable.subscribe(utxSubject);
        // this.utxData = utxSubject;
    }

    storage: IStorage = {
        lastUtx: -1,
        addresses: [],
        subjects: []
    };


    private async getUTXs(): Promise<Array<any>> {
        const options = {
            uri: `${this.nodeUrl}/transactions/unconfirmed`,
            json: true
        };
        return await request.get(options);
    }

    getChannel(channelName: string){
        if (channelName === 'utx'){
            return this.utxData.asObservable()
        }
        return new Observable()
    }
}

// const proxy = new NodeProxy("https://nodes.wavesplatform.com", 3000);
// proxy.getChannel('utx').subscribe(x=> console.log(x))
// setInterval(console.log, 3000, "1")