import {Server} from 'ws'
import * as express from 'express'
import {getSubscription} from './commands'
import {Subscription} from "rxjs/internal/Subscription";

const app = express();

const wss = new Server({port: 40510});

wss.on('connection', ws =>{
    let subscriptions: Array<Subscription> = [];

    ws.on('message', msg => {
        const eventObservable = getSubscription(msg);
        if(!eventObservable){
            ws.send(`Bad command: ${msg}`)
        }else{
            ws.send(`Ok: ${msg}`);
            const subscription = eventObservable.subscribe((x: string) => {console.log(x);ws.send(x)});
            subscriptions.push(subscription);

        }
    });

    ws.on('close', ()=> subscriptions.forEach((sub: Subscription) => sub.unsubscribe()))
});



app.listen(3000, () => console.log('Example app listening on port 3000!'));