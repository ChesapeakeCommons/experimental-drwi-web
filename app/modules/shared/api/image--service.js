(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Image', function(environment, Preprocessors, $resource) {

            return $resource(environment.apiUrl.concat('/v1/media/image/:id'), {
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
                    url: environment.apiUrl.concat('/v1/image/:id')
                },
                'delete': {
                    method: 'DELETE',
                    url: environment.apiUrl.concat('/v1/image/:id')
                }
            });

        });

}());