(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('GeographyService', function(environment, Preprocessors, $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/territory/:id'), {
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
                getSingle: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/territory/:id')
                },
                matrix: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/territory/:id/matrix')
                },
                updateMatrix: {
                    method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/territory/:id/matrix')
                },
                update: {
                    method: 'PATCH'
                },
                'metrics': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/territory/:id/metrics'),
                    'isArray': false
                },
                'outcomes': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/territory/:id/outcomes'),
                    'isArray': false
                },
                pointLayer: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/territory/:id/point-layer')
                },
                progress: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/territory/:id/progress')
                },
                tags: {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/territory/:id/tags'),
                    'isArray': false
                },
                tasks: {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/territory/:id/tasks'),
                    'isArray': false
                },
                batchDelete: {
                    'method': 'DELETE',
                    'url': environment.apiUrl.concat('/v1/geographies'),
                    'isArray': false
                }
            });
        });

}());