(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Project', function(environment, Preprocessors,
                                     $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/project/:id'), {
                id: '@id'
            }, {
                area: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/area')
                },
                query: {
                    isArray: false
                },
                collection: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/projects')
                },
                getSingle: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id')
                },
                'summary': {
                    isArray: false,
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/data/summary/project/:id')
                },
                update: {
                    method: 'PATCH'
                },
               /* sites: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/data/project/:id/sites')
                },

                */
                 practices: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/data/project/:id/practices')
                },
                members: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/members')
                },
                post_members: {
                     method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/members')
                },
                partnerships: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/partnerships')
                },
                progress: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/progress')
                },
                sites: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/data/project/:id/sites')
                },
                minimal: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/data/program/:id/projects')
                },
                'metrics': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/project/:id/metrics'),
                    'isArray': false
                },
                'outcomes': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/project/:id/outcomes'),
                    'isArray': false
                },
                targetMatrix: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/matrix')
                },
                updateMatrix: {
                    method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/matrix')
                },
                tags: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/tags')
                },
                tagGroups: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/project/:id/tag-groups')
                }
            });
        });

}());