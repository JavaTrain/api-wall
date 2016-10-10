var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var fileSchema = new Schema({
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


var File = mongoose.model('File', fileSchema);

module.exports = File;
