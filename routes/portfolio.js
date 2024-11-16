const express = require('express');
const router = express.Router();
const PortfolioItem = require('../models/PortfolioItem');

function checkRole(role) {
  return function (req, res, next) {
    if (req.session.user && req.session.user.role === role) {
      next();
    } else {
      res.redirect('/');
    }
  };
}

function checkRoles(roles) {
  return function (req, res, next) {
    if (req.session.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.redirect('/');
    }
  };
}

router.get('/create', checkRoles(['admin', 'editor']), (req, res) => {
  res.render('create');
});

router.post('/create', checkRoles(['admin', 'editor']), async (req, res) => {
  const { title, description, image1, image2, image3 } = req.body;
  const images = [image1, image2, image3];
  const newItem = new PortfolioItem({ title, description, images });
  await newItem.save();
  res.redirect('/');
});

router.get('/edit/:id', checkRole('admin'), async (req, res) => {
  const item = await PortfolioItem.findById(req.params.id);
  res.render('edit', { item });
});

router.post('/edit/:id', checkRole('admin'), async (req, res) => {
  const { title, description, image1, image2, image3 } = req.body;
  const images = [image1, image2, image3];
  await PortfolioItem.findByIdAndUpdate(req.params.id, { title, description, images });
  res.redirect('/');
});

router.post('/delete/:id', checkRole('admin'), async (req, res) => {
  await PortfolioItem.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

module.exports = router;
