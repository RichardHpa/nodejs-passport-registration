//npm modules
const express = require('express');
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');

const dbconfig = require('./config/database');
const connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);

// configure passport.js to use the local strategy
passport.use('signIn', new LocalStrategy(
    {
         usernameField: 'email',
         passReqToCallback : true
     },
    function(req, email, password, done) {
        connection.query("SELECT * FROM users WHERE email ='"+email+"'", function(err, rows) {
            if(err){
                return done(err)
            }
            if(!rows.length){
                return done(null,null, 'cant find user');
            }
            if(!bcrypt.compareSync(password, rows[0].password)){
                return done(null,null, 'password dont match');
            }
            return done(err, rows[0]);
        });
    }
));


passport.use('local-signup', new LocalStrategy(
    {
        usernameField: 'email',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        connection.query("SELECT * FROM users WHERE email ='"+email+"'", function(err, rows) {
            console.log(rows);
            if(err){
                return done(err)
            }
            if(rows.length){
                console.log("email already exsits")
                return done(null, false);
            }
            var newUserMysql = {
                name: req.body.name,
                email: email,
                password: bcrypt.hashSync(password, null, null)
            };

            var insertQuery = `INSERT INTO users ( name, email, password ) values ('${newUserMysql.name}','${newUserMysql.email}','${newUserMysql.password}');`;
            connection.query(insertQuery, err => {
                // newUserMysql.id = res.insertId;
                // req.flash('success_msg', 'You are now registered and can now login');
                console.log("added a new user")
                return done(null, newUserMysql);
            });
        });
    }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
  console.log('Inside serializeUser callback. User id is save to the session file store here')
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('Inside deserializeUser callback')
  console.log(`The user id passport saved in the session file store is: ${id}`)
  const user = users[0].id === id ? users[0] : false;
  done(null, user);
});

// create the server
const app = express();

// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({
    genid: (req) => {
        console.log('Inside session middleware genid function')
        console.log(`Request object sessionID from client: ${req.sessionID}`)
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// create the homepage route at '/'
app.get('/', (req, res) => {
  console.log('Inside the homepage callback')
  console.log(req.sessionID)
  res.send(`You got home page!\n`)
})

// create the login get and post routes
app.get('/login', (req, res) => {
  console.log('Inside GET /login callback')
  console.log(req.sessionID)
  res.send(`You got the login page!\n`)
})


app.post('/login', (req, res, next) => {
    console.log('Inside POST /login callback')
    passport.authenticate('signIn', (err, user, info) => {
        console.log("in authenticate")
        if(err){
            console.log(err);
            return res.send(err);
        }
        if(!user){
            console.log("redirect");
            return res.send(info);
        }
        return res.send(user);
    })(req, res, next);
});

// create the register get and post routes
app.get('/register', (req, res) => {
  console.log('Inside GET /register callback')
  console.log(req.sessionID)
  res.send(`You got the register page!\n`)
})

app.post('/register', (req, res, next) => {
    console.log('Inside POST /Register callback')
    passport.authenticate('local-signup', (err, user, info) => {
        console.log("register a new user");
        if(err){
            return res.send("err");
        }
        if(!user){
            return res.send("exsistingUser");
        }else{
            return res.send(user);
        }
    })(req, res, next);
});

app.get('/user/:id', (req, res) =>{
    connection.query("SELECT id,name,email,imageName FROM users WHERE id ='"+req.params.id+"'", function(err, row) {
        if(err){
            res.send("There is an error");
        }
        if(!row.length){
            res.send("no user found");
        } else {
            res.send(row[0]);
        }
    });
});

app.get('/authrequired', (req, res) => {
  console.log('Inside GET /authrequired callback')
  console.log(`User authenticated? ${req.isAuthenticated()}`)
  if(req.isAuthenticated()) {
    res.send('you hit the authentication endpoint\n')
  } else {
    res.redirect('/')
  }
})


// tell the server what port to listen on
app.listen(5000, () => {
  console.log('Listening on localhost:5000')
})
