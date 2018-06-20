import * as Knex from "knex"

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
            console.log('Storage init ok');
            knex.destroy()
        }, error => {
            console.log(error);
            knex.destroy()
        });
};
