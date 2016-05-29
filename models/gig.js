var mongoose = require('mongoose');

// Create a database schema for our Post object
var gigSchema = mongoose.Schema({
    band:String,
    venue:String,
    supports:String,
    date:Date
});

var Gig = mongoose.model('Gig', gigSchema);

module.exports = Gig;
