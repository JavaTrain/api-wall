module.exports = {
    'secretKey': '12345-67890-09876-54321',
    'mongoUrl': 'mongodb://localhost:27017/wall',
    'facebook': {
        clientID: '1312190162126438',
        clientSecret: '26a854ec250e788653492364d4e35047',
        callbackURL: 'http://localhost:3000/api/v1/users/facebook/callback',
        profileFields: ['id', 'emails']

    },
    'google': {
        clientID: "950791375127-mujesd1t22u7343inodacbgp96v8lui9.apps.googleusercontent.com",
        clientSecret: "5PnCiRaeGuLazSrisvZ-1JDT",
        callbackURL: "http://localhost:3000/api/v1/users/google/callback"
    }
    
};