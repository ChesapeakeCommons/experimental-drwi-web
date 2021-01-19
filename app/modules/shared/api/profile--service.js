(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Profile', function (environment, $resource) {
            return $resource(environment.apiUrl.concat('/v1/data/user/:id'), {
                id: '@id'
            }, {
                query: {
                    isArray: false
                },
                me: {
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/data/user/me')
                },
                member: {
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/user/:id')
                }
            });
        });

}());
