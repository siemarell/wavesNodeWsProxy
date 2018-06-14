import {Subscription} from "rxjs/internal/Subscription";
import * as WebSocket from 'ws';
import {ClientCommand, CommandType, parseCommand} from "./commands";


export class Client {
    eventsStream: Subscription;
    private constructor(private id: string, private subscriptions: Map<string, Subscription>, private ws:WebSocket){
        this.listenForCommands();
    }

    static async getClient(id: string, ws: WebSocket) {
        //await find client subscriptions in storage
        return new Client(id, new Map<string, Subscription>(), ws)
    }

    private async addSubscription(channel: string) {

    }

    private async removeSubscription(channel: string) {
        if (channel = 'all') {
            this.subscriptions.forEach(v => v.unsubscribe());
            this.subscriptions.clear()
        }else {
            const sub = this.subscriptions.get(channel);
            if (sub != undefined) sub.unsubscribe();
            this.subscriptions.delete(channel);
        }
    }

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
                case CommandType.BAD:
                    this.ws.send({"msg": "Bad Command", cmd: command.msg})
                    break;
            }
        });
    }

    destroy(){}
}

