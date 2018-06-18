import {Observable} from "rxjs/internal/Observable";
import {map, concatMap, publish, share, filter, tap} from "rxjs/operators";
import {interval, Observer, Subject} from "rxjs";
import * as request from 'request-promise';
import {Subscription} from "rxjs/internal/Subscription";
import {INodeApi, NodeApi} from "./nodeApi";


export interface INodeProxy {
    getChannel(channel: string): Observable<any>;
    destroy(): void;
}


export class NodeProxy implements INodeProxy{
    private utxPool: Map<string, {timesAbsent: number, utx: {}}> = new Map();
    private subscriptions: Map<string, Subscription> = new Map();

    private readonly utxData: Subject<any> = new Subject<any>();

    constructor(private nodeApi: INodeApi, private pollInterval: number){
       this.subscriptions.set('utx', interval(this.pollInterval)
            .pipe(
                concatMap(async()=>{
                    return await this.nodeApi.getUtxs();
                }),
            )
            .subscribe(this._processUtxResponse)
       )
    }

    private _processUtxResponse = (utxs: Array<any>): void => {
        utxs.filter(utx => utx.type === 4)
            .forEach(utx =>{
                if (!this.utxPool.has(utx.signature)){
                    console.log(utx);
                    this.utxData.next(utx);
                    this.utxPool.set(utx.signature, {timesAbsent: -1, utx})
                }else {
                    const temp = this.utxPool.get(utx.signature);
                    temp.timesAbsent -=1;
                    this.utxPool.set(utx.signature, temp);
                }
            });

        for (let key of this.utxPool.keys()){
            let val = this.utxPool.get(key);
            val.timesAbsent += 1;
            if (val.timesAbsent > 10) this.utxPool.delete(key);
        }
    };

    public getChannel(channelName: string): Observable<any>{
        const channelArr = channelName.split('/');
        switch (channelArr[0]) {
            case 'utx':
                return this.utxData.asObservable();
            // case 'block':
            //     return this.blockData.asObservable;
            // case 'address':
            //     if (!this.checkAddress(channelArr[1])){
            //
            //     }
            default:
                throw new Error('Unknown channel')
        }
        return new Observable()
    }

    public destroy(){
        this.subscriptions.forEach(v=> v.unsubscribe());
    }
}