(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('GenericFile', function(environment, $resource) {

            return $resource(environment.apiUrl.concat('/v1/media/document/:id'), {
                id: '@id'
            }, {
                query: {
                    isArray: false
                },
                upload: {
                    method: 'POST',
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                },
                update: {
                    method: 'PATCH',
                    url: environment.apiUrl.concat('/v1/document/:id')
                },
                'delete': {
                    method: 'DELETE',
                    url: environment.apiUrl.concat('/v1/document/:id')
                }
            });

        });

}());