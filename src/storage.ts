import * as Knex from "knex"

let knex = Knex({
    dialect: 'sqlite3',
    connection: {
        filename: './storage.db'
    }
});


export function init() {
    knex.schema
        .dropTableIfExists('client_subscriptions')
        .createTable('client_subscriptions', table => {
            table.string('client_uuid').notNullable();
            table.string('channel').notNullable();
        })
        .then(() => {
            console.log('ok');
            knex.destroy()
        }, error => {
            console.log(error);
            knex.destroy()
        });
}

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
    }
};

export interface IStorage {
    getAllSubscriptions(sessionId: string): Promise<Array<string>>;

    saveSubscription(sessionId: string, channel: string): Promise<void>;

    deleteSubscription(sessionId: string, channel: string): Promise<void>;
}