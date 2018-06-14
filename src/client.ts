import {Subscription} from "rxjs/internal/Subscription";
import * as WebSocket from 'ws';
import {ClientCommand, CommandType, parseCommand} from "./commands";


export class Client {
    eventsStream: Subscription;
    private constructor(private id: string, private subscriptions: {string?: Subscription}, private ws:WebSocket){
        this.listenForCommands();
    }

    static async getClient(id: string, ws: WebSocket) {
        //await find client subscriptions in storage
        return new Client(id, {}, ws)
    }

    private async addSubscription(channel: string) {

    }

    private async removeSubscription(channel: string) {}

    private listenForCommands(){
        this.ws.on('message', async msg => {
            const command = parseCommand(msg);
            switch (command.type){
                case CommandType.UNSUB:
                    await this.removeSubscription(command.channel);
                    break;
                case CommandType.SUB:
                    await this.addSubscription(command.channel);
                    break;
                case CommandType.PING:
                    this.ws.send({"op": "pong"})
                    break;
                case CommandType.WRONG:
                    this.ws.send({"msg": "Bad Command", cmd: command.msg})
                    break;
            }
        });
    }

    destroy(){}
}
const eventObservable = getSubscription(msg);
if(!eventObservable){
    this.ws.send(`Bad command: ${msg}`)
}else{
    this.ws.send(`Ok: ${msg}`);
    const subscription = eventObservable.subscribe((x: string) => {console.log(x);ws.send(x)});
    subscriptions.push(subscription);

}
