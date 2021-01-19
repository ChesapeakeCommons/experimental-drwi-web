(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('DrexelInterface', function(environment, Preprocessors, $resource) {
            return $resource('http://watersheds-staging.cci.drexel.edu/api/bmp\\/', {}, {
                query: {
                    isArray: false,
                    cache: true
                },
                collection: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/watersheds')
                },
                delineate: {
                    method: 'POST',
                    isArray: false
                }
            });
        });

}());