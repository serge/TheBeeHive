var express = require('express'),
    db = require('../models/db.js'),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    os = require('os');
var router = express.Router();

var server_data = { colors:{
        Verde:"rgba(30,200,30,.5)",
        Azul:"rgba(30,30,200,.5)",
        Naranja: "rgba(255, 90, 0, .5)",
        Matrimo: "rgba(90, 90, 90, .5)",
        "C. Familiar": "rgba(237, 230, 19, .5)"
    }};
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', server_data);


});

router.get('/calendar', function(req, res, next) {
  res.render('calendar', server_data);
});

router.get('/checkouts', function(req, res, next) {
  res.render('checkouts', server_data);
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
