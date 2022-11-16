const Pool = require('pg').Pool;
require('dotenv').config();

const pool = new Pool();

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback)
}