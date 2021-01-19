(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('exportDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Export',
            '$timeout',
            function(environment, $routeParams, $filter, $parse, $location, Export, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'feature': '=?',
                        'resetType': '=?',
                        'type': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/export/exportDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        scope.fileFormat = 'csv';

                        scope.activeRadio = {
                            csv: true
                        };

                        if (typeof scope.resetType === 'undefined') {

                            scope.resetType = true;

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function() {

                            scope.visible = false;

                            scope.fileFormat = 'csv';

                            scope.activeRadio = {
                                csv: true
                            };

                            if (scope.resetType) scope.type = undefined;

                        };

                        scope.createExport = function(name, format) {

                            var newFeature = new Export({
                                'feature_id': scope.feature.id,
                                'name': name,
                                'scope': scope.type,
                                'format': format
                            });

                            newFeature.$save(function(successResponse) {

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Successfully exported this ' + scope.label + '.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                                scope.closeChildModal();

                            }, function(errorResponse) {

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Something went wrong while exporting this ' + scope.label + '.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.setFormat = function(format) {

                            console.log(
                                'exportDialog:fileFormat:',
                                scope.fileFormat
                            );

                            scope.fileFormat = format;

                            scope.activeRadio = {};

                            scope.activeRadio[format] = true;

                            console.log(
                                'exportDialog:fileFormat[2]:',
                                scope.fileFormat
                            );

                        };

                        scope.$watch('type', function (newVal) {

                            if (typeof newVal === 'string') {

                                scope.label = newVal.replace(/_/g, ' ');

                            }

                        });

                    }

                };

            }

        ]);

}());