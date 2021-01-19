'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('MapUtil', function() {

        return {
            fitMap: function(map, feature, padding, linear) {

                console.log(
                    'MapUtil.fitMap:',
                    map,
                    feature,
                    padding,
                    linear
                );

                if (map.getZoom() > 16) {

                    padding = {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: padding.left
                    };

                }

                var bounds;

                try {

                    try {

                        bounds = turf.bbox(
                            feature.properties.extent
                        );

                    } catch (e) {

                        console.warn(e);

                        if (feature.geometry.type === 'Point') {

                            var bufferedPoint = turf.buffer(
                                feature.geometry, 0.2, {units: 'kilometers'}
                            );

                            bounds = turf.bbox(
                                bufferedPoint.geometry
                            );

                        } else {

                            bounds = turf.bbox(
                                feature.geometry
                            );

                        }

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

            },
            getStyleString: function (map) {

                var styleString = 'streets';

                var style = map.getStyle();

                var mapBoxOrigin = style.metadata['mapbox:origin'];

                if (mapBoxOrigin.indexOf('satellite') >= 0) {

                    styleString = 'satellite';

                }

                return styleString;

            }

        };

    });