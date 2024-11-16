const express = require('express')
const router = express.Router()
const PortfolioItem = require('../models/PortfolioItem')

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next()
  }
  res.redirect('/login')
}

function checkRole(role) {
  return function (req, res, next) {
    if (req.session.user && req.session.user.role === role) {
      next()
    } else {
      res.redirect('/')
    }
  }
}

function checkRoles(roles) {
  return function (req, res, next) {
    if (req.session.user && roles.includes(req.session.user.role)) {
      next()
    } else {
      res.redirect('/')
    }
  }
}

router.get('/create', ensureAuthenticated, checkRoles(['admin', 'editor']), (req, res) => {
  res.render('create')
})

router.post('/create', ensureAuthenticated, checkRoles(['admin', 'editor']), async (req, res) => {
  const { title, description, images } = req.body
  try {
    let imagesArray = []
    if (Array.isArray(images)) {
      imagesArray = images.filter(img => img)
    } else if (typeof images === 'string') {
      imagesArray = images ? [images] : []
    }
    const newItem = new PortfolioItem({ title, description, images: imagesArray })
    await newItem.save()
    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.status(500).send('Ошибка сервера')
  }
})

router.get('/edit/:id', ensureAuthenticated, checkRoles(['admin', 'editor']), async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id)
    if (!item) return res.redirect('/')
    res.render('edit', { item })
  } catch (err) {
    console.error(err)
    res.status(500).send('Ошибка сервера')
  }
})

router.post('/edit/:id', ensureAuthenticated, checkRoles(['admin', 'editor']), async (req, res) => {
  const { title, description, images } = req.body
  try {
    let imagesArray = []
    if (Array.isArray(images)) {
      imagesArray = images.filter(img => img)
    } else if (typeof images === 'string') {
      imagesArray = images ? [images] : []
    }
    await PortfolioItem.findByIdAndUpdate(req.params.id, { title, description, images: imagesArray })
    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.status(500).send('Ошибка сервера')
  }
})

router.post('/delete/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
  try {
    await PortfolioItem.findByIdAndDelete(req.params.id)
    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.status(500).send('Ошибка сервера')
  }
})

module.exports = router
