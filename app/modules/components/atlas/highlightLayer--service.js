'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('HighlightLayer', function(ZoomUtil) {

        var zoomConfig = ZoomUtil.getZoom();

        var HIGHLIGHT_LAYERS = [
            {
                config: {
                    'id': 'fd.project.point-highlight',
                    'source': 'fd.project.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.project.min,
                    'maxzoom': zoomConfig.project.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': '#ff0000',
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
            // {
            //     config: {
            //         'id': 'wr.station.point-highlight',
            //         'source': 'wr.station.point',
            //         'type': 'circle',
            //         'minzoom': zoomConfig.station.min,
            //         'maxzoom': zoomConfig.station.max,
            //         'paint': {
            //             'circle-color': '#ff0000',
            //             'circle-radius': [
            //                 'interpolate',
            //                 ['exponential', 0.5],
            //                 ['zoom'],
            //                 zoomConfig.station.min,
            //                 0.5,
            //                 zoomConfig.station.max,
            //                 6
            //             ],
            //             'circle-stroke-width': 2,
            //             'circle-stroke-color': '#FFFFFF'
            //         }
            //     },
            //     beforeId: ''
            // },
            {
                config: {
                    'id': 'fd.practice.centroid-highlight',
                    'source': 'fd.practice.centroid',
                    'type': 'circle',
                    'minzoom': 4,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': '#C81E1E',
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
                    'id': 'fd.practice.polygon-highlight',
                    'source': 'fd.practice.polygon',
                    'type': 'fill',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'fill-color': '#C81E1E',
                        'fill-opacity': 0.2,
                        'fill-outline-color': '#C81E1E'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.linestring-highlight',
                    'source': 'fd.practice.linestring',
                    'type': 'line',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'line-color': '#C81E1E',
                        'line-width': 2
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'project-index'
            },
            {
                config: {
                    'id': 'fd.practice.point-highlight',
                    'source': 'fd.practice.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.practice.min,
                    'maxzoom': zoomConfig.practice.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': '#C81E1E',
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
                    'id': 'fd.site.polygon-highlight',
                    'source': 'fd.site.polygon',
                    'type': 'fill',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'fill-color': '#C81E1E',
                        'fill-opacity': 0.2,
                        'fill-outline-color': '#C81E1E'
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.linestring-highlight',
                    'source': 'fd.site.linestring',
                    'type': 'line',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'line-color': '#C81E1E',
                        'line-width': 2
                    },
                    'filter': ['get', 'focus']
                },
                beforeId: 'practice-index'
            },
            {
                config: {
                    'id': 'fd.site.point-highlight',
                    'source': 'fd.site.point',
                    'type': 'circle',
                    'minzoom': zoomConfig.site.min + 1,
                    'maxzoom': zoomConfig.site.max + 1,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': '#C81E1E',
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
                    'id': 'fd.site.centroid-highlight',
                    'source': 'fd.site.centroid',
                    'type': 'circle',
                    'minzoom': 4,
                    'maxzoom': zoomConfig.site.max + 1,
                    'layout': {
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-color': '#C81E1E',
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
            }
        ];

        return {
            addHighlightLayers: function (map) {

                HIGHLIGHT_LAYERS.forEach(function (layerSpec) {

                    if (map.getLayer(layerSpec.config.id) === undefined) {

                        map.addLayer(layerSpec.config, layerSpec.beforeId);

                    }

                });

            },
            list: function () {

                return HIGHLIGHT_LAYERS;

            },
            setHighlight: function (map, feature) {

                console.log(
                    'HighlightLayer.setHighlight.feature:',
                    feature
                );

                if (!feature.source.startsWith('fd.') &&
                    !feature.source.startsWith('wr.')) return;

                var targetSource = feature.source.split('-')[0];

                console.log(
                    'HighlightLayer.setHighlight.targetSource:',
                    targetSource
                );

                var featureMatches = map.querySourceFeatures(targetSource, {
                    sourceLayer: targetSource,
                    filter: ['==', 'id', feature.properties.id]
                });

                console.log(
                    'HighlightLayer.setHighlight.featureMatches:',
                    featureMatches
                );

                if (featureMatches.length) {

                    var highlightSource = targetSource + '-highlight';

                    console.log(
                        'HighlightLayer.setHighlight.highlightSource:',
                        highlightSource
                    );

                    var source = map.getSource(highlightSource);

                    if (source !== undefined) {

                        source.setData({
                            'type': 'FeatureCollection',
                            'features': featureMatches
                        });

                    }

                }

            }
        };

    });