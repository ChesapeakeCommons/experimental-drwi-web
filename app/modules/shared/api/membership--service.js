(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Membership', function(environment, Preprocessors, $resource) {
            return $resource(environment.apiUrl.concat('/v1/membership/:targetType/:id'), {
                'id': '@id',
                'targetType': '@targetType'
            }, {
                update: {
                    method: 'PATCH'
                },
                getConfirmed: {
                    method: 'GET',
                    url: '/v1/membership/confirmed/:targetType/:id',
                    headers: {
                        'Authorization-Bypass': true
                    }
                },
                invite: {
                    method: 'POST',
                    url: environment.apiUrl.concat('/v1/membership/invitation')
                }
            });
        });

}());