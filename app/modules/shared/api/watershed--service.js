(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Watershed', function(environment, Preprocessors, $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/watershed/:id'), {
                id: '@id'
            }, {
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
                    isArray: false,
                    url: 'http://watersheds-staging.cci.drexel.edu/api/bmp\\/'
                }
            });
        });

}());