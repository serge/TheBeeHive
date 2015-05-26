angular.module('utils', ['ui.bootstrap.datetimepicker'])
    .directive('datepicker', function() {
        return {
            restrict: "E",
            templateUrl: "/partials/datepicker",
            scope: {
                var: '=ngModel'
            },
            link: function(scope, elem, attr) {
                scope.id = 'item' + Math.round(Math.random() * 1000);
                scope.onTimeSet = function (newDate, oldDate) {
                    newDate.setHours(oldDate.getHours());
                    newDate.setMinutes(oldDate.getMinutes());
                    newDate.setSeconds(oldDate.getSeconds());
                    $('#' + scope.id).dropdown('toggle');
                };
            }
        };
    })
    .service('alert_user', function($rootScope) {
        function set_message(msg, aclass) {
            $rootScope.$broadcast('alert_message',
                                  {
                                      msg:msg,
                                      alert_class: aclass
                                  });
        }
        var that = {set_message: set_message};
        return {
            msg_error: function(msg) {
                that.set_message(msg, {'alert-danger':true});
            },
            msg_success: function(msg) {
                that.set_message(msg, {'alert-success':true});
            }
        };
    })
    .directive('alerts', function($timeout) {
        return {
            restrict: "E",
            templateUrl: "/partials/alerts",
            scope: {
            },
            link: function(scope, elem, attr) {
                function dismiss() {
                    delete scope.data.msg;
                }
                scope.dismiss = dismiss;
                scope.$on('alert_message', function(event, data) {
                    scope.data = data;
                    $timeout(dismiss, 5000);
                });
            }
        };
    });
