var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var Gig = require('./models/Gig');

mongoose.connection.on('error', function (err) {
    console.log(err);
});

mongoose.connect('mongodb://localhost/gigdiary');

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/app/css', express.static(path.join(__dirname, '/app/css')));

app.use(function(req, res, next) {
    req.data = {
        gigs: []
    };
    next();
});

app.get('/', function(req, res, next) {
    Gig.find(function(err, gigs) {
        if (err) {
            res.status(500).send('Shit wnet wrong!');
        } else {
            req.data.gigs = gigs;
            next();
        }
    });
});

app.get('/band/:band', function(req, res, next) {
    Gig.find({ 'band': req.params.band }, 'band venue', function (err, gigs) {
        if (err) console.log(err);

        req.data.gigs = gigs;
        next();
    });
});

app.get('/venue/:venue', function(req, res, next) {
    Gig.find({ 'venue': req.params.venue }, 'band venue', function (err, gigs) {
        if (err) console.log(err);

        req.data.gigs = gigs;
        next();
    });
});

app.get('/search', function(req, res, next) {
    Gig.find({ $or : [
            { band : { '$regex': '.*'+req.query.keyword+'.*', '$options': 'i' } },
            { venue : { '$regex': '.*'+req.query.keyword+'.*', '$options': 'i' } }
        ] })
        .select('band venue')
        .exec(function (err, gigs) {
            if (err) console.log(err);

            req.data.gigs = gigs;
            next();
        });
});

app.post('/add', function(req, res, next) {
    console.log('FOOBAR');
    next();
})

app.use(function(req, res, next) {
    req.data.url = req.url;
    req.data.method = req.method;
    res.render('index', req.data);
});

app.listen(3000);
console.log('Express server start on port 3000.');



