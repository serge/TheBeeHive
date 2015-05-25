angular.module('main', ['utils', 'server'])
    .controller('ctr', function($http, $scope, nationalities) {
        $scope.update = function(params) {
            $http.get('/guests/checkouts?' + params).success(function(data) {
                $scope.guest_infos = ['documentId', 'origin', 'destination', 'nationality', 'roomName'];
                $scope.guests = data.guests;
            });
        };

        $scope.show = function(period) {
            $scope.update('t=' + period);
        };

        $scope.show_range = function(from, until) {
            $scope.update('from=' + from + '&until=' + until);
        };

        $scope.show_name = function(name) {
            $scope.update('name=' + name);
        };

        $http.get('/rooms')
            .success(function(data) {
                $scope.rooms = data.rooms;
            });

        $scope.uncheckout = function(guest) {
            $http.post("/guest/uncheckout/" + guest.id)
            .success(function(data) {
                $scope.msg = "Success";
                $scope.guests.splice(_.findIndex($scope.guests, guest), 1);
            }).error(function(data) {
                $scope.error_msg = "No se puede anadir \""
                    + guest.firstName + " "
                    + guest.lastName + "\" in cuarto " + guest.roomName
                    + ". " + data.msg;
            });
        };

        $scope.recheckout = function(guest) {
            $scope.new_guest = _.clone(guest);
            $scope.new_guest.checkIn = new Date();
            var date = new Date();
            date.setDate(date.getDate() + 1);
            $scope.new_guest.checkOut = date;
            delete $scope.new_guest.id;
        };
        $scope.on_checkin_validate = function(new_guest) {
            $http.post('/guest', new_guest).success(function(data) {
                console.log("success");
            }).error(function(data) {
                $scope.error_msg = "No se puede anadir \""
                    + new_guest.firstName + " "
                    + new_guest.lastName + "\" in cuarto " + new_guest.roomName
                    + ". " + data.msg;
            });
        };

        $scope.from = new Date();
        $scope.until = new Date();
        $scope.update('day');

    $scope.nationalities = nationalities;
    });
