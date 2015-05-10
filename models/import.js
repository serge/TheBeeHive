//ID,NAME,CHECK IN,CHECK OUT,PASSPORT,AGE,NATIONALITY,TRAVEL OBJECTIVE,COMING FROM,GOING TO,,,
var fs = require('fs'),
    _ = require('underscore');

function parseDate(value, year) {
    var val = value.split(RegExp("[.,\'\/\\-]")),
    month = val[1], day = val[0];
    return new Date(Date.parse(month + ' ' + day + ' ' + year + " 11:00:00"));
}

function parse_checkouts(dbfile) {
    var fields = [
        'id',
        'firstName',
        'lastName',
        'checkIn',
        'checkOut',
        'documentId',
        'age',
        'nationality',
        'purpose',
        'origin',
        'destination',
        'email'],
        res = [],
        s = fs.readFileSync(dbfile).toString();
    _.each(s.split('\n'), function(line) {
        if(!_.isString(line))
            return;
        var datas = line.split(','), names, last_name, first_name, guest_info;
        if(datas.length < 2)
            return;
        names = datas[1].split(' ');
        last_name = _.last(names);
        first_name = _.initial(names, 1).join(' ');
        guest_info = [datas[0]];
        guest_info = guest_info.concat([first_name, last_name], _.rest(datas, 2));
        guest_info = _.object(fields, guest_info);
        guest_info.checkOut = parseDate(guest_info.checkOut, 2015);
        guest_info.checkIn = parseDate(guest_info.checkIn, 2015);

        res.push(guest_info);
    });
    return res;
}

function parse_current(dbfile) {
    var fields = ['firstName', 'lastName', 'checkIn', 'checkOut', 'documentId' ,'age', 'nationality', 'purpose', 'origin', 'destination', 'email', 'roomName', 'Breakfast'],
     curRoom, res = [];
    var s = fs.readFileSync(dbfile).toString();
    _.each(s.split('\n'), function(line) {
        var datas = line.split(','),
            bednum = parseInt(datas[0]),
            names, last_name, first_name;
        if(_.isNaN(bednum)) {
            curRoom = datas[0];
            return ;
        }
        names = datas[1].split(' ');
        last_name = _.last(names);
        first_name = _.initial(names, 1).join(' ');
        var guest_info = [first_name];
        guest_info = guest_info.concat([last_name], _.rest(datas, 2));
        datas = _.object(fields, guest_info);
        datas.roomName = curRoom;
        datas.checkIn = parseDate(datas.checkIn, 2015);
        datas.checkOut = parseDate(datas.checkOut, 2015);
        res.push(datas);
    });
    return res;
}

function db_from_file(dbfile) {

    var fields = [
        'firstName',
        'lastName',
        'nationality',
        'age',
        'documentId',
        'roomName',
        'origin',
        'destination',
        'checkIn',
        //        'checkOut',
        'id'];
    var s = fs.readFileSync(dbfile).toString(), res = [];
    _.each(s.split('\n'), function(line) {
        var datas = line.split(',');
        if (datas.length >= fields.length) {
            datas = _.object(fields, datas);
            datas.checkIn = new Date(datas.checkIn);
            res.push(datas);
        }
    });
    return res;
}

exports.parse_checkouts = parse_checkouts;
exports.parse_checkins = parse_checkouts;
exports.parse_current = parse_current;

//console.log(parse_checkouts(__dirname '../Check Outs.csv'));

//console.log(parse_current('../current.csv'));
