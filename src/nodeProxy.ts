import {Observable} from "rxjs/internal/Observable";
import {map, concatMap, combineAll} from "rxjs/operators";
import {interval, Observer, Subject} from "rxjs";
import * as request from 'request-promise';
import {asleep} from './utils'
import {async} from "rxjs/internal/scheduler/async";

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
    getChannel(channel: string): Observable<string>
}

export class NodeProxy implements INodeProxy{
    constructor(private nodeUrl: string, private pollInterval: number){}

    storage: IStorage = {
        lastUtx: -1,
        addresses: [],
        subjects: []
    };

    private _utxObs = interval(this.pollInterval).pipe(
        concatMap(async()=>{
            const newUtxs = await this.getUTX();
            return newUtxs.filter((utx: any) => {
                if (utx.timestamp > this.storage.lastUtx) {

                    this.storage.lastUtx = utx.timestamp;
                    return true
                }
                return false
            });
        })
    )

    private async getUTX() {
        const options = {
            uri: `${this.nodeUrl}/transactions/unconfirmed`,
            json: true
        };
        const resp = await request.get(options);
        // console.log(resp.map((x:any)=>x.timestamp));
        // console.log(resp.slice().sort((a:any, b:any)=> a.timestamp - b.timestamp).map((x:any)=>x.timestamp));
        return resp.slice().sort((a: any, b: any) => a.timestamp - b.timestamp);
    }

    getChannel(channelName: string){
        if (channelName === 'utx'){
            return <Observable<string>>this._utxObs
        }
        return new Observable<string>()
    }
}

const proxy = new NodeProxy("https://nodes.wavesplatform.com", 3000);
proxy.getChannel('utx').subscribe(x=> console.log(x))
setInterval(console.log, 3000, "1")