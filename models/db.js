var Sequelize = require('sequelize'),
    _ = require('underscore'),
    imp = require('./import'),
    Q = require('q'),
    path = require('path'),
    fs = require('fs');

var sequelize = new Sequelize('', null, null, {
  dialect: 'sqlite',
  storage: './beehive.sqlite'
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
    }
});

Guest.belongsTo(Room);
var soptions  = {force:true};

Room.sync(soptions).then(function() {
    return Guest.sync(soptions);
}).then(function() {
    return DeletedGuest.sync(soptions);
}).then(function () {
    return Q.all(_.map([{name:"Verde", capacity:10, hostelName: "The BeeHive", price:55},
                        {name:"Azul", capacity:8, hostelName: "The BeeHive", price:55},
                        {name:"Naranja", capacity:6, hostelName: "The BeeHive", price:55},
                        {name:"C. Familiar", capacity:4, hostelName: "The BeeHive", price:55},
                        {name:"Matrimo", capacity:2, hostelName: "The BeeHive", price:165}],
                       function(room) {
                           return Room.create(room);
                       }));
}).then(function () {
    var dbfile = __dirname + '/../Check Outs.csv';
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
    return Guest.findAll();
}).then(function(res) {
    console.log(res.length);
    console.log(res[0].dataValues);
    return Room.findAll({where: {name: res[0].dataValues.roomName}});
}).then(function(res) {
    console.log(res[0].dataValues);
//    get_all_guests('The BeeHive');
//   imp.test(__dirname + '/../guests.csv');
});

function get_room(roomname) {
    return Room.findAll({where:{name:roomname}})
        .then(function(data) {
            return data[0];
    });
}

function update_room(room) {
    return Room.insertOrUpdate(room)
        .then(function(a) {
            console.log('OX', a);
            }, function(a) {
            console.log('error', a);
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
            return Guest.create(guest_info)
                .then(function(u) {
                    console.log("added");
                    return u;
                },function(u) {
                    console.log("ERROR");
                    console.log(u);
                    return u;
                });
        }, function(err) {
            console.error(err);
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
            .then(function() {
                guest = guest[0].dataValues;
                guest.checkOut = date;
                return DeletedGuest.create(guest);
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
                    guests: _.has(grouped_guests, room.name)? grouped_guests[room.name]: []};
            });
            return grouped_guests;
        });
    });
}

function get_all_checkouts() {
    return DeletedGuest.findAll()
        .then(function(data) {
            return _.pluck(data, 'dataValues');
        }, function(data) {
            console.log("error", data);
        });
};

function get_checkouts(date) {
    var daybefore = new Date(date),
        dayafter;
    daybefore.setMinutes(0);
    daybefore.setSeconds(0);
    daybefore.setHours(0);
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
    daybefore.setMinutes(0);
    daybefore.setSeconds(0);
    daybefore.setHours(0);
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

exports.add_guest = add_guest;
exports.get_all_guests = get_all_guests;
exports.get_all_checkouts = get_all_checkouts;
exports.delete_guest = delete_guest;
exports.get_daily_status = get_daily_status;
exports.get_room = get_room;
exports.uncheckout_guest = uncheckout_guest;
exports.update_guest = update_guest;
exports.update_room = update_room;
exports.export_checkins = export_checkins;
exports.export_checkouts = export_checkouts;
