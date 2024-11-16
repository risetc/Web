const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const newUser = new User({ username, password, role });
  await newUser.save();
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
