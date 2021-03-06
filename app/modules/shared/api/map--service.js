(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('MapInterface', function(environment, Preprocessors,
                                          $resource) {

            return $resource(environment.apiUrl.concat('/v1/map/:id'), {
                id: '@id'
            }, {
                query: {
                    isArray: false
                },
                featureLayer: {
                    method: 'GET',
                    cache: true,
                    url: environment.apiUrl.concat('/v1/feature-layer/:featureType/:geometryType'),
                },
                nodeLayer: {
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/:featureType/:id/layer')
                },
                progress: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/map/:id/progress')
                },
                update: {
                    method: 'PATCH',
                    url: environment.apiUrl.concat('/v1/map/:id')
                }
            });

        });

}());