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

        var labelConfig = {
            'project': {
                'point': {
                    'id': 'fd.project-label',
                    'type': 'symbol',
                    'minzoom': 9,
                    'maxzoom': 14,
                    'layout': {
                        'symbol-placement': 'point',
                        'text-anchor': 'bottom',
                        'text-field': ['get', 'name'],
                        'text-variable-anchor': [
                            'top', 'bottom', 'left', 'right'
                        ],
                        'text-font': {
                            'stops': [
                                [
                                    9,
                                    [
                                        'DIN Offc Pro Regular',
                                        'Arial Unicode MS Regular'
                                    ]
                                ],
                                [
                                    11,
                                    [
                                        'DIN Offc Pro Regular',
                                        'Arial Unicode MS Regular'
                                    ]
                                ],
                                [
                                    14,
                                    [
                                        'DIN Offc Pro Medium',
                                        'Arial Unicode MS Bold'
                                    ]
                                ]
                            ]
                        },
                        'text-size': [
                            'interpolate',
                            ['exponential', 0.5],
                            ['zoom'],
                            9,
                            12,
                            14,
                            16
                        ],
                        'text-radial-offset': 0.5,
                        'text-justify': 'auto'
                    },
                    'paint': {
                        'text-halo-width': 1,
                        'text-halo-color': 'rgba(255,255,255,0.75)',
                        'text-halo-blur': 1,
                        'text-color': [
                            'interpolate',
                            ['exponential', 0.5],
                            ['zoom'],
                            9,
                            '#616161',
                            14,
                            '#212121'
                        ]
                    }
                }
            }
        };

        var paintConfig = {
            'delineation': {
                'prefix': 'si',
                'paintSpec': {
                    'fill': {
                        'fill-color': '#00C8FF',
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#424242'
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
                        // 'circle-color': '#df063e',
                        'circle-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#D43F3F',
                            '#3fd48a'
                        ],
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
                        // 'fill-color': '#df063e',
                        'fill-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#D43F3F',
                            '#3fd48a'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'line': {
                        // 'line-color': '#df063e',
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#D43F3F',
                            '#3fd48a'
                        ],
                        'line-width': 2
                    }
                }
            },
            'site': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        // 'circle-color': '#a94efe',
                        'circle-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#D43F3F',
                            '#a94efe'
                        ],
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
                        // 'fill-color': '#a94efe',
                        'fill-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#D43F3F',
                            '#a94efe'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'line': {
                        // 'line-color': '#a94efe',
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#D43F3F',
                            '#a94efe'
                        ],
                        'line-width': 2
                    }
                }
            },
            'project': {
                'prefix': 'si',
                'paintSpec': {
                    'circle': {
                        // 'circle-color': '#2196F3',
                        'circle-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#ff0000',
                            '#2196F3'
                        ],
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
                        // 'fill-color': '#fbb03b',
                        'fill-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#ff0000',
                            '#2196F3'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#FF0033'
                    },
                    'line': {
                        // 'line-color': '#fbb03b',
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#ff0000',
                            '#2196F3'
                        ],
                        'line-width': 2
                    }
                }
            }
        };

        var URL_COMPONENTS = [
            ['practice', 'line'],
            ['practice', 'point'],
            ['practice', 'polygon'],
            ['site', 'line'],
            ['site', 'point'],
            ['site', 'polygon'],
            ['project', 'point'],
        ];

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
            createLabelLayer: function (source, nodeType, layerType) {

                try {

                    var layerConfig = labelConfig[nodeType][layerType];

                    layerConfig.source = source.id;

                    return layerConfig;

                } catch (e) {

                    return undefined;

                }

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
            getBeforeId: function (featureType) {

                if (featureType === 'practice') {

                    return 'project-index';

                }

                if (featureType === 'site') {

                    return 'practice-index';

                }

                if (featureType === 'drainage') {

                    return 'site-index';

                }

            },
            getPaint: function (featureType, layerType) {

                console.log(
                    'LayerUtil:getPaint:featureType',
                    featureType);

                console.log(
                    'LayerUtil:getPaint:layerType',
                    layerType);

                return paintConfig[featureType].paintSpec[layerType];

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
            getUrlComponents: function () {

                return URL_COMPONENTS;

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