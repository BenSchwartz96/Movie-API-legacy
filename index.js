const express = require('express'),
    morgan = require('morgan');
const app = express();


let topMovies = [
    {
        title: 'Lock, Stock, and Two Smoking Barrels',
        director: 'Guy Ritchie'
    },
    {
        title: 'WALL-E',
        director: 'Andrew Stanton'
    },
    {
        title: 'The Raid',
        director: 'Gareth Evans'
    },
    {
        title: 'Kick-Ass',
        director: 'Matthew Vaughn & Jeff Wadlow'        
    },
    {
        title: 'The Grand Budapest Hotel',
        director: 'Wes Anderson'        
    },
    {
        title: 'Pulp Fiction',
        director: 'Quentin Tarantino'        
    },
    {
        title: 'The Hateful Eight',
        director: 'Quentin Tarantino'        
    },
    {
        title: 'The Lives of Others',
        director: 'Florian Henckel von Donnersmarck'   
    },
    {
        title: 'Everything Everywhere All At Once',
        director: 'Daniel Kwan & Daniel Scheinert'        
    },
    {
        title: 'The Cabin in the Woods',
        director: 'Drew Goddard'        
    },

  ];

  let directors = [
    {
        name: 'Guy Ritchie',
        bio: 'Blank',
        dob: '1968'        
    },
    {
        name: 'Andrew Stanton',
        bio: 'Also blank',
        dob: '1965'
    }
    
  ]


    app.use(morgan('common'));


    app.get('/', (req, res) => {
        res.send('Welcome to my film app!');
    });  

     app.get('/movies', (req, res) => {
        res.json(topMovies);
    });

    app.get('/movies/directors', (req, res) => {
      res.json(directors);
    });

    app.get('/movies/directors/:name', (req, res) => {
        res.json(directors.find((director) => 
        {return director.name === req.params.name}));
    });
  
    app.get('/movies/:title', (req, res) => {
      res.json(topMovies.find((movie) => 
      {return movie.title === req.params.title}));
    });
    
    // app.get('/movies/:genre', (req, res) => {
    //     res.json(topMovies.find((movie) => 
    //     {return movie.title === req.params.title}));
    // });//incomplete
    

    app.post('/users', (req, res) => {
        res.send('successful post request');
    });

    app.put('/users/:name', (req, res) => {
    //code hre
    });

    app.post('/users/:name/favorites', (req, res) => {
    //code here
    });
  
    app.delete('/users/:name/favorites', (req, res) => {
    //code here
    });

    app.delete('/users/:name', (req, res) => {
    //code here
    });



    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });


    app.use('/', express.static('public'));


    app.listen(8080, () => {
        console.log('Your app is listening on port 8080.');
    });