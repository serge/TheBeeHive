var db = require('../models/db.js');
var express = require('express');
var room = express.Router(),
    rooms = express.Router(),
    server_data = require('../models/server_data');

room.get('/:roomname', function(req, res, next) {
    db.get_room(req.params.roomname)
        .then(function(room) {
            res.json({
                status: 'OK',
                room: room
            });
        }, function(error) {
            res.json({result: 'Error'});
        });
}).put('/',function(req,res,next){
    var roominfo = req.body;
    delete roominfo.createdAt;
    delete roominfo.updatedAt;
    db.update_room(roominfo)
        .then(function(roominfo) {
            res.json({
                status: 'OK',
                room: room
            });
        }, function(error) {
            res.status(403);
            res.json({error: error});
        });
}).post('/',function(req,res,next){
    var roominfo = req.body;
    db.create_room(roominfo)
        .then(function(roominfo) {
            res.json({
                status: 'OK',
                room: roominfo
            });
        }, function(error) {
            res.json({result: 'Error'});
        });
}).delete('/:roomname', function(req, res, next) {
    db.delete_room(req.params.roomname)
        .then(function() {
            res.json({
                status: 'OK'
            });
        }, function(error) {
            res.status(403);
            res.json({
                status: 'Error',
                msg: error
            });
        });
});

rooms.get('/all', function(req, res, next) {
    res.render('rooms', server_data);
});

rooms.get('/', function(req, res, next) {
    db.get_rooms()
    .then(function(rooms) {
        res.json({
            status: 'OK',
            rooms: rooms
        });
    }, function(error) {
        res.status(403);
        res.json({status: "Error", msg: error});
    });
});

module.exports.room = room;
module.exports.rooms = rooms;
