const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const session = require('express-session')
const methodOverride = require('method-override')
const MongoStore = require('connect-mongo')
const dotenv = require('dotenv')
const axios = require('axios')

dotenv.config()

const app = express()

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24
    }
  })
)

app.use((req, res, next) => {
  res.locals.session = req.session
  res.locals.currentTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  next()
})

const authRoutes = require('./routes/auth')
const portfolioRoutes = require('./routes/portfolio')

app.use('/', authRoutes)
app.use('/', portfolioRoutes)

const PortfolioItem = require('./models/PortfolioItem')

app.get('/', async (req, res) => {
  try {
    const newsResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json')
    const topStories = newsResponse.data.slice(0, 5)
    const newsPromises = topStories.map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
    const newsData = await Promise.all(newsPromises)
    const news = newsData.map(response => response.data)

    const jokeResponse = await axios.get('https://official-joke-api.appspot.com/jokes/random')
    const joke = jokeResponse.data

    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const places = [
      {
        name: 'Baiterek Monument',
        description: 'Baiterek is a symbol of Astana and Kazakhstan, representing the ancient legend of the tree of life and how a child climbed to the top of the tree, creating a solar tower.',
        images: ['/images/bayterek1.jpg', '/images/bayterek2.jpg', '/images/bayterek3.jpg']
      },
      {
        name: 'Central Park of Culture and Leisure',
        description: 'The Central Park of Culture and Recreation is a great place for walking, relaxing and enjoying nature in the heart of the city.',
        images: ['/images/park1.jpeg', '/images/park2.jpg', '/images/park3.jpg']
      }
    ]

    const items = await PortfolioItem.find().sort({ createdAt: -1 })
    res.render('index', { places, news, joke, today, items })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`The server is running on the port ${PORT}`)
})
