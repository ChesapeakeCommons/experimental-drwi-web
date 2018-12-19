(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('GeographyService', function(environment, Preprocessors, $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/geography/:id'), {
                id: '@id'
            }, {
                query: {
                    isArray: false,
                    cache: true
                },
                collection: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/geographies')
                },
                matrix: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/geography/:id/matrix')
                },
                updateMatrix: {
                    method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/geography/:id/matrix')
                },
                update: {
                    method: 'PATCH'
                },
                'metrics': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/geography/:id/metrics'),
                    'isArray': false
                },
                'outcomes': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/geography/:id/outcomes'),
                    'isArray': false
                },
                tasks: {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/geography/:id/tasks'),
                    'isArray': false
                }
            });
        });

}());