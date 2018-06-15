import {Observable} from "rxjs/internal/Observable";
import {map} from "rxjs/operators";
import {interval, Observer, Subject} from "rxjs/index";
import * as request from 'request-promise'
import {config as cfg} from './config';

const snooze = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface IStorage {
    lastUtx: number,
    addresses: Array<any>,
    subjects: Array<any>
}


export function getObservable(channel: string): Observable<string> {
    if (channel == 'utx') return sync.utxObs;
    return interval(1000).pipe(map(x => `${channel} ${x.toString()}`))
}


class Syncronizer {
    get utxObs(): Observable<any> {
        return this._utxObs;
    }
    storage: IStorage = {
        lastUtx: -1,
        addresses: [],
        subjects: []
    };

    private _utxObs = Observable.create(async (obs: Observer<any>) => {
        while (true){
            const newUtxs = await this.getUTX();
            newUtxs.forEach((utx: any) => {
                if (utx.timestamp >= this.storage.lastUtx) {
                    obs.next(utx);
                    this.storage.lastUtx = utx.timestamp
                }
            });
            await snooze(cfg.pollInterval);
        }

            //setTimeout(loop, 1000)
    });

    private async getUTX() {
        const options = {
            uri: `${cfg.nodeAddress}/transactions/unconfirmed`,
            json: true
        };
        const resp = await request.get(options);
        // console.log(resp.map((x:any)=>x.timestamp));
        // console.log(resp.slice().sort((a:any, b:any)=> a.timestamp - b.timestamp).map((x:any)=>x.timestamp));
        console.dir(resp)
        return resp.slice().sort((a: any, b: any) => a.timestamp - b.timestamp);
    }


}

export const sync = new Syncronizer();
// sync.utxObs.subscribe(x=> console.log(x))
// setInterval(console.log, 3000, "1")