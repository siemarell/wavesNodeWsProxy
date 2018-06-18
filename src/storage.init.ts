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
    .dropTableIfExists('last_height_sig')
    .createTable('last_height_sig', table => {
        table.integer('height').notNullable();
        table.string('sig').notNullable();
    })
    .then(async () => {
        const [height, sig] = await nodeApi.getHeightAndSig();
        await knex('last_height_sig').insert({height: height, sig: sig});
        console.log('ok');
        knex.destroy()
    }, error => {
        console.log(error);
        knex.destroy()
    });

