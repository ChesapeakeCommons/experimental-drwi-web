(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('metricDetailDialog', [
            'environment',
            function(environment) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'visible': '=?',
                        'metric': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/metric/metricDetailDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function() {

                            scope.visible = false;

                        };

                    }

                };

            }

        ]);

}());