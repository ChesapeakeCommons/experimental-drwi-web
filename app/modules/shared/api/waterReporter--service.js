(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('WaterReporterInterface', function(environment, Preprocessors, $resource) {

            return $resource(environment.waterReportApiUrl.concat('/v2/feature-layer/:id'), {
                id: '@id'
            }, {
                query: {
                    isArray: false
                },
                featureLayer: {
                    method: 'GET',
                    cache: true,
                    url: environment.waterReportApiUrl.concat('/v2/feature-layer/:featureType/:geometryType')
                },
                nodeLayer: {
                    method: 'GET',
                    url: environment.apiUrl.concat('/v1/:featureType/:id/layer')
                },
                update: {
                    method: 'PATCH',
                    url: environment.apiUrl.concat('/v1/map/:id')
                }
            });

        });

}());