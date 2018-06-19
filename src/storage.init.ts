import * as Knex from "knex"
import {config} from "./config";
import {NodeApi} from "./nodeApi";

const nodeApi = new NodeApi(config.nodeUrl);
let knex = Knex({
    dialect: 'sqlite3',
    connection: {
        filename: './storage.db'
    }
});

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
        const {currentHeight, currentSig} = await nodeApi.getHeightAndSig();
        await knex('last_height_sig').insert({height: currentHeight, sig: currentSig});
        console.log('ok');
        knex.destroy()
    }, error => {
        console.log(error);
        knex.destroy()
    });

