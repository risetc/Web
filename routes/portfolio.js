const express = require('express');
const router = express.Router();
const PortfolioItem = require('../models/PortfolioItem');

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

function checkRole(role) {
  return function (req, res, next) {
    if (req.session.user && req.session.user.role === role) {
      next();
    } else {
      res.redirect('/');
    }
  }
}

function checkRoles(roles) {
  return function (req, res, next) {
    if (req.session.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.redirect('/');
    }
  }
}

router.get('/create', ensureAuthenticated, checkRoles(['admin', 'editor']), (req, res) => {
  res.render('create');
});

router.post('/create', ensureAuthenticated, checkRoles(['admin', 'editor']), async (req, res) => {
  const { title, description, images } = req.body;
  console.log('Received images:', images);
  try {
    let imagesArray = [];
    if (Array.isArray(images)) {
      imagesArray = images.filter(img => img.trim() !== '');
    } else if (typeof images === 'string') {
      if (images.trim() !== '') {
        imagesArray = [images];
      }
    }

    console.log('Filtered images:', imagesArray);

    if (imagesArray.length === 0) {
      return res.status(400).send('At least one image URL is required.');
    }

    const newItem = new PortfolioItem({
      title,
      description,
      images: imagesArray
    });

    await newItem.save();
    console.log('Saved new portfolio item:', newItem);
    res.redirect('/');
  } catch (err) {
    console.error('Error saving portfolio item:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/edit/:id', ensureAuthenticated, checkRoles(['admin', 'editor']), async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) return res.redirect('/');
    res.render('edit', { item });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/edit/:id', ensureAuthenticated, checkRoles(['admin', 'editor']), async (req, res) => {
  const { title, description, images } = req.body;
  console.log('Received images for edit:', images);
  try {
    let imagesArray = [];
    if (Array.isArray(images)) {
      imagesArray = images.filter(img => img.trim() !== '');
    } else if (typeof images === 'string') {
      if (images.trim() !== '') {
        imagesArray = [images];
      }
    }

    console.log('Filtered images for edit:', imagesArray);

    if (imagesArray.length === 0) {
      return res.status(400).send('At least one image URL is required.');
    }

    await PortfolioItem.findByIdAndUpdate(req.params.id, {
      title,
      description,
      images: imagesArray,
      updatedAt: Date.now()
    });

    res.redirect('/');
  } catch (err) {
    console.error('Error updating portfolio item:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/delete/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
  try {
    await PortfolioItem.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting portfolio item:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
