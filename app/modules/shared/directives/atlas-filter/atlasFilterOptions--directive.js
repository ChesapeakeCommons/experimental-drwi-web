(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('atlasFilterOptions', [
            'environment',
            function (environment) {
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