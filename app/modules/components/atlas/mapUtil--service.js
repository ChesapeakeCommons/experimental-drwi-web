'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('MapUtil', function(environment, Dashboard, Site, Practice, mapbox) {

        var self = this;

        return {
            fitMap: function(map, feature, padding, linear) {

                console.log(
                    'MapUtil.fitMap:',
                    map,
                    feature,
                    padding,
                    linear
                );

                var bounds;

                try {

                    try {

                        bounds = turf.bbox(
                            feature.properties.extent
                        );

                    } catch (e) {

                        console.warn(e);

                        bounds = turf.bbox(
                            feature.geometry
                        );

                    }

                } catch (e) {

                    console.warn(e);

                }

                console.log(
                    'MapUtil.fitMap:bounds:',
                    bounds
                );

                if (bounds && typeof bounds !== 'undefined') {

                    map.fitBounds(bounds, {
                        linear: linear ? linear : false,
                        padding: padding
                    });

                }

            }

        };

    });