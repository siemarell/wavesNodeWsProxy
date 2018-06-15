import {interval} from "rxjs"
import {Observable} from "rxjs/internal/Observable";
import {map} from 'rxjs/operators';


export interface ICommandParser {
    parseCommand(msg: string): WSCommand
}

export const commandParser: ICommandParser = {
    parseCommand(msg: any): WSCommand {
        let result: WSCommand;
        try {
            const msgJson = JSON.parse(msg);
            const arr = msgJson.op.split(" ");
            switch (arr[0]) {
                case "ping":
                    result = {type: CommandType.PING, msg: msg};
                    break;
                case "subscribe":
                    result = {type: CommandType.SUB, msg: msg};
                    break;
                case "unsubscribe":
                    result = {type: CommandType.UNSUB, msg: msg};
                    break;
                default:
                    result = {type: CommandType.BAD, msg: msg}
            }

            if (result.type == CommandType.SUB || result.type == CommandType.UNSUB){
                result.channel = arr[1]
            }
        }
        catch (e) {
            result = {type: CommandType.BAD, msg: msg}
        }
        return result;
    }
};


export enum CommandType {
    BAD,
    SUB,
    UNSUB,
    PING
}

export interface WSCommand {
    type: CommandType,
    msg: string
    channel?: string
}


