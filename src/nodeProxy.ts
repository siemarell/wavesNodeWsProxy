import {Observable} from "rxjs/internal/Observable";
import {map, concatMap, publish, share, filter, tap} from "rxjs/operators";
import {interval, Observer, Subject} from "rxjs";
import * as request from 'request-promise';
import {Subscription} from "rxjs/internal/Subscription";


export interface INodeProxy {
    getChannel(channel: string): Observable<any>
}

export class NodeProxy implements INodeProxy{
    private utxPool: Map<string, {}> = new Map();
    private utxSubscription: Subscription;
    private readonly utxData: Subject<any> = new Subject<any>();

    constructor(private nodeUrl: string, private pollInterval: number){
       this.utxSubscription = interval(this.pollInterval)
            .pipe(
                concatMap(async()=>{
                    return await this.getUTXs();
                }),
            )
            .subscribe(this._processUtxResponse)
    }

    private async getUTXs(): Promise<Array<any>> {
        const options = {
            uri: `${this.nodeUrl}/transactions/unconfirmed`,
            json: true
        };
        return await request.get(options);
    }

    private _processUtxResponse = (utxs: Array<any>) => {
        const updatedPool = new Map<string, {}>();

        utxs.filter(utx => utx.type === 4)
            .forEach(utx =>{
                if (!this.utxPool.has(utx.signature)){
                    console.log(utx);
                    this.utxData.next(utx);
                }
                updatedPool.set(utx.signature, utx)
            });

        this.utxPool = updatedPool;
    };

    public getChannel(channelName: string){
        if (channelName === 'utx'){
            return this.utxData.asObservable()
        }
        return new Observable()
    }
}