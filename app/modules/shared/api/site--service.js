(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Site', function(environment, Preprocessors,
                                  $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/site/:id'), {
                id: '@id'
            }, {
                'query': {
                    isArray: false
                },
                getSingle: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id')
                },
                'summary': {
                    isArray: false,
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/data/summary/site/:id')
                },
                'nodes': {
                    isArray: false,
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/data/site/:id/nodes')
                },
                allocations: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/allocations')
                },
                partnerships: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/partnerships')
                },
                update: {
                    method: 'PATCH'
                },
                'metrics': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/site/:id/metrics'),
                    'isArray': false
                },
                'outcomes': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/site/:id/outcomes'),
                    'isArray': false
                },
                'practices': {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/practices')
                },
                progress: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/progress')
                },
                publicFeature: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/public')
                },
                tags: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/tags')
                },
                tagGroups: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/tag-groups')
                },
                targetMatrix: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/matrix')
                },
                tasks: {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/site/:id/tasks'),
                    'isArray': false
                },
                updateMatrix: {
                    method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/site/:id/matrix')
                }
            });
        });

}());