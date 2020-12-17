'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('LayerUtil', function(LabelLayer) {

        var EMPTY_SOURCE = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            },
            generateId: true
        };

        var REFERENCE_SOURCES = {
            'empty': EMPTY_SOURCE,
            'fd.drainage.polygon': EMPTY_SOURCE,
            'fd.practice.point': EMPTY_SOURCE,
            'fd.practice.line': EMPTY_SOURCE,
            'fd.practice.polygon': EMPTY_SOURCE,
            'fd.site.point': EMPTY_SOURCE,
            'fd.site.line': EMPTY_SOURCE,
            'fd.site.polygon': EMPTY_SOURCE,
            'fd.project.point': EMPTY_SOURCE
        };

        var REFERENCE_LAYERS = [
            //
            // The project and label layers have the highest z-index priority.
            //
            {
                sourceConfig: EMPTY_SOURCE,
                layerConfig: {
                    id: 'project-index',
                    type: 'symbol',
                    source: 'empty'
                },
                beforeId: ''
            },
            {
                sourceConfig: EMPTY_SOURCE,
                layerConfig: {
                    id: 'label-index',
                    type: 'symbol',
                    source: 'empty'
                },
                beforeId: ''
            },
            //
            // The practice layer has the second-highest z-index priority.
            //
            {
                sourceConfig: EMPTY_SOURCE,
                layerConfig: {
                    id: 'practice-index',
                    type: 'symbol',
                    source: 'empty'
                },
                beforeId: 'project-index'
            },
            //
            // The site layer has the second-lowest z-index priority.
            //
            {
                sourceConfig: EMPTY_SOURCE,
                layerConfig: {
                    id: 'site-index',
                    type: 'symbol',
                    source: 'empty'
                },
                beforeId: 'practice-index'
            }
        ];

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
            addReferenceLayers: function (map) {

                REFERENCE_LAYERS.forEach(function (layer) {

                    if (map.getLayer(layer.layerConfig.id) === undefined) {

                        map.addLayer(layer.layerConfig, layer.beforeId);

                    }

                });

            },
            addReferenceSources: function (map) {

                for (var key in REFERENCE_SOURCES) {

                    if (map.getSource(key) === undefined) {

                        map.addSource(key, REFERENCE_SOURCES[key]);

                    }

                }

            },
            _index: {},
            getBeforeId: function (featureType) {

                if (featureType.indexOf('label') >= 0) {

                    return 'label-index';

                }

                if (featureType === 'practice') {

                    return 'project-index';

                }

                if (featureType === 'site') {

                    return 'practice-index';

                }

                if (featureType === 'drainage') {

                    return 'site-index';

                }

                return '';

            },
            getUrlComponents: function () {

                return URL_COMPONENTS;

            },
            getZoom: function (featureType) {

                console.log(
                    'LayerUtil:getZoom:featureType',
                    featureType);

                if (zoomConfig.hasOwnProperty(featureType)) {

                    return zoomConfig[featureType];

                }

                return zoomConfig;

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
            setTextColor: function (map, styleString) {

                var mod = this;

                var layerIds = Object.keys(LabelLayer.index());

                layerIds.forEach(function (layerId) {

                    if (layerId.startsWith('fd.') &&
                        layerId.indexOf('drainage') < 0) {

                        var tokens = layerId.split('.');

                        console.log(
                            'setTextColor:tokens:',
                            tokens
                        );

                        var nodeType = tokens[1];

                        var zoomConfig = mod.getZoom(nodeType);

                        console.log(
                            'setTextColor:zoomConfig:',
                            zoomConfig
                        );

                        var layer = map.getLayer(layerId);

                        if (layer !== undefined) {

                            if (styleString.indexOf('satellite') >= 0) {

                                try {

                                    map.setPaintProperty(
                                        layerId,
                                        'text-color',
                                        '#FFFFFF'
                                    );

                                    map.setPaintProperty(
                                        layerId,
                                        'text-halo-color',
                                        '#212121'
                                    );

                                } catch (e) {

                                    console.warn(e);

                                }

                            } else {

                                try {

                                    map.setPaintProperty(
                                        layerId,
                                        'text-color',
                                        [
                                            'interpolate',
                                            ['exponential', 0.5],
                                            ['zoom'],
                                            zoomConfig.min,
                                            '#616161',
                                            zoomConfig.max,
                                            '#212121'
                                        ]
                                    );

                                    map.setPaintProperty(
                                        layerId,
                                        'text-halo-color',
                                        'rgba(255,255,255,0.75)'
                                    );

                                } catch (e) {

                                    console.warn(e);

                                }

                            }

                        }

                    }

                });

            },
            setVisibility: function(map, idx) {

                if (!angular.isDefined(idx)) return;

                for (var key in idx) {

                    if (idx.hasOwnProperty(key)) {

                        if (map.getLayer(key) !== undefined) {

                            map.setLayoutProperty(
                                key,
                                'visibility',
                                idx[key]
                            );

                        }

                    }

                }

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
            visibilityIndex: function (map) {

                var layers = map.getStyle().layers;

                var idx = {};

                layers.forEach(function (layer) {

                    if (layer.id.startsWith('fd.')) {

                        idx[layer.id] = map.getLayoutProperty(
                            layer.id,
                            'visibility'
                        );

                    }

                });

                return idx;

            }

        };

    });