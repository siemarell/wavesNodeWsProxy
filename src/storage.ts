import * as Knex from "knex"
import {asleep} from "./utils";

let knex = Knex({
    dialect: 'sqlite3',
    connection: {
        filename: './storage.db'
    }
});

export const db: IStorage = {
    async getAllSubscriptions(clientId: string) {
        const resultSet = await knex('client_subscriptions')
            .where('client_uuid', clientId)
            .distinct();
        return resultSet.map(({client_uuid, channel}: { client_uuid: string, channel: string }) => channel);
    },

    async saveSubscription(clientId: string, channel: string) {
        const exists = (await knex('client_subscriptions')
            .where({client_uuid: clientId, channel: channel})).length > 0;
        if (!exists) {
            await knex('client_subscriptions').insert({
                client_uuid: clientId,
                channel: channel
            })
        }
    },

    async deleteSubscription(clientId: string, channel: string) {
        await knex('client_subscriptions').where({
            client_uuid: clientId,
            channel: channel
        }).del()
    },

    async getlastHeightAndSig(): Promise<{ lastHeight: number, lastSig: string }> {
        const result = await knex('block').orderBy('height','desc').limit(1);
        return {lastHeight: result[0].height, lastSig: result[0].signature}
    },

    async setLastHeightAndSig(height: number, sig: string) {
        await knex('last_height_sig').update({height: height, sig: sig});
    },

    async getBlockAt(height) {
        const result = await knex('block').where({height: height});
        return result === [] ? undefined : result[0];
    },

    async saveBlock(block) {
        await this.deleteBlockAt(block.height);
        await knex('block').insert({
            height: block.height,
            signature: block.signature,
            data: JSON.stringify(block)
        })
    },

    async deleteBlockAt(height) {
        await knex('block').where({height:height}).del()
    },

    destroy() {
        knex.destroy()
    }
};

export interface IStorage {
    getAllSubscriptions(sessionId: string): Promise<Array<string>>;

    saveSubscription(sessionId: string, channel: string): Promise<void>;

    deleteSubscription(sessionId: string, channel: string): Promise<void>;

    getlastHeightAndSig(): Promise<{ lastHeight: number, lastSig: string }>;

    setLastHeightAndSig(height: number, sig: string): Promise<void>;

    getBlockAt(height: number): Promise<any>;

    saveBlock(block: any): Promise<void>;

    deleteBlockAt(height: number): Promise<void>;

    destroy(): void;
}