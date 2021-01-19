import knex from '../config/knex.js'
import crypto from 'crypto'

const generateHash = (password, hash = null) => {
  const key = hash ? hash : crypto.randomBytes(16).toString('base64')
  const pass = crypto.pbkdf2Sync(password, Buffer.from(key, 'base64'), 10000, 64, 'SHA1').toString('base64')
  return { pass, key }
}

const getAll = async (active = true ) => {
  return knex('user_details')
    .leftJoin('user', 'user.id', 'user_details.user')
    .where('user.active', active)
    .andWhere('user.role', 'user')
    .select('user_details.*')
}

const get = async (id) => {
  return knex('user_details')
    .leftJoin('user', 'user.id', 'user_details.user')
    .select('user_details.*', 'user.login as userLogin')
    .where('user', id)
    .first()
}

const create = async (
  login,
  password,
  name,
  fullName,
  registerNumber,
  role = 'user',
  active
) => {
  const { pass, key } = generateHash(password)
  return knex.transaction(async trx => {
    const user = await knex('user').transacting(trx).insert({
      login,
      password: pass,
      hash: key,
      role: role,
      active
    }).returning(['id', 'login', 'role', 'active'])
    await knex('user_details').transacting(trx).insert({
      user: user[0].id,
      name,
      fullName,
      registerNumber
    })
    return user[0].id
  })
}

const update = async (
  id,
  login,
  password,
  name,
  fullName,
  registerNumber,
  role = 'user',
  active
  ) => {
    return knex.transaction(async trx => {
      const userDetails = await knex('user_details').transacting(trx).update({
        name,
      fullName,
      registerNumber,
    }).where('id', id)
    .returning(['id', 'user'])
    if (password) {
      const { pass, key } = generateHash(password)
      const user = await knex('user').transacting(trx).update({
        login,
        password: pass,
        hash: key,
        role: role,
        active
      })
      .where('id', userDetails[0].user).returning(['id', 'login', 'role', 'active'])
      return user[0].id
    } else {
      const user = await knex('user').transacting(trx).update({
        login,
        role: role,
        active
      })
      .where('id', userDetails[0].user).returning(['id', 'login', 'role', 'active'])
      return user[0].id
    }
  })
}

const updatePhoto = async(path, user) => {
  return knex('user_details')
    .where('user', user)
    .update({
      photo: path
    })
}

const remove = (id) => {
  return knex('user')
    .where('id', id)
    .del()
}

export {
  getAll,
  get,
  create,
  update,
  updatePhoto,
  remove,
}
