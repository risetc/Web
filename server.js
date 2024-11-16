const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();

mongoose.connect('mongodb+srv://bonchbrew:khnj6DpgOEOCUH6A@final.7frmu.mongodb.net/?retryWrites=true&w=majority&appName=Final', { useNewUrlParser: true });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'секретный ключ',
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');

app.use('/', authRoutes);
app.use('/', portfolioRoutes);

const PortfolioItem = require('./models/PortfolioItem');

app.get('/', async (req, res) => {
  const items = await PortfolioItem.find().sort({ createdAt: -1 });
  res.render('index', { items });
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
