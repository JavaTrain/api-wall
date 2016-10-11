var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var filesSchema = new Schema({
    name: {
        type: String,
        // required: true
    },
    mimeType: {
        type: String,
        // required: true
    },
    originalName: {
        type: String,
        // required: true
    },
    link: {
        type: String,
        // required: true
    },
    file: {
        type: String,
        // required: true
    },
}, {
    timestamps: true
});

var commentSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    commentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
});

var messageSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    files: [filesSchema],
    comments: [commentSchema]
}, {
    timestamps: true
});

messageSchema.plugin(mongoosePaginate);
messageSchema.plugin(deepPopulate);

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;