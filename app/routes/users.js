const express = require('express');
const router = express.Router();
const request = require('request');
const http = require("http");
const querystring = require('querystring');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.serializeUser((user, done) => {
    console.log('serialized user')
    done(null, user)
})

passport.deserializeUser((user, done) => {
    console.log('deserialized user')
    done(null, user)
})

//Register Page
router.get('/register', function(req, res){
    res.render('users/register');
});

router.post('/register', function(req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;
    var nameValid, emailValid, passwordValid, password2Valid;

    //Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(password);

    var errors = req.validationErrors();
    if(errors){
        if(errors.find(el => el.param === 'name')){
            nameValid = 'is-invalid';
        } else {
            nameValid = 'is-valid';
        }
        if(errors.find(el => el.param === 'email')){
            emailValid = 'is-invalid';
        } else {
            emailValid = 'is-valid';
        }
        if((errors.find(el => el.param === 'password')) || errors.find(el => el.param === 'password2')){
            passwordValid = 'is-invalid';
            password2Valid = 'is-invalid';
        } else {
            passwordValid = 'is-valid';
            password2Valid = 'is-valid';
        }

        res.render('users/register',{
			errors:errors,
            name:name,
            nameValid:nameValid,
            email:email,
            emailValid:emailValid,
            passwordValid:passwordValid,
            password2Valid:password2Valid
		});
    } else {
        var data = querystring.stringify({
          name: name,
          email: email,
          password: password
        });

        var options = {
            host: 'localhost',
            port: 5000,
            path: '/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        var httpreq = http.request(options, function (response) {
            var data = '';
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                data += chunk;
            });
            response.on('end', function() {
                // console.log(data);
                if(data === "err"){
                    req.flash('error_msg', 'Sorry, something went wront. Cannot add register user.');
                    return res.redirect('/users/register');
                }
                if(data === "exsistingUser"){
                    req.flash('error_msg', 'That username or email is already taken.');
                    return res.redirect('/users/register');
                }
                // console.log(data);
                var user = JSON.parse(data);
                req.login(user, function(err) {
                    console.log(user)
                    if (err) {
                        console.log('err')
                        return next(err);
                    }
                    return res.redirect('/users/' + req.user.name);
                });

            })
        });
        httpreq.write(data);
        httpreq.end();
    }
});

router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

router.post('/login', (req, res, next) => {
    console.log('login')
    let data = querystring.stringify({
        email: req.body.username,
        password: req.body.password
    })
    let httpreq = http.request({
        host: 'localhost',
        port: 5000,
        path: '/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    }, response => {
        var data = '';
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            data += chunk;
        })

        response.on('end', () => {
            req.login(JSON.parse(data), err => {
                if (err) return next(err);
                return res.redirect('/')
            })
        })
    })
    httpreq.write(data)
    httpreq.end()
})

function isAuthenticated (req, res, next) {
    if (req.isAuthenticated()) return next();
    console.log('NOT AUTHENTICATED');
    res.redirect('/')
}

router.get('/authReq', isAuthenticated, (req, res, next) => {
    console.log('inside /authreq')
})

module.exports = router;
