import dotenv from 'dotenv'
dotenv.config()

import knexStringcase from 'knex-stringcase'
// Converts Postgres snake_case to camelCase
const options = knexStringcase({
  client: 'pg',
  connection: process.env.DB_URL,
})

// Connects to Database
import knex from 'knex'
const db = knex(options)

export default db
