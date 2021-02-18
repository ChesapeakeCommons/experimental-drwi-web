(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('createMap', [
            'environment',
            'mapbox',
            'MapInterface',
            function (environment, mapbox, MapInterface) {
                return {
                    restrict: 'EA',
                    scope: {
                        'activeFilters': '=?',
                        'bookmarkReady': '=?',
                        'captureFilters': '&',
                        'filterKey': '=?',
                        'filterOptions': '=?',
                        'filterSet': '=?',
                        'dismissAction': '&',
                        'modalDisplay': '=?',
                        'newMap': '=?',
                        'postSave': '&',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'create-map/createMap--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //
                        
                        scope.mapStyles = mapbox.standardStyles;

                        if (!angular.isDefined(scope.activeFilters)) {

                            scope.activeFilters = {};

                        }

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        if (!angular.isDefined(scope.newMap)) {

                            scope.newMap = {};

                        }

                        scope.closeModal = function(refresh) {

                            scope.visible = false;

                            if (scope.dismissAction) scope.dismissAction({});

                        };

                        scope.resetActiveFilters = function () {

                            scope.bookmarkReady = false;

                            scope.activeFilters = {};

                            var categories = Object.keys(scope.filterOptions);

                            categories.forEach(function (category) {

                                scope.activeFilters[category] = [];

                            });

                            for (var key in scope.filterOptions) {

                                if (key !== 'layers' &&
                                    scope.filterOptions.hasOwnProperty(key)) {

                                    var options = scope.filterOptions;

                                    if (Array.isArray(options)) {

                                        options.forEach(function (options) {

                                            option.selected = false;

                                        });

                                        scope.filterOptions[key] = options;

                                    }

                                }

                            }

                        };

                        scope.viewOptions = function (key, group) {

                            scope.visible = false;

                            scope.filterKey = key;

                            scope.filterSet = group;

                            scope.modalDisplay.creationStep = undefined;

                        };

                        scope.capture = function () {

                            scope.visible = false;

                            if (scope.captureFilters) scope.captureFilters({});

                        };

                        scope.cancelCreate = function () {

                            scope.newMap = {};

                            scope.modalDisplay.creationStep = undefined;

                            if (scope.dismissAction) scope.dismissAction({});

                        };

                        scope.setNewMapStyle = function (style) {

                            scope.newMap.style = style.id;

                        };

                        scope.saveMap = function () {

                            for (var key in scope.activeFilters) {

                                if (scope.activeFilters.hasOwnProperty(key)) {

                                    scope.newMap[key] = [];

                                    scope.activeFilters[key].forEach(function(feature) {

                                        scope.newMap[key].push(feature.id);

                                    });

                                }

                            }

                            var newFeature = new MapInterface(scope.newMap);

                            newFeature.$save(function(successResponse) {

                                console.log(
                                    'saveMap:successResponse',
                                    successResponse
                                );

                                scope.newMap = {};

                                scope.modalDisplay.creationStep = undefined;

                                if (scope.postSave) scope.postSave({});

                            }, function(errorResponse) {

                                console.log(
                                    'saveMap:errorResponse',
                                    errorResponse
                                );

                            });

                        };

                    }

                };

            }

        ]);

}());