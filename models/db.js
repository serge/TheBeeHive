var Sequelize = require('sequelize'),
    _ = require('underscore'),
    imp = require('./import'),
    Q = require('q'),
    path = require('path'),
    fs = require('fs');

var dbname = 'beehive.sqlite',
    dbfname = './' + dbname,
    sequelize = new Sequelize('', null, null, {
        dialect: 'sqlite',
        storage: dbfname
    });

var guest_fields = {
    id: {
        type: Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement: true
    },
    firstName: {
        type: Sequelize.STRING,
        allowNull:false
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull:false
    },
    nationality: {
        type: Sequelize.STRING,
        allowNull:false
    },
    age: {
        type: Sequelize.INTEGER,
        allowNull:false
    },
    documentId: {
        type: Sequelize.STRING,
        allowNull:false
    },
    maritalStatus: {
        type: Sequelize.STRING,
        defaultValue: "Soltero"
    },
    objective: {
        type: Sequelize.STRING,
        defaultValue: "Turismo"
    },
    origin: {
        type: Sequelize.STRING,
        allowNull:false
    },
    destination: {
        type: Sequelize.STRING,
        allowNull:false
    },
    email: {
        type: Sequelize.STRING
    },
    checkIn: {
        type: Sequelize.DATE,
        allowNull:false
    },
    checkOut: {
        type:Sequelize.DATE,
        allowNull:false
    }
  };

var table_options =   {
    freezeTableName: true,
    timestamps: false
  };


var Guest = sequelize.define('guest', guest_fields, table_options);
guest_fields.checkOut = {type:Sequelize.DATE, allowNull:false};
guest_fields.id = {
    type: Sequelize.INTEGER,
    primaryKey:true
};
guest_fields.roomName = {
    type: Sequelize.STRING
};

var DeletedGuest = sequelize.define('deleted_guest', guest_fields, table_options);

var Room = sequelize.define('room', {
    name : {
        primaryKey:true,
        type: Sequelize.STRING
    },
    capacity: {
        type: Sequelize.INTEGER
    },
    price: {
        type: Sequelize.INTEGER
    },
    color: {
        type: Sequelize.STRING
    }
});

Guest.belongsTo(Room);
var soptions  = {force:false};

if(!fs.existsSync(dbfname)) {
    soptions.force = true;
}

var roominfo = [{name:"Verde", capacity:10, hostelName: "The BeeHive", price:55, color: "rgba(30,200,30,.5)"},
                {name:"Azul", capacity:8, hostelName: "The BeeHive", price:55, color: "rgba(30,30,200,.5)"},
                {name:"Naranja", capacity:6, hostelName: "The BeeHive", price:55, color: "rgba(255, 90, 0, .5)"},
                {name:"C. Familiar", capacity:4, hostelName: "The BeeHive", price:55, color: "rgba(90, 90, 90, .5)"},
                {name:"Matrimo", capacity:2, hostelName: "The BeeHive", price:165, color: "rgba(237, 230, 19, .5)"}];

Room.sync(soptions).then(function() {
    return Guest.sync(soptions);
}).then(function() {
    return DeletedGuest.sync(soptions);
}).then(function () {
    if(soptions.force)
        return Q.all(_.map(roominfo, create_room));
    return true;
}).then(function () {
/*    var dbfile = __dirname + '/../Check Outs.csv';
    return Q.all(_.map(imp.parse_checkouts(dbfile), function(guest) {
        return DeletedGuest.create(guest);
    }));
}).then(function () {
    var currentFile = __dirname + '/../current.csv',
        checkinsFile = __dirname + '/../Check Ins.csv',
        currents = imp.parse_current(currentFile),
        checkins = imp.parse_checkins(checkinsFile);
    _.each(currents, function(guest) {
        var i = _.findLastIndex(checkins, function(ci) {
            return ci.firstName == guest.firstName &&
                ci.lastName == guest.lastName;
            });
        if (i !== -1)
            guest.id = checkins[i].id;
    });
    return Q.all(_.map(currents, add_guest));
}).then(function() {
*/
    return Guest.findAll();
}).then(function(res) {
    var roomName = roominfo[0].name;
    if(!_.isEmpty(res)) {
        console.log("Total guests " + res.length);
        console.log(res[0].dataValues);
        roomName = res[0].dataValues.roomName;
    }
    return Room.findAll({where: {name: roomName}});
}).then(function(res) {
    console.log(res[0].dataValues);
    backup();
});

function get_room(roomname) {
    return Room.findAll({where:{name:roomname}})
        .then(function(data) {
            return data[0];
    });
}

function get_rooms() {
    return Room.findAll()
        .then(function(data) {
            return _.pluck(data, 'dataValues');
    });
}

function create_room(room) {
    return Room.create(room);
}

function update_room(room) {
    return guests_per_room(room.name)
    .then(function(guests) {
        if(guests.length > room.capacity) {
            return Q.reject('Cuarto "' + room.name + '" tiene demasiado huespedes no se puede cambiar el numero de camas.');
        }
        return Room.insertOrUpdate(room);
    });
}

function delete_room(roomname) {
    return Room.findOne({where:{name:roomname}})
        .then(function(data) {
            var room = data.dataValues;
            return guests_per_room(room.name);
        }).then(function(guests) {
            if(!_.isEmpty(guests))
                return Q.reject("Todavia hay huespedes en el cuarto.");
            return Room.destroy({where: {name:roomname}});
        });
}

function can_add_guest_in_room(roomname) {
    return Room.findAll({where: {name:roomname}})
        .then(function(room) {
            if(_.isEmpty(room)) {
                return Q.reject("No hay cuarto '" + roomname + "'");
            }
            room = room[0].dataValues;
            return guests_per_room(room.name)
                .then(function(guests) {
                    if(guests.length >= room.capacity) {
                        return Q.reject("No hay lugar en el cuarto " + room.name);
                    };
                    return guests;
                });
        });
}

function add_guest(guest_info) {
    return can_add_guest_in_room(guest_info.roomName)
        .then(function() {
            return Guest.create(guest_info);
        });
};

function update_guest(id, guest_info) {
    return Guest.findAll({where: {id:id}})
        .then(function(guests) {
            var old_guest =  guests[0].dataValues;
            if(old_guest.roomName === guest_info.roomName)
                return true;
            return can_add_guest_in_room(guest_info.roomName);
        }).then(function() {
            return Guest.update(guest_info, {where: {id:id}});
        });
};

function delete_guest(guest_id, date) {
    return Guest.findAll({where: {id:guest_id}})
        .then(function(guest) {
            return Guest.destroy({where: {id:guest_id}})
                .then(function(er) {
                    console.log(er);
                    guest = guest[0].dataValues;
                    guest.checkOut = date;
                    return DeletedGuest.create(guest);
            }, function(erro) {
            console.log(erro);
        });
        });
};

function guests_per_room(roomname) {
    return Guest.findAll({where: {roomName:roomname}})
        .then(function(guests) {
            return _.pluck(guests, 'dataValues');
        });
}

function get_all_guests() {
    return Guest.findAll().then(function(guests) {
        var grouped_guests = _.groupBy(_.map(guests, function(room) {
            return room.dataValues;
        }), 'roomName');
        return Room.findAll().then(function(rooms) {
            _.each(rooms, function(room) {
                room = room.dataValues;
                grouped_guests[room.name] = {
                    capacity :room.capacity,
                    color :room.color,
                    guests: _.has(grouped_guests, room.name)? grouped_guests[room.name]: []};
            });
            return grouped_guests;
        });
    });
}

function bring_to_midnight(date) {
    date.setMinutes(0);
    date.setSeconds(0);
    date.setHours(0);
    return date;
}

function bring_to_almost_midnight(date) {
    date.setMinutes(59);
    date.setSeconds(59);
    date.setHours(23);
    return date;
}

function get_previous_day(date, days) {
    var beforeday = new Date(date);
    beforeday.setDate(date.getDate() - days);
    bring_to_midnight(beforeday);
    return beforeday;
}

function get_all_checkouts(options) {
    var ops = options || {},
        date, untildate,
        days = 1, query = {};

    if(_.has(ops, 'period')) {
        days = {day:1, week:7, month:30}[ops.period];
        date = get_previous_day(new Date(), days);
        bring_to_midnight(date);
        untildate = new Date();
        bring_to_almost_midnight(untildate);
    } else if(_.has(ops, 'from')) {
        date = new Date(ops.from);
        bring_to_midnight(date);
        untildate = new Date(ops.until || new Date());
        bring_to_almost_midnight(untildate);
    } else if(_.has(ops, 'name')) {
        return DeletedGuest.findAll()
            .then(function(data) {
                var guests = _.pluck(data, 'dataValues'), res = [];
                _.each(guests, function(guest) {
                    var re = RegExp(ops.name.toLowerCase()),
                        fullname = guest.firstName.toLowerCase()
                            + guest.lastName.toLowerCase();
                    if(fullname.search(re) !== -1)
                        res.push(guest);
                });
                return res;
        }, function(data) {
            console.log("error", data);
            return data;
        });
    }


    if(_.isDate(date) ||  _.isDate(untildate))
        query = {
            where:["checkOut > ? and checkOut < ?", date, untildate]
        };
    return DeletedGuest.findAll(query)
        .then(function(data) {
            return _.pluck(data, 'dataValues');
        }, function(data) {
            console.log("error", data);
            return data;
    });
};

function get_checkouts(date) {
    var daybefore = new Date(date),
        dayafter;
    bring_to_midnight(daybefore);
    dayafter = new Date(daybefore);
    dayafter.setDate(daybefore.getDate() + 1);
    return DeletedGuest.findAll(
        {
            where: ["checkOut > ? and checkOut < ?", daybefore, dayafter]
        });
}

function get_checkins(date, db) {
    var daybefore = new Date(date),
        dayafter;
    bring_to_midnight(daybefore);
    dayafter = new Date(daybefore);
    dayafter.setDate(daybefore.getDate() + 1);
    return db.findAll(
        {
            where: ["checkIn > ? and checkIn < ?", daybefore, dayafter]
        });
}

function get_present_guests(date) {
    date.setMinutes(59);
    date.setSeconds(59);
    date.setHours(23);
    return DeletedGuest.findAll(
        {
            where: ["checkIn < ? and checkOut > ?", date, date]
        });
}

function get_active_guests(date) {
    var before = new Date(date);
    before.setMinutes(0);
    before.setSeconds(0);
    before.setHours(0);
    return Guest.findAll({
        where:["checkIn < ?", before]
    })
        .then(function(guests) {
            return _.pluck(guests, 'dataValues');
        });
}

function get_daily_status(date) {
    var res = {};
    return get_checkouts(date)
        .then(function(checkouts) {
            res.checkouts = checkouts;
            return get_active_guests(date);
        }).then(function(permanents) {
            res.permanents = permanents;
            return get_present_guests(date);
        }).then(function(permanents) {
            res.permanents = res.permanents.concat(permanents);
            return get_checkins(date, Guest);
        }).then(function(checkins) {
            res.checkins = checkins;
            return get_checkins(date, DeletedGuest);
        }).then(function(checkins) {
            res.checkins = res.checkins.concat(checkins);
            return res;
        });
};

function uncheckout_guest(id) {
    return DeletedGuest.findOne({where:{id:id}})
        .then(function (guest) {
            return add_guest(guest.dataValues);
        }).then(function() {
            return DeletedGuest.destroy({where:{id:id}});
        });
};

function writeData(fpath, data) {
    _.each(data, function (guest) {
        var row = [guest.id];
        row.push(guest.firstName + ' ' + guest.lastName);
        delete guest.id;
        delete guest.firstName;
        delete guest.lastName;
        _.each(guest, function(v,k) {
            if (_.isDate(v))
                row.push(v.getDate() + '/' + (v.getMonth() + 1) + '/' + v.getFullYear());
            else row.push(v);
        });
        fs.appendFileSync(fpath,row.join(',') + '\n');
        return true;
    });
}

function export_checkins(fpath) {
    var first = true;
    return get_all_guests()
        .then(function (guests) {
            _.each(guests, function(data, k) {
                if(first && !_.isEmpty(data.guests)) {
                    first = false;
                    writeHeader(fpath,data.guests[0]);
                }
                fs.appendFileSync(fpath, k + _.rest(_.map(data.guests[0], function(v) { return '';})).join(',') + '\n');
                writeData(fpath, data.guests);
            });
        });
};

function writeHeader(fpath, info) {
    var minfo = _.keys(info),
        row = _.reduce(minfo, function(memo, v) {
            if(v === 'firstName')
                return memo;
            if(v === 'lastName') {
                memo.push('firstName lastName');
                return memo;
            }
            memo.push(v);
            return memo;
        }, []);
    fs.appendFileSync(fpath, row.join(',') + '\n');
}

function export_checkouts(fpath) {
    return get_all_checkouts()
        .then(function (guests) {
            if(!_.isEmpty(guests))
                writeHeader(fpath,guests[0]);
            writeData(fpath, guests);
        });
};

function erase_guest(guest_id) {
    return Guest.destroy({where: {id:guest_id}});
};

function pad(s) {
    if(('' + s).length === 1)
        return '0' + s;
    return s;
};

function backup() {
    var date = new Date(),
        inStream = fs.createReadStream(dbfname),
        backupname = dbfname + '.'
            + date.getFullYear() + '_'
            + pad(date.getMonth()) + '_'
            + pad(date.getDate()) + '_'
            + pad(date.getHours()) + '_'
            + pad(date.getMinutes()) + '_'
            + pad(date.getSeconds()),
        outStream = fs.createWriteStream(backupname);
    inStream.pipe(outStream);
    console.log('Backed up as ' + backupname);
    var re = RegExp(dbname + '.[0-9]{4}');
    var todelete = _.filter(fs.readdirSync('.'), function(fname) {
        return fname.match(re) && backupname.search(fname) === -1;
    });
    _.each(todelete, function(fname) {
        try {
            fs.unlinkSync(fname);
        } catch (e) {
            console.log(e);
        }
    });

}

setInterval(backup, 1000 * 60 * 60 * 24);

exports.add_guest = add_guest;
exports.get_all_guests = get_all_guests;
exports.get_all_checkouts = get_all_checkouts;
exports.delete_guest = delete_guest;
exports.get_daily_status = get_daily_status;
exports.get_room = get_room;
exports.get_rooms = get_rooms;
exports.uncheckout_guest = uncheckout_guest;
exports.update_guest = update_guest;
exports.create_room = create_room;
exports.update_room = update_room;
exports.delete_room = delete_room;
exports.export_checkins = export_checkins;
exports.export_checkouts = export_checkouts;
exports.erase_guest = erase_guest;
