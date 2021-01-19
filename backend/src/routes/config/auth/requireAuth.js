import jwt from 'jsonwebtoken'

import { get as getUser } from './model.js'


const decodeJWT = async (token) => new Promise((resolve, reject) => {
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) reject(error)
    else resolve(decoded)
  })
})

// Verify if token and user are valid
const requireAuth = (role = null) => async (req, res, next) => {
  try {
    let token = null
    // Get token from header
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      token = req.headers.authorization.split(' ')[1]
    } else {
      token = req.query.token
    }
    if (token) {
      const decoded = await decodeJWT(token)
      const user = await getUser(decoded.id)
      if (!user) { return res.status(401).send({ error: 'User not found' }) }
      if (!user.active) { return res.status(401).send({ error: 'User disabled' }) }
      if (role && user.role !== role) { return res.status(401).send({ error: 'Permiission denied' }) }
      // Save user on req for foward requests
      req.user = user
      return next()
    } else {
      return res.status(401).send({ error: 'JWT token not found' })
    }
  } catch (error) {
    return res.status(401).send({ error: 'JWT error' })
  }
}

export default requireAuth