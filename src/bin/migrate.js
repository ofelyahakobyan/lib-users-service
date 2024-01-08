import pg from 'pg';
import { Users } from "../models";

const models = [Users];

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_PORT, DB_NAME } = process.env;

const { Client } = pg;


(async function () {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) return;
    const client = new Client({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        port: DB_PORT,
        database: 'postgres'
    });
    await client.connect();
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${DB_NAME}';`);
    if (!res.rowCount) {
        await client.query(`CREATE DATABASE ${DB_NAME}`);
    }
    await client.end();

    (async function () {
        for (const m of models) {
            await m.sync({ alter: true });
        }
    })();

})();



