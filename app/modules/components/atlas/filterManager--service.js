'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('AtlasFilterManager', [
        '$location',
        function($location) {

            var baseOptions = {};

            var activeFilters = {};

            var filterSet = undefined;

            var filterKey = undefined;

            return {
                setOptions: function (options) {

                    console.log(
                        'AtlasFilterManager:options:',
                        options
                    );

                    baseOptions = options;

                },
                getOptions: function () {

                    return JSON.parse(JSON.stringify(baseOptions));

                },
                getFilters: function () {

                    return JSON.parse(JSON.stringify(activeFilters));

                },
                setFilter: function (category, arr) {

                    activeFilters[category] = [];

                    arr.forEach(function (feature) {

                        if (feature.selected) {

                            activeFilters[category].push(feature);

                        }

                    });

                },
                resetFilter: function (category, arr) {

                    activeFilters[category] = [];

                    arr.forEach(function (feature) {

                        feature.selected = false;

                    });

                }
            };

        }]);