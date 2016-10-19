var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Verify    = require('./verify');
var requestify = require('requestify');
var fs = require('fs');

/* GET users listing. */
router.route('/')
    .get(Verify.verifyOrdinaryUser, function (req, res, next) {
        var sorts = {
            lastname: 'lastname',
            email: 'email'
        };
        var limit = Math.abs(req.query.limit * 1);
        var page = Math.abs(req.query.page * 1);
        var sortfield = req.query.sort;
        var sort = {};
        if (sortfield && sortfield[0] == '-') {
            console.log(sortfield.substring(1, sortfield.length));
            sort[sorts[sortfield.substring(1, sortfield.length)]] = 'desc';
        } else if (sortfield) {
            sort[sorts[sortfield]] = 'asc';
        }
        limit = limit ? limit : 2;
        page = page ? page : 1;
        var query = {};
        var options = {
            // select:   'title date author',
            select:   'firstname lastname email image gender phone username',
            // sort: {lastname: -1},
            sort: sort,
            // populate: 'comments.commentBy',
            lean: true,
            page: page,
            limit: limit
        };
        User.paginate(query, options).then(function (result) {
            res.json({
                users: result.docs,
                meta: {
                    pagination: {
                        total: result.total,
                        limit: result.limit,
                        pages: result.pages,
                        page: result.page
                    }
                }
            });
        });
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


router.route('/refresh-token')
    .post(Verify.verifyOrdinaryUser, function (req, res, next) {
        User.findById(req.decoded._doc._id)
            .exec(function (err, user) {
                if (err) throw err;
                var token = Verify.getToken(user);
                console.log(token);
                res.status(200).json({
                    status: 'Token refreshed!',
                    success: true,
                    token: token
                });
            });
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
    })
    .put(Verify.verifyOrdinaryUser, function (req, res, next) {
        User.findByIdAndUpdate(req.params.userId, {
            $set: req.body.user
        }, {
            new: true // return updated entity
        }, function (err, msg) {
            if (err) throw err;
            console.log(msg);
            res.json(msg);
        });
    });
router.route('/:userId/avatar')
    .get(Verify.verifyOrdinaryUser, function (req, res, next) {
        User.findById(req.params.userId)
            .exec(function (err, msg) {
                if (err) throw err;
                res.json({image: msg.image});
            });
    })
    .put(Verify.verifyOrdinaryUser, function (req, res, next) {
        User.findByIdAndUpdate(req.params.userId, {
            $set: req.body.user
        }, {
            new: true // return updated entity
        }, function (err, msg) {
            if (err) throw err;
            console.log(msg);
            res.json(msg);
        });
    })
    .post(Verify.verifyOrdinaryUser, function (req, res, next) {
        User.findById(req.params.userId, function (err, user) {
            if (err) throw err;
            // if(user.image && fs.existsSync(user.image)){
            //     fs.unlinkSync('/upload/avatar/ilya-ilf-i-evgenii-petrov-zolotoi-telenok.jpg');
            // }
            base64Data = req.body.link.split(',')[1];
            var name = req.body.name.split('.');
            var ext = name.pop();
            name = name.join('.')+'-'+new Date().getTime()+new Date().getUTCMilliseconds()+'.'+ext;
            require('fs').writeFile('public/upload/avatar/'+name, base64Data, 'base64', function(err){
                if (err) console.log(err);
            });
            var link = req.protocol + '://' + req.get('host') + '/upload/avatar/' + name;
            user.image = link;
            user.save(function (err, user) {
                if (err) throw err;
                console.log('Added Image!');
                res.json({file:{link: user.image, name:name}});
            });
        });
    /*
     Message.findById(req.params.msgId, function (err, msg) {
     if (err) throw err;
     base64Data = req.body.link.split(',')[1];
     require('fs').writeFile('public/upload/'+req.body.name,base64Data, 'base64', function(err){
     if (err) console.log(err);
     });
     req.body.link = req.protocol + '://' + req.get('host') + '/upload/' + req.body.name;
     msg.files.push(req.body);
     msg.save(function (err, msg) {
     if (err) throw err;
     console.log('Added File!');
     res.json(msg);
     });
     });
     */
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