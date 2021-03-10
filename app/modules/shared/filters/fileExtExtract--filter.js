(function() {

    'use strict';

    angular.module('FieldDoc')
        .filter('fileExtExtract', ['$filter', function($filter) {

            return function(value) {

                if (typeof value === 'string' &&
                    value.indexOf('.') >= 0) {

                    return value.split('.').pop();

                }

                return value;

            };

        }]);

}());