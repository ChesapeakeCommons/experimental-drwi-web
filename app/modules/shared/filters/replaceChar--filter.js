(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .filter('replaceChar', function() {

            return function(string, char, replacement) {

                replacement = (typeof replacement === 'string') ? replacement : '';

                if (typeof string === 'string' &&
                    typeof char === 'string') {

                    var re = new RegExp(char, 'g');

                    return string.replace(re, replacement);

                }

                return string;

            };

        });

}());