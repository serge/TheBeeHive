angular.module('main', ['utils', 'server'])
    .controller('ctr', function($http, $scope, colors) {

        $scope.rooms = [];
        $scope.colors = colors;

        $scope.update = function() {
            $http.get('/rooms').success(function(data) {
                $scope.rooms = data.rooms;
            });
        };

        $scope.delete_room = function(roomname) {
            $http.delete('/room/' + roomname)
                .success(function(data) {
                    $scope.update();
            });
        };

        function random_color() {
            return [0,68,136,204][Math.round(Math.random() * 10) % 3];
        };
        function add_room(new_room) {
            new_room.color = "rgba(" + random_color() + ','
                + random_color() + ',' + random_color() + ',0.5)';
            console.log(new_room);
            $http.post('/room', new_room)
                .success(function(data) {
                    $scope.update();
            });
        };

        function edit_room(new_room) {
            $http.put('/room', new_room)
                .success(function(data) {
                    $scope.update();
            });
        };

        $scope.open_create_dlg = function() {
            $scope.new_room = {};
            $scope.on_room_dlg_ok = add_room;
            $scope.ok_btn_name = "Añadir";
        };

        $scope.open_edit_dlg = function(room) {
            $scope.new_room = _.clone(room);
            $scope.on_room_dlg_ok = edit_room;
            $scope.ok_btn_name = "Editar";
        };

        $scope.update();
    });
