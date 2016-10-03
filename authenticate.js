var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook');
var GoogleStrategy   = require( 'passport-google-oauth2' ).Strategy;

var User = require('./models/user');
var config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.google = passport.use(new GoogleStrategy({
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        passReqToCallback: true
    },
    function (request, accessToken, refreshToken, profile, done) {
        console.log(JSON.stringify(profile));
        User.findOne({GoogleOauthId: profile.id}, function (err, user) {
            if (err) {
                console.log(err); //handle errors!!
            }
            if (!err && user !== null) {
                done(null, user);
            } else {
                // console.log(profile.emails);
                user = new User({
                    username: profile.email
                });
                user.GoogleOauthId = profile.id;
                user.GoogleOauthToken = accessToken;
                user.save(function (err) {
                    if (err) {
                        console.log(err); // handle errors!
                    } else {
                        console.log('saving user...');
                        done(null, user);
                    }
                });
            }
        });



        // asynchronous verification, for effect...
        // process.nextTick(function () {
        //
        //     // To keep the example simple, the user's Google profile is returned to
        //     // represent the logged-in user.  In a typical application, you would want
        //     // to associate the Google account with a user record in your database,
        //     // and return that user instead.
        //     return done(null, profile);
        // });
    }));

exports.facebook = passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL
}, function (accessToken, refreshToken, profile, done) {
    User.findOne({OauthId: profile.id}, function (err, user) {
        if (err) {
            console.log(err); //handle errors!!
        }
        if (!err && user !== null) {
            done(null, user);
        } else {
            // console.log(profile.emails);
            user = new User({
                email: profile.displayName
            });
            user.OauthId = profile.id;
            user.OauthToken = accessToken;
            user.save(function (err) {
                if (err) {
                    console.log(err); // handle errors!
                } else {
                    console.log('saving user...');
                    done(null, user);
                }
            });
        }
    });
}));