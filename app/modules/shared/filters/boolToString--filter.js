(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .filter('boolToString', function() {

            return function(value) {

                if (typeof value === 'boolean') {

                    return value ? 'yes' : 'no';

                }

                return value;

            };

        });

}());