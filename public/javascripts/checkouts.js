angular.module('main', [])
    .controller('ctr', function($http, $scope) {
        $http.get('/guests/checkouts').success(function(data) {
            $scope.guests = data.result.guests;
        });
    });
