require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT
});

client.connect()
    .then(() => console.log('Connected to database'))
    .catch(err => console.error('Database connection error', err));

module.exports = client;