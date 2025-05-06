const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

const { User, Exercise } = require('./persistence')

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use((req, res, next) => {
  next()
}, bodyParser.urlencoded({ extended: false }))

//create user
app.post('/api/users', async (req, res) => {
  const username = req.body.username

  if (!username) {
    res.json({ "error": "not username given" })
  }

  const user = await User.create({ username: username })

  res.json(user)
})

// get users
app.get('/api/users', async (req, res) => {

  const users = await User.find({})

  res.json(users)
})

//create exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  const body = req.body

  if (!body) {
    res.json({ "error": "data not given" })
  }

  const user = await User.findOne({ _id: req.params._id })

  const exercise = await Exercise.create({
    user: req.params._id,
    description: body.description,
    duration: body.duration,
    date: body.date || Date.now()
  })

  // Format the date like "Mon Jan 01 1990"
  const formattedDate = exercise.date.toDateString();

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: formattedDate,
    _id: user._id
  });
})

//get logs
app.get('/api/users/:_id/logs', async (req, res) => {

  const user = await User.findOne({ _id: req.params._id })

  const filter = { user: req.params._id };

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) {
      filter.date.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filter.date.$lte = new Date(req.query.to);
    }
  }

  let query = Exercise.find(filter)

  if (req.query.limit) {
    query = query.limit(parseInt(req.query.limit));
  }

  const exercises = await query

  res.json({
    username: user.username,
    _id: user._id,
    count: exercises.length,
    log: exercises.map(item => ({
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    }))
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
