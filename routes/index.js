var express = require('express'),
    db = require('../models/db.js'),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    os = require('os');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/checkouts', function(req, res, next) {
  res.render('checkouts', { title: 'Express' });
});

router.get('/migration/:day/:month/:year', function(req, res, next) {
    var date = new Date(Date.parse(
        req.params.month + ' ' + req.params.day + ' ' + req.params.year));
    db.get_daily_status(date).then(function(result) {
        res.render('report', {guests:result, date:date});
    });
});

function export_data(fn, res, filename) {
    var dirpath = path.join(__dirname, '..', 'temp', '' + Math.round(Math.random() * 10000000)), fpath = path.join(dirpath, filename + '.csv');
    fs.mkdirSync(dirpath);
    var options = {
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    fn(fpath).then(function () {
        res.sendFile(fpath, {}, function(err) {
            if(err) {
                console.log('Error sending "' + fpath + '" file.');
                console.log(err);
            }
            else {
                fs.unlinkSync(fpath);
                fs.rmdirSync(dirpath);
            }
        });
    });
};

router.get('/export_current', function(req, res, next) {
    export_data(_.bind(db.export_checkins, db), res, 'checkins');
});

router.get('/export_checkouts', function(req, res, next) {
    export_data(_.bind(db.export_checkouts, db),res, 'checkouts');
});

module.exports = router;
