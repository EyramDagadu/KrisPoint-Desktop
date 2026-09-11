const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.url?.includes('localhost') ? false : { rejectUnauthorized: false },
});

module.exports = pool;
