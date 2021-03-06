'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('DataLayer', function(ZoomUtil) {

        var zoomConfig = ZoomUtil.getZoom();

        var DATA_LAYERS = [
            {
                config: {
                    'id': 'fd.drainage.polygon',
                    'source': 'fd.drainage.polygon',
                    'type': 'fill',
                    'minzoom': 8,
                    paint: {
                        'fill-color': '#00C8FF',
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#424242'
                    }
                },
                beforeId: 'site-index'
            },
            {
                config: {
                    'id': 'fd.project.point',
                    'source': 'fd.project.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.project.min,
                    'maxzoom': zoomConfig.project.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#ff0000',
                            // '#2196F3'
                            [
                                'match',
                                ['get', 'status'],
                                'draft',
                                '#f37e21',
                                'active',
                                '#3AA63A',
                                /* other */ '#2196F3'
                            ]
                        ],
                        'circle-radius': [
                            'interpolate',
                            ['exponential', 0.5],
                            ['zoom'],
                            zoomConfig.project.min,
                            0.5,
                            zoomConfig.project.max,
                            6
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFFFFF'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: ''
            },
            {
                config: {
                    'id': 'wr.station.point',
                    'source': 'wr.station.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.station.min,
                    'maxzoom': zoomConfig.station.max,
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['feature-state', 'focus'], false],
                            '#ff0000',
                            '#0000ff'
                        ],
                        'circle-radius': [
                            'interpolate',
                            ['exponential', 0.5],
                            ['zoom'],
                            zoomConfig.station.min,
                            0.5,
                            zoomConfig.station.max,
                            6
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFFFFF'
                    }
                },
                beforeId: ''
            },
            {
                config: {
                    'id': 'fd.practice.centroid',
                    'source': 'fd.practice.centroid',
                    'type': 'circle',
                    'minzoom': 6,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
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
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.polygon',
                    'source': 'fd.practice.polygon',
                    'type': 'fill',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'fill-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#3fd48a'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.multipolygon',
                    'source': 'fd.practice.multipolygon',
                    'type': 'fill',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'fill-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#3fd48a'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.linestring',
                    'source': 'fd.practice.linestring',
                    'type': 'line',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'line-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#3fd48a'
                        ],
                        'line-width': 2
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.multilinestring',
                    'source': 'fd.practice.multilinestring',
                    'type': 'line',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'line-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#3fd48a'
                        ],
                        'line-width': 2
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.point',
                    'source': 'fd.practice.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
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
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.multipoint',
                    'source': 'fd.practice.multipoint',
                    'type': 'circle',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
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
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.site.polygon',
                    'source': 'fd.site.polygon',
                    'type': 'fill',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'fill-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#a94efe'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.multipolygon',
                    'source': 'fd.site.multipolygon',
                    'type': 'fill',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'fill-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#a94efe'
                        ],
                        'fill-opacity': 0.4,
                        'fill-outline-color': '#005e7d'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.linestring',
                    'source': 'fd.site.linestring',
                    'type': 'line',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'line-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#a94efe'
                        ],
                        'line-width': 2
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.multilinestring',
                    'source': 'fd.site.multilinestring',
                    'type': 'line',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'line-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
                            '#a94efe'
                        ],
                        'line-width': 2
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.point',
                    'source': 'fd.site.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max + 1,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
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
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.multipoint',
                    'source': 'fd.site.multipoint',
                    'type': 'circle',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max + 1,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': [
                            'case',
                            ['boolean', ['get', 'focus'], false],
                            '#C81E1E',
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
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            // {
            //     config: {
            //         'id': 'fd.site.centroid',
            //         'source': 'fd.site.centroid',
            //         'type': 'circle',
            //         'minzoom': 4,
            //         'maxzoom': zoomConfig.site.max + 1,
            //         'layout': {
            //             'visibility': 'visible'
            //         },
            //         'paint': {
            //             'circle-color': [
            //                 'case',
            //                 ['boolean', ['feature-state', 'focus'], false],
            //                 '#C81E1E',
            //                 '#a94efe'
            //             ],
            //             'circle-radius': {
            //                 'base': 2,
            //                 'stops': [
            //                     [12, 4],
            //                     [22, 24]
            //                 ]
            //             },
            //             'circle-stroke-width': 1,
            //             'circle-stroke-color': '#FFFFFF'
            //         },
            //         'filter': ['get', 'focus']
            //     },
            //     beforeId: 'practice-index'
            // }
        ];

        return {
            addDataLayers: function (map) {

                DATA_LAYERS.forEach(function (layerSpec) {

                    if (map.getLayer(layerSpec.config.id) === undefined) {

                        map.addLayer(layerSpec.config, layerSpec.beforeId);

                    }

                });

            },
            list: function () {

                return DATA_LAYERS;

            }
        };

    });