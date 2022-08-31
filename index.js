const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

const bodyParser = require('body-parser');
const express = require('express'),
    morgan = require('morgan');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('common'));




app.get('/', (req, res) => {
    res.send('Welcome to my film app!');
});



//For finding all movies
app.get('/movies', (req, res)=> {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//For finding a director by name                
app.get('/movies/directors/:director', (req, res)=> {
    Movies.findOne({'Director.Name': req.params.director})
        .then((dbResponse) => {
            if (!dbResponse)    {  
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
app.get('/movies/:title', (req, res)=> {
    Movies.findOne({Title: req.params.title})
        .then((movie) => {
            if (!movie)    {  
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
app.get('/movies/genres/:genre', (req, res)=> {
    Movies.findOne({'Genre.Name': req.params.genre})
        .then((dbResponse) => {
            if (!dbResponse)    {  
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
    Users.findOne({Username: req.body.Username})
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) =>{res.status(201).json(user) })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error)
            })
        }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error)
        });
});

//For updating a user
app.put('/users/:username', (req, res) => {
    Users.findOneAndUpdate({Username: req.params.username}, 
        {$set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
    }},
    {new: true},
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

//For finding all users
app.get('/users', (req, res)=> {
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
app.get('/users/:Username', (req, res)=> {
    Users.findOne({Username: req.params.Username})
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


// Add a movie to a user's list of favorites
app.post('/users/:username/movies/:movieID', (req, res) => {
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
app.delete('/users/:username/movies/:movieID', (req, res) => {
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
app.delete('/users/:Username', (req, res) => {
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


app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});