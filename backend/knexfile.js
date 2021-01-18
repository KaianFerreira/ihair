// Update with your config settings.
require('dotenv').config()

module.exports = {
  client: 'pg',
  connection: process.env.DB_URL,
  // {
  //   host: process.env.DB_HOST,
  //   port: process.env.DB_PORT,
  //   database: process.env.DB_DATABASE,
  //   user: process.env.DB_USER,
  //   password: process.env.DB_PASSWORD,
  //   ssl: true
  // },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
}