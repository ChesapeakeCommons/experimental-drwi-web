(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .filter('truncate', function() {

            return function(string, length, ellipsize) {

                ellipsize = (typeof ellipsize === 'boolean') ? ellipsize : true;

                if (string && string.length > length) {

                    string = string.substr(0, length)

                    return ellipsize ? string + '…' : string;

                } else {

                    return string;

                }

            };

        });

}());