'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('ZoomUtil', function() {

        var zoomConfig = {
            post: {
                min: 8,
                max: 22
            },
            practice: {
                min: 14,
                max: 22
            },
            site: {
                min: 10,
                max: 16
            },
            station: {
                min: 8,
                max: 22
            },
            project: {
                min: 2,
                max: 14
            }
        };

        return {
            getZoom: function (featureType) {

                console.log(
                    'ZoomUtil:getZoom:featureType',
                    featureType);

                if (zoomConfig.hasOwnProperty(featureType)) {

                    return zoomConfig[featureType];

                }

                return zoomConfig;

            }

        };

    });