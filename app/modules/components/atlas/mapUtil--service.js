'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('MapUtil', function(environment, Dashboard, Site, Practice, mapbox, LayerUtil) {

        var self = this;

        return {
            addLayer: function(map, layer, featureType) {

                console.log(
                    'MapUtil:addLayer:layer:',
                    layer
                );

                console.log(
                    'MapUtil:addLayer:featureType:',
                    featureType
                );

                var beforeId = LayerUtil.getBeforeId(featureType);

                console.log(
                    'MapUtil:addLayer:beforeId:',
                    beforeId
                );

                if (map.getLayer(layer.id) !== undefined) {

                    map.removeLayer(layer.id);

                }

                if (typeof beforeId === 'string') {

                    map.addLayer(layer, beforeId);

                } else {

                    map.addLayer(layer);

                }

            },
            addSource: function(map, key, config) {

                if (map.getSource(key) !== undefined) {

                    var existingSrc = map.getSource(key);

                    existingSrc.setData(config.data);

                    var feature = config.data.features[0];

                    if (map.getLayer(key) !== undefined) {

                        var existingLayer = map.getLayer(key);



                    }

                    // try {
                    //
                    //     map.removeLayer(key);
                    //
                    // } catch (e) {
                    //
                    //     console.warn(e);
                    //
                    // }

                    // map.removeSource(key);

                } else {

                    map.addSource(key, config);

                }

            },
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

            },
            populateMap: function(map, feature) {

                var featureType = feature.properties.type;

                if (featureType === 'practice' ||
                    featureType === 'site') {

                    self.delineateWatershed(self.primaryNode);

                }

                try {

                    var sourceSpec = SourceUtil.createSource(
                        feature,
                        featureType
                    );

                    console.log(
                        'sourceSpec:',
                        sourceSpec
                    );

                    SourceUtil.trackSource(sourceSpec.id, sourceSpec.config);

                    map.addSource(sourceSpec.id, sourceSpec.config);

                    var layerSpec = LayerUtil.createLayer(
                        sourceSpec,
                        featureType
                    );

                    console.log(
                        'layerSpec:',
                        layerSpec
                    );

                    try {

                        layerSpec.id = sourceSpec.id;

                        if (map.getZoom >= 12) {

                            LayerUtil.trackLayer(layerSpec);

                            map.addLayer(layerSpec);

                        }

                    } catch (e) {

                        console.warn(e);

                        if (featureType === 'project') {

                            try {

                                var popupHtml = PopupUtil.createPopup(
                                    self.feature.id,
                                    self.primaryNode,
                                    'project',
                                    self.activeStyle);

                                var marker = new mapboxgl.Marker()
                                    .setLngLat([
                                        feature.properties.centroid.coordinates[0],
                                        feature.properties.centroid.coordinates[1]
                                    ])
                                    .setPopup(
                                        new mapboxgl.Popup({
                                            maxWidth: 'none'
                                        }).setDOMContent(popupHtml)
                                    ) // add popup
                                    .addTo(map);

                            } catch (e) {

                                console.warn(e);

                            }

                        }

                    }

                } catch (e) {

                    console.error(e);

                }

            }

        };

    });