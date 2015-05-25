angular.module('main', ['ui.bootstrap.datetimepicker', 'server', 'utils'])
.controller('ctr', function($http, $q, $scope, nationalities) {

    $scope.checkedOut = [];
    $scope.migration_date = new Date();
    $scope.migration_date.setDate($scope.migration_date.getDate() - 1);
    $scope.get_room_info = function(roomname) {
        $http.get('/room/' + roomname)
            .success(function(data) {
                $scope.sroom = data.room;
            });
    };

    $scope.onMigrationReport = function(newDate, oldDate) {
        var date = newDate,
            day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear();
        window.open('migration/' + day + '/' + month + '/' + year,'_blank');
    };

    $scope.update_room = function(sroom) {
        $http.put('/room', sroom)
            .success(function(data) {
                $scope.update();
            });
    };

    $scope.update = function() {
        $http.get('/guests').success(function(data) {
            $scope.rooms = data.result.rooms;
            _.each($scope.rooms, function(room) {
                _.each(room, function(guest) {
                });
            });
        });
    };

    $scope.execute_move = function(room) {
        console.log("move user from " + $scope.room.name + " to " + room.name);
    };
    $scope.init_check_in = function(roomname) {
        _.each($scope.new_guest, function(v, k) {
            $scope.new_guest[k] = '';
        });
        $scope.new_guest.roomName = roomname;
        $scope.new_guest.email = '@';
        var date = new Date();
        $scope.new_guest.checkIn = date;
        $scope.new_guest.checkOut = new Date(date);
        $scope.new_guest.checkOut.setDate(date.getDate() + 1);
        $scope.new_guest.objective = "Turismo";
        $scope.new_guest.maritalStatus = "Soltero";
        $scope.on_checkin_validate = makeCheckIn;
    };

    $scope.edit_guest = function(guest) {
        $scope.new_guest = _.clone(guest);
        $scope.on_checkin_validate = editGuest;
    };

    $scope.erase_guest = function(guest) {
        $scope.confirm = {
            msg:"Quieres borar huesped?",
            onok: function() {
                $http.delete('/guest/' + guest.id)
                    .success(function(res) {
                        console.log(res);
                        $scope.update();
                    });
            }
        };
    };

    function makeCheckIn(new_guest) {
        console.log(new_guest);
        $http.post('/guest', new_guest).success(function(data) {
            console.log(data);
            $scope.rooms[data.guest.roomName].guests.push(data.guest);
        }).error(function(data) {
            $scope.error_msg = "No se puede anadir \""
                + new_guest.firstName + " "
                + new_guest.lastName + "\" in cuarto " + new_guest.roomName
                + ". " + data.msg;
        });
    };

    $scope.advance_check_out = function (guest) {
        var edited_guest = _.clone(guest);
        editGuest(edited_guest);
    };

    function editGuest(new_guest) {
        var id = new_guest.id;
        delete new_guest.id;
        $http.put('/guest/' + id, new_guest)
            .success(function(data) {
                console.log(data);
                $scope.update();
        }).error(function(data) {
            $scope.error_msg = "No se puede cambiar \""
                + new_guest.firstName + " "
                + new_guest.lastName + "\" in cuarto "
                + new_guest.roomName
                + ". " + data.msg;
        });
    };

    $scope.setCheckoutGuest = function() {
        var guests = _.flatten(_.map($scope.rooms, function(k, v) {
            return _.filter(k.guests, function(guest){
                return guest.selected;
            });
        }));
        $scope.guestToCheckout = _.map(guests, setCheckoutDate);
    };

    function setCheckoutDate(guest) {
        var u = _.clone(guest);
        u.checkOut = new Date();
        u.checkIn = new Date(u.checkIn);
        return u;
    }

    $scope.checkOutSingleGuest = function(guest) {
        $scope.guestToCheckout = [setCheckoutDate(guest)];
        $scope.checkOut();
    };

    $scope.checkOut = function() {
        $q.all(_.map($scope.guestToCheckout, function (guest) {
            guest.checkOut.setHours(11);
            return $http.delete('/guest/' + guest.id + '/' + guest.checkOut);
        })).then(function(data) {
            _.each(data, function(data) {
                $scope.checkedOut.push(data.data.guest);
            });
            $scope.update();
        }, function(data) {
            console.log(data);
        });
    };

    $scope.uncheckout = function(guest) {
        $http.post("/guest/uncheckout/" + guest.id)
            .success(function() {
                $scope.checkedOut.splice(_.findIndex($scope.checkedOut, guest), 1);
                $scope.update();
            });
    };

    $scope.new_guest = {firstName:"Sterling", lastName:"Archer", documentId: "Danger Zone", age:32, maritalStatus:"soltero", origin:"Potosí", destination:"La Paz", nationality:'francés', objective:'tourismo', checkIn:new Date()};
    $scope.guest_infos = ['documentId', 'origin', 'destination', 'nationality'];

    $scope.short_guest_infos = ['checkOut', 'roomName'];

    $scope.nationalities = nationalities;
    $scope.update();
});
