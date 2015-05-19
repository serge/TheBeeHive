angular.module('main', ['server'])
.controller('ctr', function($http, $q, $scope, colors) {
    var date = new Date(),
        firstDay = date;
    firstDay.setDate(1);
    $scope.firstDay = firstDay;

    function gendays(firstDay, guests, rooms) {
        var pad = firstDay.getDay(),
            prevDay = new Date(firstDay);
        prevDay.setDate(prevDay.getDate() - pad);
        return _.map(_.range(5), function(r) {
            return _.map(_.range(7), function(c) {
                prevDay.setDate(prevDay.getDate() + 1);
                var dc = _.filter(guests, function(guest) {
                    var d = new Date(guest.checkOut);
                    return d.getFullYear() === prevDay.getFullYear()
                        && prevDay.getDate() === d.getDate()
                        && prevDay.getMonth() === d.getMonth();
                });
                var remaining = _.filter(guests, function(guest) {
                    var d = new Date(guest.checkOut);
                    if(!_.isDate(d))
                        return true;
                    return d > prevDay;
                });
                var freebeds = {};
                var total = 0;
                _.each(rooms, function(room, k) {
                    var info = room.capacity;
                    freebeds[k] = {capacity: info, free:_.reduce(remaining, function(memo, guest) {
                        if(guest.roomName === k) {
                            return memo - 1;
                        };
                        return memo;
                    }, info)};
                    total += freebeds[k].free;
                });
                return {checkouts: dc,
                        date:  new Date(prevDay),
                        freebeds: freebeds,
                        Total: total
                       };
            });
        });
    }

    function getFreeBeds(rooms) {
        return _.reduce(rooms, function(memo, room) {
            return memo + room.capacity - room.guests.length;
        }, 0);
    }

    function getTotalBeds(rooms) {
        return _.reduce(rooms, function(memo, room) {
            return memo + room.capacity;
        }, 0);
    }

    $scope.update = function() {
        $http.get('/guests').success(function(data) {
            $scope.guests = _.flatten(_.pluck(_.toArray(data.result.rooms), 'guests'));
            var rooms = data.result.rooms;
            $scope.month = gendays(firstDay, $scope.guests,
                                   rooms);
            $scope.colors = {};
            _.each(rooms, function(data, k) {
                $scope.colors[k] = data.color;
            });
        });
    };
    $scope.update();

    $scope.prev_month = function() {
        firstDay.setMonth(firstDay.getMonth() - 1);
        firstDay.setDate(1);
        $scope.update();
    };
    $scope.next_month = function() {
        console.log(firstDay);
        firstDay.setMonth(firstDay.getMonth() + 1);
        $scope.update();
    };
});
