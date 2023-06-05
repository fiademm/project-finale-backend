const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'project_finale_demo',
    password: 'postgres',
    port: 5432
});

module.exports = pool;