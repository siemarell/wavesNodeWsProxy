import {Observable} from "rxjs/internal/Observable";
import {map} from "rxjs/operators";
import {interval, Observer, Subject} from "rxjs/index";
import * as request from 'request-promise'
import {config as cfg} from './config';
import {asleep} from './utils'
import {async} from "rxjs/internal/scheduler/async";


interface IStorage {
    lastUtx: number,
    addresses: Array<any>,
    subjects: Array<any>
}


export function getObservable(channel: string): Observable<string> {
    if (channel == 'utx') return sync.utxObs;
    return interval(1000).pipe(map(x => `${channel} ${x.toString()}`))
}


class Synchronizer {
    get utxObs(): Observable<any> {
        return this._utxObs;
    }
    storage: IStorage = {
        lastUtx: -1,
        addresses: [],
        subjects: []
    };

    private _utxObs = Observable.create(async (obs: Observer<any>) => {
        const loop = async ()=>{
            if (obs.closed) return;
            const newUtxs = await this.getUTX();
            newUtxs.forEach((utx: any) => {
                if (utx.timestamp > this.storage.lastUtx) {
                    console.dir(utx);
                    obs.next(utx);
                    this.storage.lastUtx = utx.timestamp
                }
            });
            //await asleep(cfg.pollInterval);
            setTimeout(async ()=> {await loop()}, cfg.pollInterval);
        };

        await loop();
    });

    private async getUTX() {
        const options = {
            uri: `${cfg.nodeAddress}/transactions/unconfirmed`,
            json: true
        };
        const resp = await request.get(options);
        // console.log(resp.map((x:any)=>x.timestamp));
        // console.log(resp.slice().sort((a:any, b:any)=> a.timestamp - b.timestamp).map((x:any)=>x.timestamp));
        return resp.slice().sort((a: any, b: any) => a.timestamp - b.timestamp);
    }


}

export const sync = new Synchronizer();
// sync.utxObs.subscribe(x=> console.log(x))
// setInterval(console.log, 3000, "1")