const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

// local database code
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });


//For connecting to online database. CONNECTION_URI is the name of the env. var. on heroku. 
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const bodyParser = require('body-parser');
const express = require('express'),
  morgan = require('morgan');

const { body, check, validationResult } = require('express-validator');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('common'));



/**
 * CORS 
 */
const cors = require('cors');

/**
 * Allowed origins
 */
let allowedOrigins = [
  'http://localhost:8080', 
  'http://localhost:1234', 
  'http://localhost:4200', 
  'http://testsite.com', 
  'https://bms-myflix.netlify.app', 
  'https://benschwartz96.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {      //for if a specific origin isnt found on the list of allowed origins
      let message = 'The CORS policy for this application doesn\'t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app)

const passport = require('passport');
require('./passport');



/**
 * GET request to the base endpoint, which is a welcome page containing a link to documentation from '/' endpoint
 * @kind function
 * @returns Welcome page
 */
app.get('/', (req, res) => {
  res.send('Welcome to my film app!');
});



/**
 * GET request to get data on all all movies
 * Request body: Bearer token
 * @name getAllMovies
 * @kind function
 * @returns JSON object holding data of all movies
 * @requires passport
 */
app.get("/movies", passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.find()
      .then(function (movies) {
        res.status(201).json(movies);
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  });


/**
 * GET request to get data on a specific movie
 * Request body: Bearer token
 * @name getMovie
 * @kind function
 * @param {string} title
 * @returns JSON object holding data of target movie
 * @requires passport
 */ 
app.get('/movies/:title', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.title })
      .then((movie) => {
        if (!movie) {
          return res.status(404).send('This movie is not in the database');
        } else {
          res.json(movie);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


/**
 * GET request to get data on a specific director
 * Request body: Bearer token
 * @name getDirector
 * @kind function
 * @param {string} director
 * @returns JSON object holding data of target director
 * @requires passport
 */             
app.get('/movies/directors/:director', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.director })
      .then((dbResponse) => {
        if (!dbResponse) {
          return res.status(404).send('This director is not in this database');
        } else {
          res.json(dbResponse.Director);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


/**
 * GET request to get data on a specific director
 * Request body: Bearer token
 * @name getGenre
 * @kind function
 * @param {string} genre
 * @returns JSON object holding data of target genre
 * @requires passport
 */                  
app.get('/movies/genres/:genre', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.genre })
      .then((dbResponse) => {
        if (!dbResponse) {
          return res.status(404).send('This genre is not in this database');
        } else {
          res.json(dbResponse.Genre);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


/**
 * POST request to create a new user and post their info to database
 * Request body: Object holding data about new user, consisting of Username, hashed Password, Email, and Birthday 
 * @name userRegistration
 * @kind function
 * @returns JSON object holding data of user
 */         
app.post('/users',
  [
    body('Username', 'A username with 5+ characters is required').isLength({ min: 5 }),
    body('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
    body('Password', 'Password is required').not().isEmpty(),
    body('Email', 'This email does not appear to be valid').isEmail()
  ], (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + 'already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error)
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error)
      });
  });


/**
 * PUT request to update the information of a user
 * Request body: Bearer token + Object holding updated user information
 * @name updateUser
 * @kind function
 * @param {string} username
 * @returns JSON object holding updated data of user
 * @requires passport
 */  
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
  [
    body('Username', 'A username with 5+ characters is required').isLength({ min: 5 }),
    body('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
    body('Password', 'Password is required').not().isEmpty(),
    body('Email', 'This email does not appear to be valid').isEmail()
  ], (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }


    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      });
  });


/**
 * GET request to find all users
 * Request body: Bearer token
 * @name getAllUsers
 * @kind function
 * @returns JSON object holding data on all users
 * @requires passport
 */
app.get('/users', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


/**
 * GET request to find data on a specific user
 * Request body: Bearer token
 * @name getUser
 * @kind function
 * @param {string} Username
 * @returns JSON object holding data on target user
 * @requires passport
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


/**
 * POST request to add a specific movie to users list of favorite movies
 * Request body: Bearer token
 * @name addFaveMovie
 * @kind function
 * @param {string} username
 * @param {string} movieID
 * @returns JSON object holding updated data of user
 * @requires passport
 */
app.post('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.username }, {
      $push: { FavoriteMovies: req.params.movieID }
    },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      });
  });


/**
 * DELETE request to remove a specific movie from users list of favorite movies
 * Request body: Bearer token
 * @name removeFaveMovie
 * @kind function
 * @param {string} username
 * @param {string} movieID
 * @returns JSON object holding updated data of user
 * @requires passport
 */
app.delete('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.username }, {
      $pull: { FavoriteMovies: req.params.movieID }
    },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      });
  });


/**
 * DELETE request to delete a specific user
 * Request body: Bearer token
 * @name removeFaveMovie
 * @kind function
 * @param {string} Username
 * @returns message indicating successful deletion of user from DB
 * @requires passport
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });



/**
 * Error handler
 * @name errorHandler
 * @kind function
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.use('/', express.static('public'));


/**
 * Request listener
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on port' + port);
});