var db = require('../models/db.js');
var express = require('express');
var room = express.Router();

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
}).post('/',function(req,res,next){
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
            res.json({result: 'Error'});
        });
});

module.exports = room;
