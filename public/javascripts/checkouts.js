angular.module('main', ['utils'])
    .controller('ctr', function($http, $scope) {
        $http.get('/guests/checkouts').success(function(data) {
            $scope.guest_infos = ['documentId', 'origin', 'destination', 'nationality', 'roomName'];
            $scope.guests = data.result.guests;
        });
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

    $scope.nationalities = ['alemán',
                            'argentino',
                            'australiano',
                            'austriaco',
                            'belga',
                            'boliviano',
                            'brasileño',
                            'canadiense',
                            'chileno',
                            'chino',
                            'colombiano',
                            'nortecoreano',
                            'sudcoreano',
                            'costarricense',
                            'cubano',
                            'danés',
                            'ecuatoriano',
                            'egipcio',
                            'salvadoreño',
                            'escocés',
                            'español',
                            'estadounidense',
                            'filipino',
                            'francés',
                            'galés',
                            'británico',
                            'griego',
                            'guatemalteco',
                            'haitiano',
                            'hondureño',
                            'indio',
                            'inglés',
                            'irakí',
                            'iraní',
                            'irlandés',
                            'israelí',
                            'italiano',
                            'japonés',
                            'marroquí',
                            'mexicano',
                            'nicaragüense',
                            'noruego',
                            'neozelandés',
                            'holandés',
                            'palestino',
                            'panameño',
                            'paraguayo',
                            'peruano',
                            'polaco',
                            'portugués',
                            'puertorriqueño',
                            'dominicano',
                            'ruso',
                            'sudafricano',
                            'sueco',
                            'suizo',
                            'taiwanés',
                            'uruguayo',
                            'venezolano',
                            'ucraniano'];

    });
