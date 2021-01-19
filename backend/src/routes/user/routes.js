import express from 'express'
import Joi from 'joi'
import multer from 'multer'
import fs from 'fs'

import requireAuth from '../config/auth/requireAuth.js'
import {
  getAll,
  get,
  create,
  update,
  remove,
  updatePhoto
} from './model.js'

const router = express.Router()
const upload = multer({ dest: `${process.env.FOLDER_DATA}/tmp`})

const uploadPhoto = (file, id) => {
  if (file) {
    // If folder does not exists
    if (!fs.existsSync(`${process.env.FOLDER_DATA}/user/${id}`)) {
      fs.mkdirSync(`${process.env.FOLDER_DATA}/user/${id}`, { recursive: true })
    }
    // If photo exists
    if (fs.existsSync(`${process.env.FOLDER_DATA}/user/${id}/profile.jpg`)) {
      fs.unlinkSync(`${process.env.FOLDER_DATA}/user/${id}/profile.jpg`)
    }
    // Copy temp image to user folder
    fs.copyFileSync(`${process.env.FOLDER_DATA}/tmp/${file.filename}`, `${process.env.FOLDER_DATA}/user/${id}/profile.jpg`)
    fs.unlinkSync(`${process.env.FOLDER_DATA}/tmp/${file.filename}`)
  }
}

router.get('/', async (req, res) => {
  try {
    console.log('GET /user')
    // Validate request
    const users = await getAll()
    res.send(users)
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: 'Internal error' })
  }
})

router.get('/:id', requireAuth(), async (req, res) => {
  try {
    console.log('GET /user/:id')
    const schema = Joi.object().keys({
      id: Joi.number().integer().required()
    })
    const { value, error } = schema.validate(req.params)

    if (error) {
      console.log(error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: ['id'] })
    }

    const user = await get(value.id)
    res.send(user)
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: 'Internal error'})
  }
})

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    console.log('POST /user')
    const schema = Joi.object().options({ abortEarly: false }).keys({
      login: Joi.string().email().required(),
      password: Joi.string().regex(/^[a-zA-Z0-9]{6,20}$/).required(),
      name: Joi.string().required(),
      fullName: Joi.string().required(),
      registerNumber: Joi.string().required(),
      role: Joi.string().allow(null),
      photo: Joi.any().allow(null),
      active: Joi.boolean().required()
    })
    // Validate request
    const { value, error } = schema.validate(req.body)
    if (error) {
      console.log(error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: [...error.details.map(x => x.path[0])] })
    }

    const user = await create(
      value.login,
      value.password,
      value.name,
      value.fullName,
      value.registerNumber,
      value.role,
      value.active
    )

    if (req.file) {
      uploadPhoto(req.file, user)
      await updatePhoto (req.file ? `${process.env.API_DATA}/user/${user}/profile.jpg` : null, user)
    }

    res.send(true)
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: 'Internal error' })
  }
})

router.put('/:id', requireAuth(), upload.single('photo'), async (req, res) => {
  try {
    console.log('PUT /user')
    const schemaParams = Joi.object().options({ abortEarly: false}).keys({
      id: Joi.number().integer().required()
    })
    const params = schemaParams.validate(req.params)

    if (params.error) {
      console.log(params.error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: ['id'] })
    }

    const schemaBody = Joi.object().options({ abortEarly: false }).keys({
      login: Joi.string().email().empty('').required(),
      password: Joi.string().regex(/^[a-zA-Z0-9]{6,20}$/).empty('').allow(null),
      name: Joi.string().required(),
      fullName: Joi.string().required(),
      registerNumber: Joi.string().required(),
      role: Joi.string().empty('').allow(null),
      photo: Joi.any().allow(null),
      active: Joi.boolean().required()
    })
    const body = schemaBody.validate(req.body)

    if (body.error) {
      console.log(body.error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: [...body.error.details.map(x => x.path[0])]})
    }

    // Validate request
    const user = await update(
      params.value.id,
      body.value.login,
      body.value.password,
      body.value.name,
      body.value.fullName,
      body.value.registerNumber,
      body.value.role,
      body.value.active
    )

    uploadPhoto(req.file, user)
    if (req.file) {
      await updatePhoto (req.file ? `${process.env.API_DATA}/user/${user}/profile.jpg` : null, user)
    }
    res.send(true)
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: 'Internal error' })
  }
})

router.delete('/:id', requireAuth('admin'), async (req, res) => {
  try {
    console.log('DELETE /user/:id')

    const schema = Joi.object().keys({
      id: Joi.number().integer().required()
    })
    const { value, error } = schema.validate(req.params)

    if (error) {
      console.log(error.details[0].message)
      return res.status(400).send({ error: 'Validation error', fields: ['id'] })
    }

    await remove(value.id)
    res.send(true)
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: 'Internal error'})
  }
})

export default router
