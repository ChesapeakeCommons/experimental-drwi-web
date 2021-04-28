(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('atlasFilterOptions', [
            'environment',
            'AtlasFilterManager',
            function (environment, AtlasFilterManager) {
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
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'atlas-filter/atlasFilterOptions--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //

                        if (!angular.isDefined(scope.activeFilters)) {

                            scope.activeFilters = {};

                        }

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        scope.closeModal = function(refresh) {

                            scope.visible = false;

                            scope.modalDisplay.options = false;

                            if (scope.dismissAction) scope.dismissAction({});

                        };

                        scope.resetSelections = function () {

                            scope.activeFilters[scope.filterKey] = [];

                            scope.filterSet.forEach(function (feature) {

                                feature.selected = false;

                            });

                        };

                        scope.resetActiveFilters = function () {

                            scope.resetSelections();

                            scope.filterSet = undefined;

                            scope.filterKey = undefined;

                            scope.bookmarkReady = false;

                            scope.activeFilters = {};

                            scope.filterOptions = JSON.parse(
                                JSON.stringify(scope.filterOptions)
                            );

                            var categories = Object.keys(scope.filterOptions);

                            categories.forEach(function (category) {

                                scope.activeFilters[category] = [];

                            });

                            // for (var key in scope.filterOptions) {
                            //
                            //     if (key !== 'layers' &&
                            //         scope.filterOptions.hasOwnProperty(key)) {
                            //
                            //         var rawOptions = scope.filterOptions[key];
                            //
                            //         var cp = [];
                            //
                            //         if (Array.isArray(rawOptions)) {
                            //
                            //             rawOptions.forEach(function (option) {
                            //
                            //                 option.selected = false;
                            //
                            //                 cp.push(option);
                            //
                            //             });
                            //
                            //             scope.filterOptions[key] = cp;
                            //
                            //         }
                            //
                            //     }
                            //
                            // }

                        };

                        scope.viewOptions = function (key, group) {

                            scope.visible = false;

                            scope.filterKey = key;

                            scope.filterSet = scope.filterOptions[key];

                            scope.modalDisplay.options = false;

                        };

                        scope.capture = function () {

                            scope.visible = false;

                            scope.modalDisplay.options = false;

                            if (scope.captureFilters) scope.captureFilters({});

                        };

                    }

                };

            }

        ]);

}());