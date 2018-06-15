import {Subscription} from "rxjs/internal/Subscription";
import * as WebSocket from 'ws';
import {CommandType, ICommandParser, commandParser} from "./commandParser";
import uuid = require("uuid");
import * as db from './storage';
import {getObservable} from './nodeObservables';
import {Observer} from "rxjs/internal/types";


export class WSClientHandler {
    private subscriptions: Map<string, Subscription> = new Map<string, Subscription>();

    private parser: ICommandParser = commandParser;

    private observer: Observer<string> = {
        next: (value: string) => { this.sendMessage(value)},
        error: (err: any) => {},
        complete: () => {}
    };

    constructor(private ws:WebSocket, private readonly id?: string){
        this.id = id || uuid.v4();
        this.sendMessage({connection: "ok", id: id});
        this.listenForCommands();
    }


    async init() {
        const clientChannels = await db.getAllSubscriptions(this.id);
        clientChannels.forEach((channel:string) => {
            const sub = getObservable(channel).subscribe(this.observer);
            this.subscriptions.set(channel, sub)
        })
    }

    private async addSubscription(channel: string) {
        const sub = getObservable(channel).subscribe(this.observer);
        this.subscriptions.set(channel, sub);
        await db.saveSubscription(this.id, channel);
    }

    private async removeSubscription(channel: string) {
        const sub = this.subscriptions.get(channel);
        if (sub != undefined) sub.unsubscribe();
        this.subscriptions.delete(channel);
        await db.deleteSubscription(this.id, channel);
    }

    private sendMessage(obj: Object): void {
        this.ws.send(JSON.stringify(obj));
    }

    private listenForCommands(){
        this.ws.on('message', async (msg: string) => {
            const command = this.parser.parseCommand(msg);
            switch (command.type){
                case CommandType.UNSUB:
                    if (command.channel === 'all'){
                        for (let key of this.subscriptions.keys()){
                            await this.removeSubscription(key)
                        }
                    }else {
                        await this.removeSubscription(command.channel);
                    }
                    this.sendMessage({status: "ok", op: `unsubscribe ${command.channel}`});
                    break;
                case CommandType.SUB:
                    await this.addSubscription(command.channel);
                    break;
                case CommandType.PING:
                    this.sendMessage({"op": "pong"});
                    break;
                case CommandType.BAD:
                    this.sendMessage({"msg": "Bad Command", cmd: command.msg})
                    break;
            }
        });
    }

    destroy(){}
}

