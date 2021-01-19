(function() {

    'use strict';

    var index = {
        'camino': 'Camino',
        'chrome': 'Chrome',
        'edge': 'Microsoft Edge',
        'firefox': 'Firefox',
        'galeon': 'Galeon',
        'kmeleon': 'K-Meleon',
        'konqueror': 'Konqueror',
        'links': 'Links',
        'lynx': 'Lynx',
        'mozilla': 'Mozilla',
        'msie': 'Internet Explorer',
        'msn': 'MSN',
        'netscape': 'Netscape',
        'opera': 'Opera',
        'safari': 'Safari',
        'seamonkey': 'SeaMonkey',
        'webkit': 'WebKit'
    }

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .filter('browserName', function() {

            return function(value) {

                if (index.hasOwnProperty(value)) {

                    return index[value];

                }

                return 'Unknown browser';

            };

        });

}());