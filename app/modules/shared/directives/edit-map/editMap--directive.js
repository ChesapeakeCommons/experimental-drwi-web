(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('editMap', [
            'environment',
            'mapbox',
            'MapInterface',
            '$timeout',
            function (environment, mapbox, MapInterface, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'bookmarkReady': '=?',
                        'captureFilters': '&',
                        'feature': '=?',
                        'dismissAction': '&',
                        'modalDisplay': '=?',
                        'postSave': '&',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'edit-map/editMap--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //
                        
                        scope.mapStyles = mapbox.standardStyles;

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeModal = function(refresh) {

                            scope.visible = false;

                            if (scope.dismissAction) scope.dismissAction({});

                        };

                        scope.extractFilters = function () {

                            scope.activeFilters = {};

                            for (var key in scope.feature) {

                                if (scope.feature.hasOwnProperty(key)) {

                                    var filters = scope.feature[key];

                                    if (Array.isArray(filters)) {

                                        scope.activeFilters[key] = [];

                                        filters.forEach(function (feature) {

                                            scope.activeFilters[key].push(feature);

                                        });

                                    }

                                }

                            }

                        };

                        scope.cancelEdit = function () {

                            scope.modalDisplay.editStep = undefined;

                        };

                        scope.setMapStyle = function (style) {

                            scope.feature.style = style.id;

                        };

                        scope.saveMap = function () {

                            console.log(
                                'saveMap:feature',
                                scope.feature
                            );
                            
                            MapInterface.update({
                                id: scope.feature.id
                            }, scope.feature).$promise.then(function(successResponse) {

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Map changes saved.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                                scope.modalDisplay.editStep = undefined;

                                if (scope.postSave) scope.postSave({});

                            }).catch(function(errorResponse) {

                                // Error message

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Map changes could not be saved.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.$watch('feature', function (newVal) {

                            if (newVal && !scope.cloneParsed) {

                                try {

                                    scope.feature = JSON.parse(JSON.stringify(newVal));

                                    scope.cloneParsed = true;

                                } catch (e) {

                                    console.warn(
                                        'editMap:',
                                        'Unable to parse feature.'
                                    );

                                }

                                scope.extractFilters();

                            }

                        });

                    }

                };

            }

        ]);

}());