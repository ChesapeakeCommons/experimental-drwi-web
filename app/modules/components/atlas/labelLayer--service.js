'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('LabelLayer', function(ZoomUtil) {

        var zoomConfig = ZoomUtil.getZoom();

        var LABEL_LAYERS = [{
            'id': 'fd.practice.polygon-label',
            'source': 'fd.practice.polygon',
            'type': 'symbol',
            'minzoom': zoomConfig.practice.min,
            'maxzoom': zoomConfig.practice.max,
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
                            zoomConfig.practice.min,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.practice.min + Math.ceil((zoomConfig.practice.max - zoomConfig.practice.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.practice.max,
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
                    zoomConfig.practice.min,
                    12,
                    zoomConfig.practice.max,
                    16
                ],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.practice.min,
                    '#616161',
                    zoomConfig.practice.max,
                    '#212121'
                ]
            }
        }, {
            'id': 'fd.practice.line-label',
            'source': 'fd.practice.line',
            'type': 'symbol',
            'minzoom': zoomConfig.practice.min,
            'maxzoom': zoomConfig.practice.max,
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
                            zoomConfig.practice.min,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.practice.min + Math.ceil((zoomConfig.practice.max - zoomConfig.practice.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.practice.max,
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
                    zoomConfig.practice.min,
                    12,
                    zoomConfig.practice.max,
                    16
                ],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.practice.min,
                    '#616161',
                    zoomConfig.practice.max,
                    '#212121'
                ]
            }
        }, {
            'id': 'fd.practice.point-label',
            'source': 'fd.practice.point',
            'type': 'symbol',
            'minzoom': zoomConfig.practice.min,
            'maxzoom': zoomConfig.practice.max,
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
                            zoomConfig.practice.min,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.practice.min + Math.ceil((zoomConfig.practice.max - zoomConfig.practice.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.practice.max,
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
                    zoomConfig.practice.min,
                    12,
                    zoomConfig.practice.max,
                    16
                ],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.practice.min,
                    '#616161',
                    zoomConfig.practice.max,
                    '#212121'
                ]
            }
        }, {
            'id': 'fd.site.polygon-label',
            'source': 'fd.site.polygon',
            'type': 'symbol',
            'minzoom': zoomConfig.site.min + 1,
            'maxzoom': zoomConfig.site.max,
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
                            zoomConfig.site.min + 1,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.site.min + Math.ceil((zoomConfig.site.max - zoomConfig.site.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.site.max,
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
                    zoomConfig.site.min + 1,
                    12,
                    zoomConfig.site.max,
                    16
                ],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.site.min + 1,
                    '#616161',
                    zoomConfig.site.max,
                    '#212121'
                ]
            }
        }, {
            'id': 'fd.site.line-label',
            'source': 'fd.site.line',
            'type': 'symbol',
            'minzoom': zoomConfig.site.min + 1,
            'maxzoom': zoomConfig.site.max,
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
                            zoomConfig.site.min + 1,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.site.min + Math.ceil((zoomConfig.site.max - zoomConfig.site.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.site.max,
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
                    zoomConfig.site.min + 1,
                    12,
                    zoomConfig.site.max,
                    16
                ],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.site.min + 1,
                    '#616161',
                    zoomConfig.site.max,
                    '#212121'
                ]
            }
        }, {
            'id': 'fd.site.point-label',
            'source': 'fd.site.point',
            'type': 'symbol',
            'minzoom': zoomConfig.site.min + 1,
            'maxzoom': zoomConfig.site.max,
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
                            zoomConfig.site.min + 1,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.site.min + Math.ceil((zoomConfig.site.max - zoomConfig.site.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.site.max,
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
                    zoomConfig.site.min + 1,
                    12,
                    zoomConfig.site.max,
                    16
                ],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.site.min,
                    '#616161',
                    zoomConfig.site.max,
                    '#212121'
                ]
            }
        }, {
            'id': 'fd.project.point-label',
            'source': 'fd.project.point',
            'type': 'symbol',
            'minzoom': zoomConfig.project.min,
            'maxzoom': zoomConfig.project.max,
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
                            zoomConfig.project.min,
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.project.min + Math.ceil((zoomConfig.project.max - zoomConfig.project.min) / 2),
                            [
                                'DIN Offc Pro Regular',
                                'Arial Unicode MS Regular'
                            ]
                        ],
                        [
                            zoomConfig.project.max,
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
                    zoomConfig.project.min,
                    12,
                    zoomConfig.project.max,
                    16
                ],
                'text-radial-offset': 0.75,
                'text-justify': 'auto',
                'visibility': 'visible'
            },
            'paint': {
                'text-halo-width': 1,
                'text-halo-color': 'rgba(255,255,255,0.75)',
                'text-halo-blur': 1,
                'text-color': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    zoomConfig.project.min,
                    '#616161',
                    zoomConfig.project.max,
                    '#212121'
                ]
            }
        }];

        return {
            addLabelLayers: function (map) {

                LABEL_LAYERS.forEach(function (layer) {

                    if (map.getLayer(layer.id) === undefined) {

                        map.addLayer(layer, 'label-index');

                    }

                });

            },
            index: function () {

                var idx = {};

                LABEL_LAYERS.forEach(function (layer) {

                    idx[layer.id] = layer;

                });

                return idx;

            },
            list: function () {

                return LABEL_LAYERS;

            }
        };

    });