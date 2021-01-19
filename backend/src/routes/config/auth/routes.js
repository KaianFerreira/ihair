import express from 'express'
import Joi from 'joi'
import jwt from 'jsonwebtoken'
import { exist, validate, create } from './model.js'
import requireAuth from './requireAuth.js'

const router = express.Router()

// Check if user exists
router.post('/exist', async (req, res) => {
  try {
    console.log('REQ /api/auth/exists')
    // Validate request
    const { value, error } = Joi.validate(
      req.body,
      Joi.object().keys({
        login: Joi.string().email().required()
      })
    )
    if (error) {
      console.log(error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: [...new Set(...error.details.map(x => x.path))] })
    }
    // Check if login exists
    const exists = await exist(value.login)
    res.send({ exists })
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: 'Internal error' })
  }
})

// Sign in user
router.post('/signin', async (req, res) => {
  try {
    console.log('REQ /api/auth/signin')
    // Validate request
    const schema = Joi.object().options({ abortEarly: false }).keys({
      login: Joi.string().email().required(),
      password: Joi.string().required()
    })
    const { value, error } = schema.validate(
      req.body,
    )
    if (error) {
      console.log(error.details[0].message)
      return res.status(400).send({ error: 'Invalid login or password', fields: [...error.details.map(x => x.path[0])] })
    }
    // Validate user
    const user = await validate(value.login, value.password)
    if (!user) { return res.status(400).send({ error: 'Invalid login or password' }) }
    if (!user.active) { return res.status(401).send({ error: 'User disabled' }) }
    if (user.role === 'user') {
      if (user.office === false || user.business === false) return res.status(401).send({ error: 'User disabled'})
    }
    // Generate sign token
    delete user.active
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES })
    return res.send({ token, user })
  } catch (error) {
    console.error(error, {
      level: error.level,
      message: error.message,
      stack: error.stack,
      user: req.user ? req.user.id : null
    })
    return res.status(400).send({ error: 'Internal error' })
  }
})

// Sign on user
router.post('/signon', async (req, res) => {
  try {
    console.log('REQ /auth/signon')
    // Validate request
    const schema = Joi.object().options({ abortEarly: false }).keys({
      login: Joi.string().email().required(),
      password: Joi.string().regex(/^[a-zA-Z0-9]{6,20}$/).required(),
      name: Joi.string().required(),
      fullName: Joi.string().required(),
      registerNumber: Joi.string().required(),
      birthDate: Joi.date().allow(null),
      role: Joi.string().allow(null)
    })
    const { value, error } = schema.validate(req.body)
    if (error) {
      console.log(error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: [...error.details.map(x => x.path[0])] })
    }
    // Check if user already exists
    const check = await exist(value.login)
    if (check) { return res.status(400).send({ error: 'User already exists' }) }
    // Create user
    await create(
      value.login,
      value.password,
      value.name,
      value.fullName,
      value.registerNumber,
      value.birthDate,
      value.role
    )
    // Generate sign token
    return res.send(true)
  } catch (error) {
    console.error(error, {
      level: error.level,
      message: error.message,
      stack: error.stack,
      user: req.user ? req.user.id : null
    })
    return res.status(400).send({ error: 'Internal error' })
  }
})

// Get user data and renew JWT token
router.get('/user', requireAuth(), (req, res) => {
  try {
    console.log('REQ /auth/user')
    const user = req.user
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES })
    return res.send({ token, user })
  } catch (error) {
    console.error(error, {
      level: error.level,
      message: error.message,
      stack: error.stack,
      user: req.user ? req.user.id : null
    })
    return res.status(400).send({ error: 'Internal error' })
  }
})

export default router
