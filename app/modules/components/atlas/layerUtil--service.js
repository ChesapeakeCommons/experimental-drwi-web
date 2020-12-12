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
                        'circle-radius': {
                            'base': 2,
                            'stops': [
                                [12, 4],
                                [22, 24]
                            ]
                        },
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#FFFFFF'
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
                        'circle-radius': {
                            'base': 2,
                            'stops': [
                                [12, 4],
                                [22, 24]
                            ]
                        },
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#FFFFFF'
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
            },
            'project': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        'circle-color': '#2196F3',
                        // 'circle-radius': {
                        //     'base': 2,
                        //     'stops': [
                        //         [12, 8],
                        //         [22, 24]
                        //     ]
                        // },
                        'circle-radius': [
                            'interpolate',
                            ['exponential', 0.5],
                            ['zoom'],
                            9,
                            2,
                            14,
                            6
                        ],
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#FFFFFF'
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

                var layerId = sourceSpec.id;

                var layerType = this.getType(geometryType);

                console.log(
                    'LayerUtil:createLayer:layerType',
                    layerType);

                var paintSpec = this.getPaint(featureType, layerType);

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
            getIds: function (map, nodeType) {

                var nodeTypes = [
                    'practice',
                    'site',
                    'project'
                ];

                var layers = map.getStyle().layers;

                var fdArray = [];

                layers.forEach(function (layer) {

                    if (layer.id.startsWith('fd.') &&
                        map.getLayer(layer.id)) {

                        if (nodeTypes.indexOf(nodeType) >= 0) {

                            if (layer.id.indexOf(nodeType) >= 0) {

                                fdArray.push(layer.id);

                            }

                        } else {

                            fdArray.push(layer.id);

                        }

                    }

                });

                return fdArray;

            },
            getPaint: function (featureType, layerType) {

                console.log(
                    'LayerUtil:getPaint:featureType',
                    featureType);

                console.log(
                    'LayerUtil:getPaint:layerType',
                    layerType);

                return config[featureType].paintSpec[layerType];

            },
            getType: function (geometryType) {

                geometryType = geometryType.toLowerCase();

                var layerType;

                if (geometryType === 'polygon' ||
                    geometryType === 'multipolygon') {

                    layerType = 'fill';

                } else if (geometryType === 'line' ||
                    geometryType === 'linestring') {

                    layerType = 'line';

                } else if (geometryType === 'point') {

                    layerType = 'circle';

                }

                return layerType;

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