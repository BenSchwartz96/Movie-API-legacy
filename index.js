const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

// local database code
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

//online database code
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const bodyParser = require('body-parser');
const express = require('express'),
  morgan = require('morgan');

const { check, validationResult } = require('express-validator');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('common'));

const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'http://localhost:4200', 'http://testsite.com', 'https://bms-myflix.netlify.app'];

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





app.get('/', (req, res) => {
  res.send('Welcome to my film app!');
});


//For finding all movies
// app.get('/movies', passport.authenticate('jwt', { session: false }),
//   (req, res) => {
//     Movies.find()
//       .then((movies) => {
//         res.status(201).json(movies);
//       })
//       .catch((err) => {
//         console.error(err);
//         res.status(500).send('Error: ' + err);
//       });
//   });

//temp code for 3.4
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

//For finding a director by name                
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

//For finding a specific movie by title
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

//For finding a genre by name                
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


//For posting a user        
app.post('/users', (req, res) => {
  [
    check('Username', 'A username with 5+ characters is required').isLength({ min: 5 }),
    check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'This email does not appear to be valid').isEmail()
  ], (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
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

//For updating a user
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    [
      check('Username', 'A username with 5+ characters is required').isLength({ min: 5 }),
      check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
      check('Password', 'Password is required').not().isEmpty(),
      check('Email', 'This email does not appear to be valid').isEmail()
    ], (req, res) => {

      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
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

//For finding all users
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

//For finding a specific user by username
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


// Add a movie to a user's list of favorites
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


//Remove a movie from a users list of favorites
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

// Delete a user by username
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




app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use('/', express.static('public'));


// app.listen(8080, () => {
//     console.log('Your app is listening on port 8080.');
// });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on port' + port);
});