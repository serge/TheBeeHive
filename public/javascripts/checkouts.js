angular.module('main', [])
    .controller('ctr', function($http, $scope) {
        $http.get('/guests/checkouts').success(function(data) {
            $scope.guest_infos = ['documentId', 'origin', 'destination', 'nationality', 'roomName'];
            $scope.guests = data.result.guests;
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
    });
