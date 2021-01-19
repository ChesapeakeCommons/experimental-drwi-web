(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Membership', function(environment, Preprocessors, $resource) {
            return $resource(environment.apiUrl.concat('/v1/membership/:id'), {
                'id': '@id'
            }, {
                update: {
                    method: 'PATCH'
                }
            });
        });

}());