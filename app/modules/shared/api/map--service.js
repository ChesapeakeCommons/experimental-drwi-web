(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('MapInterface', function(environment, Preprocessors, $resource) {

            return $resource(environment.apiUrl.concat('/v1/map/:id'), {
                id: '@id'
            }, {
                query: {
                    isArray: false
                },
                update: {
                    method: 'PATCH',
                    url: environment.apiUrl.concat('/v1/map/:id')
                }
            });

        });

}());