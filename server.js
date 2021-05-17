require('dotenv').config()
const fs = require('fs');
const http = require('http');
const https = require('https');
const privateKey = fs.existsSync('certs/privkey.pem')
  ? fs.readFileSync('certs/privkey.pem', 'utf8')
  : undefined;
const certificate = fs.existsSync('certs/cert.pem')
  ? fs.readFileSync('certs/cert.pem', 'utf8')
  : undefined;
const credentials = privateKey !== undefined && certificate !== undefined
  ? { key: privateKey, cert: certificate }
  : undefined;
const cors = require('cors')
const express = require('express')
const app = express()

// Basic Configuration
const port = process.env.PORT || 3000;
// Database connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).catch((exc) => {
  console.log(exc);
});
// Models
const { Exercise } = require('./schemas/exerciseSchema');
const { User } = require('./schemas/userSchema');

// App initialization
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json()) // To parse the incoming requests with JSON payloads

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// API endpoints
// Add User
app.post('/api/users', async (req, res, next) => {
  console.log(req.body);
  const uname = req.body.username;
  if (uname === undefined || uname === "") next(new Error('A username need to be given'));
  try {
    const newUser = await User.create({ username: uname });
    res.json(newUser);
  }
  catch(e) {
    next(new Error(`Error creating user ${req.body.username}:\n${e.toString()}`));
  }
});

// Get all users
app.get('/api/users', async (req, res, next) => {
  const allUsers = await User.find({}).select({exercises: 0}).exec();
  res.json(allUsers);
});

// Add Exercise to User
app.post('/api/users/:uid/exercises', async (req, res, next) => {
  console.log(req.body);
  const uid = req.params.uid;
  const desc = req.body.description;
  const dur = req.body.duration;
  const dat = req.body.date;
  try {
    const user = await User.findById(uid);
    if (!user) next(new Error(`User with id ${uid} not found`));
    const newExercise = await Exercise.create({
      userId: uid,
      description: desc,
      duration: dur,
      date: dat || new Date()
    });
    user.exercises.push(newExercise);
    await user.save();
    res.json(newExercise);
  }
  catch (e) {
    next(new Error(`Error adding new exercise to user ${uid}:\n${e.toString()}`));
  }
});

// Get list of exercises of the user
app.get('/api/users/:_id/logs', async (req, res, next) => {
  const uid = req.params._id;
  const pFrom = req.query.from;
  const pTo = req.query.to;
  const pLimit = parseInt(req.query.limit);
  try {
    let user = await User.findById(uid, {exercises: 0, __v: 0}).lean();
    if (!user) next(new Error(`User with id ${uid} not found`));
    let logQuery = Exercise.find({userId: uid}, {description: 1, duration: 1, date: 1, _id: 0});
    if (pFrom)
      logQuery = logQuery.where({
          date: { $gte: pFrom }
        });
    if (pTo)
      logQuery = logQuery.where({
          date: { $lte: pTo }
        });
    if (pLimit)
      logQuery = logQuery = logQuery.limit(pLimit);
    const log = await logQuery.exec();
    user.count = log.length;
    user.log = log;
    res.json(user);
  }
  catch (e) {
    next(new Error(`Error getting exercises of user ${uid}:\n${e.toString()}`));
  }
});

//Error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.json({ error: err.message });
});

// Listen for requests
let apiServer;
if (credentials)
  apiServer = https.createServer(credentials, app);
else
  apiServer = http.createServer(app);

apiServer.listen(port, function () {
  console.log('Your app is listening on port ' + apiServer.address().port);
});

/*
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
*/