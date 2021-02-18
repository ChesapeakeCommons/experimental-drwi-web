(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('atlasFilterSet', [
            'environment',
            '$window',
            '$rootScope',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Practice',
            '$timeout',
            function (environment, $window, $rootScope, $routeParams, $filter,
                      $parse, $location, Practice, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'activeFilters': '=?',
                        'bookmarkReady': '=?',
                        'filterKey': '=?',
                        'filterSet': '=?',
                        'dismissAction': '&',
                        'modalDisplay': '=?',
                        'newMap': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'atlas-filter/atlasFilterSet--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //

                        scope.q = {
                            token: ''
                        };

                        if (!angular.isDefined(scope.activeFilters)) {

                            scope.activeFilters = {};

                        }

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        scope.closeModal = function(refresh) {

                            scope.visible = false;

                            scope.q = {};

                            if (scope.dismissAction) scope.dismissAction({});

                        };

                        scope.setFilter = function (category, arr) {

                            scope.activeFilters[category] = [];

                            arr.forEach(function (feature) {

                                if (feature.selected) {

                                    scope.bookmarkReady = true;

                                    scope.activeFilters[category].push(feature);

                                }

                            });

                            scope.filterSet = undefined;

                            scope.q = {};

                            console.log(
                                'atlasFilterSet.setFilter:newMap',
                                scope.newMap
                            );

                            if (angular.isDefined(scope.newMap) &&
                                scope.newMap.hasOwnProperty('name')) {

                                scope.modalDisplay.creationStep = 5;

                            } else {

                                scope.modalDisplay.options = true;

                            }

                        };

                        scope.$watch('newMap', function (newVal) {

                            if (newVal) {

                                scope.newMap = newVal;

                            }

                        });

                    }

                };

            }

        ]);

}());