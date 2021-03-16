(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Practice', function(environment, Preprocessors,
                                      $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/practice/:id'), {
                'id': '@id',
                'target_id': '@target_id',
                'targetId': '@targetId'
            }, {
                'query': {
                    'isArray': false
                },
                getSingle: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id')
                },
                update: {
                    method: 'PATCH'
                },
                layers: {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/practice/:id/layers'),
                    'isArray': false
                },
             /*  'metrics': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/practice/:id/metrics'),
                    'isArray': false
                },

              */
                'outcomes': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/practice/:id/outcomes'),
                    'isArray': false
                },
                allocations: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/allocations')
                },
                partnerships: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/partnerships')
                },
                reports: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/reports')
                },
                'site': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/practice/:id/site'),
                    'isArray': false
                },
                'custom': {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/data/practice/:id/readings_custom'),
                    'isArray': false
                },
                models: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/models')
                },
                progress: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/progress')
                },
                publicFeature: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/public')
                },
                tags: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/tags')
                },
                tagGroups: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/tag-groups')
                },
                targetMatrix: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/matrix')
                },
                tasks: {
                    'method': 'GET',
                    'url': environment.apiUrl.concat('/v1/practice/:id/tasks'),
                    'isArray': false
                },
                updateMatrix: {
                    method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/matrix')
                },
                checkStatus: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/status')
                },
                copy: {
                    method: 'POST',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/clone')
                },
                metrics: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/metrics/')
                },
                target: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/target/:target_id')
                },
                targetUpdate: {
                    method: 'PATCH',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/target/:targetId')
                },
                targetDelete: {
                    method: 'DELETE',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/practice/:id/target/:target_id')

                }

            });
        });

}());