import crypto from 'crypto'

import knex from '../knex.js'

const generateHash = (password, hash = null) => {
  const key = hash ? hash : crypto.randomBytes(16).toString('base64')
  const pass = crypto.pbkdf2Sync(password, Buffer.from(key, 'base64'), 10000, 64, 'SHA1').toString('base64')
  return { pass, key }
}

const validate = async (login, password) => {
  const user = await knex('user').where('login', login)
    .select('id', 'login', 'password', 'hash', 'role', 'active').first()
    
  if (user && user.password === generateHash(password, user.hash).pass) {
    delete user.password
    delete user.hash
    return user
  }
  return null
}

const exist = async (login, id = null) => {
  const query = knex('user').count('*').where('login', login).first()
  if (id) query.andWhereNot('id', id)
  const { count } = await query
  return count > 0
}

const get = async id => {
  return knex('user')
  .leftJoin('user_details', 'user.id', 'user_details.user')
  .where('user.id', id)
  .select('user.*', 'user_details.name')
  .first()
}

const create = async (
    login,
    password,
    name,
    fullName,
    registerNumber,
    birthDate,
    role = 'user'
  ) => {
  const {pass, key} = generateHash(password)
  return knex.transaction(async trx => {
    const user = await knex('user').transacting(trx).insert({
      login,
      password: pass,
      hash: key,
      role: role
    }).returning(['id', 'login', 'role', 'active'])
    await knex('user_details').transacting(trx).insert({
      user: user[0].id,
      name,
      fullName,
      registerNumber,
      birthDate
    })
    return user[0].id
  })
}

export {
  validate,
  exist,
  get,
  create,
  generateHash
}
