var db = require('../models/db.js');
var express = require('express');
var guest = express.Router(),
    guests = express.Router();

guest.post('/', function(req, res, next) {
    var guest_info = req.body;
    guest_info.checkIn = new Date();
    db.add_guest(guest_info)
        .then(function(guest) {
            res.json({
                status: 'OK',
                guest: guest
            });
    }, function(error) {
        res.status(403);
        res.json({result: 'Error', msg:error});
    });
});

guest.put('/:id', function(req, res, next) {
    var guest_info = req.body;
    db.update_guest(req.params.id, guest_info)
        .then(function(guest) {
            res.json({
                status: 'OK',
                guest: guest
            });
    }, function(error) {
        res.status(403);
        res.json({result: 'Error', msg:error});
    });
});

guest.delete('/:id/:date', function(req, res, next) {
    var date = new Date(req.params.date);
    db.delete_guest(req.params.id, date)
        .then(function(guest) {
            res.json({
                status: 'OK',
                guest: guest
            });
        }, function(error) {
            res.json({result: error});
        });
});

guests.get('/', function(req, res, next) {
    db.get_all_guests().then(function(guests) {
        res.json({ result: {rooms: guests}});
    }, function () { res.json({result:'error'});});
});

guests.get('/checkouts', function(req, res, next) {
    db.get_all_checkouts().then(function(guests) {
        res.json({ result: {guests:guests}});
    }, function () { res.json({result:'error'});});
});

guests.get('/migration/:day/:month/:year', function(req, res, next) {
    var date = new Date(Date.parse(
        req.params.month + ' ' + req.params.day + ' ' + req.params.year));
    db.get_daily_status(date).then(function(result) {
        res.json({ result: result});
    }, function () { res.json({result:'error'});});
});

guest.post('/uncheckout/:id', function(req, res, next) {
    db.uncheckout_guest(req.params.id).then(function(result) {
        res.json({ result: result});
    }, function (error) {
        res.status(403);
        res.json({
            result:'error',
            msg:error
        });
    });
});

exports.guest = guest;
exports.guests = guests;
