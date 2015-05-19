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
    });
