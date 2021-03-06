(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('GeographyType', function(environment, Preprocessors, $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/geography-type/:id'), {
                'id': '@id'
            }, {
                'query': {
                    'isArray': false
                },
                collection: {
                    method: 'GET',
                    isArray: false,
                    url: environment.apiUrl.concat('/v1/geography-type')
                },
                update: {
                    'method': 'PATCH'
                }
            });
        });

}());