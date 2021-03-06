var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require('mongoose');
var Gig = require('./models/gig');
var moment = require('moment');

mongoose.connection.on('error', function (err) {
    console.log('Error:', err);
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/gigdiary');

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.set('port', (process.env.PORT || 3000));

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use('/app/css', express.static(path.join(__dirname, '/app/css')));
app.use('/app/js', express.static(path.join(__dirname, '/app/js')));

var PAGE_SIZE = 10;

app.use(function(req, res, next) {
    req.data = {
        gigs: [],
        gig: {},
        page: {
            size: PAGE_SIZE,
            num: 1,
            skip: 0
        }
    };
    next();
});

app.get('/:num(\\d+)?', function(req, res, next) {
    if (req.params.num) {
        req.data.page.num = +req.params.num;
        req.data.page.skip = (req.params.num-1) * PAGE_SIZE;
    }

    Gig.count({}, function(err, count) {
        if (err) return console.log('Error:', err);
        var totalPages = Math.ceil(count / PAGE_SIZE);

        req.data.page.prev = req.data.page.num > 1 ? req.data.page.num - 1 : null;
        req.data.page.next = req.data.page.num < totalPages ? req.data.page.num + 1 : null;

        req.data.page.totalCount = count;
        req.data.page.totalPages = totalPages;
    });

    Gig.find()
      .skip(req.data.page.skip)
      .limit(req.data.page.size)
      .exec(function(err, gigs) {
        if (err) {
            res.status(500).send('Shit wnet wrong!');
        } else {
            req.data.gigs = gigs;
            next();
        }
    });
});

app.get('/band/:band', function(req, res, next) {
    Gig.find({ 'band': req.params.band }, function (err, gigs) {
        if (err) console.log('Error:', err);

        req.data.gigs = gigs;
        next();
    });
});

app.get('/venue/:venue', function(req, res, next) {
    Gig.find({ 'venue': req.params.venue }, function (err, gigs) {
        if (err) console.log('Error:', err);

        req.data.gigs = gigs;
        next();
    });
});

app.get('/search', function(req, res, next) {
    Gig.find({ $or : [
            { band : { '$regex': '.*'+req.query.keyword+'.*', '$options': 'i' } },
            { venue : { '$regex': '.*'+req.query.keyword+'.*', '$options': 'i' } },
            { supports : { '$regex': '.*'+req.query.keyword+'.*', '$options': 'i' } }
        ] })
        .exec(function (err, gigs) {
            if (err) console.log('Error:', err);

            req.data.gigs = gigs;
            next();
        });
});

app.post('/add', function(req, res, next) {
    var date = undefined;
    if (req.body.date) {
        date = moment.utc(req.body.date).valueOf();
    }

    Gig.create({
        band: req.body.band,
        venue: req.body.venue,
        supports: req.body.supports,
        date: date
    }, function (err) {
        if (err) return console.log('Error:', err);

        next();
    });
})

app.get('/edit/:id', function(req, res, next) {
    Gig.find({ '_id': req.params.id }, function (err, gigs) {
        if (err) console.log('Error:', err);

        req.data.gig = gigs[0];
        next();
    });
});

app.post('/edit/:id', function(req, res, next) {
    var date = undefined;
    if (req.body.date) {
        date = moment.utc(req.body.date).valueOf();
    }

    Gig.update({ _id: req.params.id }, {
            band: req.body.band,
            venue: req.body.venue,
            supports: req.body.supports,
            date: date
        },
        null, function (err, raw) {
            if (err) return console.log('Error:', err);
            // console.log('The raw response from Mongo was ', raw);

            req.data.gig = {
                _id: req.params.id,
                band: req.body.band,
                venue: req.body.venue,
                supports: req.body.supports,
                date: date
            };

            next();
        }
    );
});

app.get('/delete/:id', function(req, res, next) {
    Gig
        .find({ '_id': req.params.id }, function (err, gigs) {})
        .remove( function(err) {
            if (err) return console.log(err);

            res.redirect(req.get('Referrer'));
        }
    );
})

app.use(function(req, res, next) {
    req.data.url = req.url;
    req.data.method = req.method;
    req.data.moment = moment;

    res.render('index', req.data);
});

app.listen(app.get('port'));
console.log('Express server start on port', app.get('port'));



