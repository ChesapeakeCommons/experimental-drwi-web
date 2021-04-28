(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('atlasFilterSet', [
            'environment',
            'AtlasFilterManager',
            function (environment, AtlasFilterManager) {
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

                            // scope.visible = false;

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

                            if (scope.dismissAction) scope.dismissAction({});

                        };

                        scope.resetSelections = function (category, arr) {

                            scope.activeFilters[category] = [];

                            scope.features = JSON.parse(JSON.stringify(scope.filterSet));

                            // arr.forEach(function (feature) {
                            //
                            //     feature.selected = false;
                            //
                            // });

                            scope.q = {};

                        };

                        scope.setFilter = function (category, arr) {

                            scope.activeFilters[category] = [];

                            scope.features.forEach(function (feature) {

                                if (feature.selected) {

                                    scope.bookmarkReady = true;

                                    scope.activeFilters[category].push(feature);

                                }

                            });

                            scope.closeModal();

                        };

                        scope.syncSelections = function () {

                            var activeSelections = scope.activeFilters[scope.filterKey];

                            var idx = [];

                            activeSelections.forEach(function (feature) {

                                idx.push(feature.id);

                            });

                            scope.features.forEach(function (feature) {

                                if (idx.indexOf(feature.id) >= 0) {

                                    feature.selected = true;

                                }

                            });

                        };

                        scope.$watch('newMap', function (newVal) {

                            if (newVal) {

                                scope.newMap = newVal;

                            }

                        });

                        scope.$watch('filterSet', function (newVal) {

                            if (Array.isArray(newVal)) {

                                scope.features = JSON.parse(JSON.stringify(newVal));

                                scope.syncSelections();

                                // scope.newMap = newVal;

                            }

                        });

                    }

                };

            }

        ]);

}());