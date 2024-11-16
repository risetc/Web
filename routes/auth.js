const express = require('express')
const router = express.Router()
const User = require('../models/User')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')

router.get('/register', (req, res) => {
  res.render('register')
})

router.post('/register', async (req, res) => {
  const { username, password, firstName, lastName, age, gender, role } = req.body
  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) return res.send('User already exists')
    const newUser = new User({ username, password, firstName, lastName, age, gender, role })
    await newUser.save()
    const secret = speakeasy.generateSecret({ name: `Portfolio (${username})` })
    newUser.twoFactorSecret = secret.base32
    await newUser.save()
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url)
    req.session.tempUserId = newUser._id
    res.render('verify-2fa', { qrCodeDataURL })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

router.post('/verify-2fa', async (req, res) => {
  const { token } = req.body
  const userId = req.session.tempUserId
  if (!userId) return res.redirect('/login')
  try {
    const user = await User.findById(userId)
    if (!user) return res.send('User not found')
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    })
    if (verified) {
      user.isTwoFactorEnabled = true
      await user.save()
      req.session.user = { id: user._id, username: user.username, role: user.role }
      req.session.tempUserId = null
      res.redirect('/')
    } else {
      res.send('Invalid token 2FA')
    }
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await User.findOne({ username })
    if (!user) return res.send('Invalid credentials')
    if (user.lockUntil && user.lockUntil > Date.now()) return res.send('The account is blocked. Try again later')
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      user.failedLoginAttempts += 1
      if (user.failedLoginAttempts >= 3) {
        user.lockUntil = Date.now() + 15 * 60 * 1000
      }
      await user.save()
      return res.send('Invalid credentials')
    }
    user.failedLoginAttempts = 0
    user.lockUntil = undefined
    await user.save()
    if (user.isTwoFactorEnabled) {
      req.session.tempUserId = user._id
      res.redirect('/login-2fa')
    } else {
      req.session.user = { id: user._id, username: user.username, role: user.role }
      res.redirect('/')
    }
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

router.get('/login-2fa', (req, res) => {
  if (!req.session.tempUserId) return res.redirect('/login')
  res.render('login-2fa')
})

router.post('/login-2fa', async (req, res) => {
  const { token } = req.body
  const userId = req.session.tempUserId
  if (!userId) return res.redirect('/login')
  try {
    const user = await User.findById(userId)
    if (!user) return res.send('User not found')
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    })
    if (verified) {
      req.session.user = { id: user._id, username: user.username, role: user.role }
      req.session.tempUserId = null
      res.redirect('/')
    } else {
      res.send('Invalid 2FA token')
    }
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err)
      return res.status(500).send('Server error')
    }
    res.redirect('/login')
  })
})

module.exports = router
