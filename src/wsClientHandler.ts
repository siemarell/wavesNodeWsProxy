import {Subscription} from "rxjs/internal/Subscription";
import * as WebSocket from 'ws';
import {CommandType, ICommandParser, commandParser} from "./commandParser";
import uuid = require("uuid");
import {INodeProxy} from './nodeProxy';
import {Observer} from "rxjs/internal/types";
import {IStorage, db} from './storage'
import {logger} from "./logger";

export class WSClientHandler {
    get id(): string {
        return this._id;
    }

    private subscriptions: Map<string, Subscription> = new Map<string, Subscription>();
    private readonly _id: string;
    private storage: IStorage = db;

    private parser: ICommandParser = commandParser;

    constructor(private ws: WebSocket, private nodeProxy: INodeProxy, id?: string) {
        this._id = id || uuid.v4();
        this.sendMessage({connection: "ok", id: this.id});
        this.listenForCommands();
    }


    async init() {
        const clientChannels = await this.storage.getAllSubscriptions(this._id);
        clientChannels.forEach((channel: string) => {
            const sub = this.nodeProxy.getChannel(channel).subscribe(this.getChannelObserver(channel));
            this.subscriptions.set(channel, sub)
        })
    }

    private async addSubscription(channel: string) {
        try {
            const sub = this.nodeProxy.getChannel(channel)
                .subscribe(this.getChannelObserver(channel));
            this.subscriptions.set(channel, sub);
            await this.storage.saveSubscription(this._id, channel);
            this.sendMessage({status: "ok", op: `subscribe ${channel}`})
        } catch (e) {
            this.sendMessage({msg: `Bad channel: ${channel}`})
        }

    }

    private async removeSubscription(channel: string) {
        const sub = this.subscriptions.get(channel);
        if (sub != undefined) sub.unsubscribe();
        this.subscriptions.delete(channel);
        await this.storage.deleteSubscription(this._id, channel);
        this.sendMessage({status: "ok", op: `unsubscribe ${channel}`})
    }

    private sendMessage(obj: Object): void {
        this.ws.send(JSON.stringify(obj));
    }

    private listenForCommands() {
        this.ws.on('message', async (msg: string) => {
            const command = this.parser.parseCommand(msg);
            switch (command.type) {
                case CommandType.UNSUB:
                    if (command.channel === 'all') {
                        for (let key of this.subscriptions.keys()) {
                            await this.removeSubscription(key)
                        }
                    } else {
                        await this.removeSubscription(command.channel);
                    }
                    break;
                case CommandType.SUB:
                    await this.addSubscription(command.channel);
                    break;
                case CommandType.PING:
                    this.sendMessage({"op": "pong"});
                    break;
                case CommandType.BAD:
                    this.sendMessage({"msg": "Bad Command", cmd: command.msg});
                    break;
            }
        });
    }

    private getChannelObserver(channel: string): Observer<string> {
        return {
            next: (value: string) => {
                this.sendMessage({
                    op: `subscribe ${channel}`,
                    msg: value
                })
            },
            error: (err: any) => {
                logger.error(err)
            },
            complete: () => {
            }
        }
    };

    destroy() {
        for (let sub of this.subscriptions.values()) {
            sub.unsubscribe()
        }
    }
}
