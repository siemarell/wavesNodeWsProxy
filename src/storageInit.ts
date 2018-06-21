import * as Knex from "knex"
import {logger} from './logger'

let knex = Knex({
    dialect: 'sqlite3',
    connection: {
        filename: './storage.db'
    }
});

export const init = () => {
    knex.schema
        .dropTableIfExists('client_subscriptions')
        .createTable('client_subscriptions', table => {
            table.string('client_uuid').notNullable();
            table.string('channel').notNullable();
        })
        .dropTableIfExists('block')
        .createTable('block', table => {
            table.integer('height').notNullable();
            table.string('signature').notNullable();
            table.json('data')
        })
        .then(async () => {
            logger.info('Storage init ok');
            knex.destroy()
        }, error => {
            logger.info(error);
            knex.destroy()
        });
};
