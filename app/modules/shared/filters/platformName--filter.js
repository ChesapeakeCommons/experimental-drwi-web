(function() {

    'use strict';

    var index = {
        'aix': 'AIX',
        'amiga': 'AmigaOS',
        'android': 'Android',
        'blackberry': 'BlackBerry',
        'bsd': 'BSD',
        'chromeos': 'Chrome OS',
        'dragonflybsd': 'DragonFlyBSD',
        'freebsd': 'FreeBSD',
        'hpux': 'HP-UX',
        'ipad': 'iPad',
        'iphone': 'iPhone',
        'irix': 'IRIX',
        'linux': 'Linux',
        'macos': 'MacOS',
        'netbsd': 'NetBSD',
        'openbsd': 'OpenBSD',
        'sco': 'SCO',
        'solaris': 'Solaris',
        'symbian': 'Symbian',
        'wii': 'Wii',
        'windows': 'Windows'
    }

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .filter('platformName', function() {

            return function(value) {

                if (index.hasOwnProperty(value)) {

                    return index[value];

                }

                return 'Unknown platform';

            };

        });

}());