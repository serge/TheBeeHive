angular.module('main', [])
    .controller('ctr', function($http, $scope) {
        $scope.req = {date: new Date()};
        $scope.fields = ['firstName', 'lastName', 'nationality', 'documentId', 'age', 'maritalStatus', 'objective', 'origin', 'destination'];
        $scope.names = ['Nombre', 'Apellido', 'Nacionalidad', 'Pasaporte', 'Edad', 'Estado civil', 'Objectivo', 'Precedencia', 'Destino'];
        $scope.groupNames = {
            checkins:"Entrantes",
            checkouts:"Salientes",
            permanents:"Permanentes"
        };

        $scope.generate = function() {
            $scope.update($scope.req.date);
        };

        $scope.update = function(date) {
            var day = $scope.req.date.getDate(),
                month = $scope.req.date.getMonth() + 1,
                year = $scope.req.date.getFullYear();
            $http.get('/guests/migration/' + day + '/' + month + '/' + year)
                .success(function(data) {
                    $scope.records = data.result;
                });
        };

        $scope.update(new Date());
    });
