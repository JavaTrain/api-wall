var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Verify    = require('./verify');
var requestify = require('requestify');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/register', function(req, res) {
  User.register(new User({ username : req.body.username }),
      req.body.password, function(err, user) {
        if (err) {
          return res.status(500).json({err: err});
        }
          user.email = req.body.username;
        if(req.body.firstname){
          user.firstname = req.body.firstname;
        }
        if(req.body.lastname){
          user.lastname = req.body.lastname;
        }
        if(req.body.gender){
          user.gender = req.body.gender;
        }if(req.body.phone){
          user.phone = req.body.phone;
        }if(req.body.image){
          user.image = req.body.image;
        }

        user.save(function(err,user){
          passport.authenticate('local')(req, res, function () {
            return res.status(200).json({status: 'Registration Successful!'});
          });
        });
      });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }

      var token = Verify.getToken(user);
      res.status(200).json({
        status: 'Login successful!',
        success: true,
        token: token
      });
    });
  })(req,res,next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

router.route('/:userId')
    .get(Verify.verifyOrdinaryUser, function (req, res, next) {
        User.findById(req.params.userId)
            .exec(function (err, msg) {
                if (err) throw err;
                res.json({user: msg});
            });
    });

router.get('/login/login_with_google_token', function(req,res,next){
    requestify.get('https://www.googleapis.com/oauth2/v2/userinfo?access_token='+req.query.access_token)
        .then(function(response) {
            response = response.getBody();
            if (response.email){
                User.findOne({username: response.email}, function (err, user) {
                    if (err) {
                        console.log(err); //handle errors!!
                    }
                    if (!err && user !== null) {
                        user.email = response.username;/////////////////////////???????????
                        user.GoogleOauthId = response.id;
                        user.GoogleOauthToken = req.query.access_token;
                        user.save(function (err) {
                            if (err) {
                                console.log(err); // handle errors!
                            } else {
                                console.log('saving user...');
                                var token = Verify.getToken(user);

                                return res.status(200).json({
                                    status: 'Login successful',
                                    success: true,
                                    token: token
                                });
                            }
                        });
                    } else {
                        // console.log(profile.emails);
                        user = new User({
                            username: response.email
                        });
                        user.GoogleOauthId = response.id;
                        user.GoogleOauthToken = req.query.access_token;
                        user.save(function (err) {
                            if (err) {
                                console.log(err); // handle errors!
                            } else {
                                console.log('saving user...');
                                var token = Verify.getToken(user);

                                return res.status(200).json({
                                    status: 'Login successful',
                                    success: true,
                                    token: token
                                });
                            }
                        });
                    }
                });
            } else {
                console.log(response);
            }
        });
});

router.get('/google', passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read']
    }),
    function (req, res) {}
);
router.get('/google/callback', function(req,res,next){
    passport.authenticate('google', function(err,user,info){
        if(err){
            return next(err);
        }
        if(!user){
            return err.status(401).json({
                err: info
            });
        }
        req.logIn(user, function(err){
            if (err){
                return res.status(500).json({
                    err: 'Couldn\'t log in user!'
                });
            }
            var token = Verify.getToken(user);

            res.status(200).json({
                status: 'Login successful',
                success: true,
                token: token
            });
        });
    })(req,res,next);
});



router.get(
    '/facebook',
    passport.authenticate('facebook', { scope: 'email'}),
    function(req,res){}
);

router.get('/facebook/callback', function(req,res,next){
    passport.authenticate('facebook', function(err,user,info){
        if(err){
            return next(err);
        }
        if(!user){
            return err.status(401).json({
                err: info
            });
        }
        req.logIn(user, function(err){
            if (err){
                return res.status(500).json({
                    err: 'Couldn\'t log in user!'
                });
            }
            var token = Verify.getToken(user);

            res.status(200).json({
                status: 'Login successful',
                success: true,
                token: token
            });
        });
    })(req,res,next);
});

module.exports = router;