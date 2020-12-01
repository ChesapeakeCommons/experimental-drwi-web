'use strict';

/**
 * @ngdoc overview
 * @name
 * @description
 */
angular
    .module('FieldDoc', [
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ipCookie',
        'angularFileUpload',
        'geolocation',
        'monospaced.elastic',
        'angularMoment',
        'config',
        'MapboxGL',
        'MapboxGLGeocoding',
        'Mapbox',
        'save2pdf',
        'collaborator',
        'ui.bootstrap',
        'angular-progress-arc',
    ]).config(function($sceDelegateProvider, environment) {
<<<<<<< HEAD

        //
        // Wrap `console.log` for conditional logging.
        //

        (function (cl) {
            console.log = function () {
                if (environment.name !== 'production') {
                    cl.apply(void 0, arguments);
                }
            };
        })(console.log);
=======
>>>>>>> d3f627054b121920412768e8a7483971b4502c93

        $sceDelegateProvider.resourceUrlWhitelist([
            // Allow same origin resource loads.
            'self',
            // Allow loading from our assets domain.  Notice the difference between * and **.
            'http://localhost:8000/**',
            // Allow loading from API endpoints.
            'http://localhost:4000/v1/tpl/**',
            'https://dev.dnr.fielddoc.org/**',
            'https://dnr.fielddoc.org/**'
        ]);

    /*wrap console.log to void arguments if production environment. */

        (function (fn) {
                console.log = function () {
                    if (environment.name !== 'production') {
                        fn.apply(void 0, arguments);
                    }
                };
            })(console.log);

    });