(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name WaterReporter
     * @description
     * Provides access to the User endpoint of the WaterReporter API
     * Service in the WaterReporter.
     */
    angular.module('FieldDoc')
        .service('AccessToken', [
            'environment',
            '$window',
            '$resource',
            function(environment, $window, $resource) {
                return $resource(environment.apiUrl.concat('/v1/tokens/:id'), {
                    id: '@id'
                }, {
                    query: {
                        isArray: false
                    },
                    update: {
                        method: 'PATCH'
                    },
                    create: {
                        method: 'POST',
                        url: environment.apiUrl.concat('/v1/tokens')
                    },
                    remove: {
                        method: 'DELETE'
                    }
                });
            }
        ]);

}());
