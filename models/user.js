var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var mongoosePaginate = require('mongoose-paginate');

var User = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    OauthId: String,
    OauthToken: String,
    GoogleOauthId: String,
    GoogleOauthToken: String,
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

User.methods.getName = function(){
    return (this.firstname+' '+this.lastname);
};



User.plugin(passportLocalMongoose);
User.plugin(mongoosePaginate);

module.exports = mongoose.model('User', User);