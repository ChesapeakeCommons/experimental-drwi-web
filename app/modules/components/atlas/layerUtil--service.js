'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('LayerUtil', function(environment, Dashboard, Site, Practice, mapbox) {

        // Let's set an internal reference to this service
        var self = this;

        var config = {
            'delineation': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        'circle-color': '#00C8FF',
                        'circle-radius': 8,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#00C8FF'
                    },
                    'fill': {
                        'fill-color': '#00C8FF',
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#424242'
                    },
                    'line': {
                        'line-color': '#00C8FF',
                        'line-width': 2
                    }
                }
            },
            'geography': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        'circle-color': '#fbb03b',
                        'circle-radius': 8,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#FF0033'
                    },
                    'fill': {
                        'fill-color': '#fbb03b',
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#FF0033'
                    },
                    'line': {
                        'line-color': '#fbb03b',
                        'line-width': 2
                    }
                }
            },
            'practice': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        'circle-color': '#df063e',
                        'circle-radius': 8,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#005e7d'
                    },
                    'fill': {
                        'fill-color': '#df063e',
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'line': {
                        'line-color': '#df063e',
                        'line-width': 2
                    }
                }
            },
            'site': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        'circle-color': '#a94efe',
                        'circle-radius': 8,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#005e7d'
                    },
                    'fill': {
                        'fill-color': '#a94efe',
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'line': {
                        'line-color': '#a94efe',
                        'line-width': 2
                    }
                }
            }
        };

        return {
            createLayer: function(sourceSpec, featureType) {

                console.log(
                    'LayerUtil:createLayer:sourceSpec',
                    sourceSpec);

                console.log(
                    'LayerUtil:createLayer:featureType',
                    featureType);

                var geometry;

                try {

                    geometry = sourceSpec.config.data.features[0].geometry;

                } catch (e) {

                    return;

                }

                var geometryType;

                try {

                    geometryType = geometry.type;

                } catch (e) {

                    return;

                }

                var layerId = 'layer-' + sourceSpec.id;

                var layerType;

                var paintSpec;

                if (geometryType === 'Polygon' ||
                    geometryType === 'MultiPolygon') {

                    layerType = 'fill';

                } else if (geometryType === 'Line' ||
                    geometryType === 'LineString') {

                    layerType = 'line';

                } else if (geometryType === 'Point') {

                    layerType = 'circle';

                }

                console.log(
                    'LayerUtil:createLayer:layerType',
                    layerType);

                paintSpec = config[featureType].paintSpec[layerType];

                console.log(
                    'LayerUtil:createLayer:paintSpec',
                    paintSpec);

                return {
                    id: layerId,
                    source: sourceSpec.id,
                    type: layerType,
                    paint: paintSpec
                };

            },
            _index: {},
            dropLayer: function (layer) {

                delete this._index[layer.id];

            },
            list: function () {

                var vals = [];

                for (var key in this._index) {

                    if (this._index.hasOwnProperty(key)) {

                        vals.push(this._index[key]);

                    }

                }

                return vals;

            },
            removeAll: function() {

                this._index = {};

            },
            removeLayers: function(map) {

                var layers = map.getStyle().layers;

                layers.forEach(function (layer) {

                    if (layer.id.startsWith('fd.') &&
                        map.getLayer(layer.id)) {

                        map.removeLayer(layer.id);

                    }

                });

            },
            toggleLayer: function(layerId, map) {

                console.log(
                    'LayerUtil.toggleLayer:layerId:',
                    layerId
                );

                var visibility = map.getLayoutProperty(layerId, 'visibility');

                console.log(
                    'LayerUtil.toggleLayer:visibility:',
                    visibility
                );

                //
                // If undefined, assume that layers have the default visibility.
                //

                visibility = typeof visibility === 'string' ? visibility : 'visible';

                if (visibility === 'visible') {

                    map.setLayoutProperty(layerId, 'visibility', 'none');

                } else {

                    map.setLayoutProperty(layerId, 'visibility', 'visible');

                }

            },
            trackLayer: function (layer) {

                this._index[layer.id] = layer;

            },
            trackLayers: function (map) {

                var mod = this;

                var layers = map.getStyle().layers;

                layers.forEach(function (layer) {

                    if (layer.id.startsWith('fd.') &&
                        map.getLayer(layer.id)) {

                        mod.trackLayer(layer);

                    }

                });

            }

        };

    });