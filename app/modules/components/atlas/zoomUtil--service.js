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
            practice: {
                min: 14,
                max: 22
            },
            site: {
                min: 10,
                max: 16
            },
            project: {
                min: 9,
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