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
            },
            // {
            //     sourceConfig: EMPTY_SOURCE,
            //     layerConfig: {
            //         id: DRAINAGE_ID,
            //         source: DRAINAGE_ID,
            //         type: 'fill',
            //         paint: {
            //             'fill-color': '#00C8FF',
            //             'fill-opacity': 0.4,
            //             'fill-outline-color': '#424242'
            //         },
            //         layout: {
            //             visibility: 'none'
            //         }
            //     },
            //     beforeId: 'site-index'
            // }
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

                // REFERENCE_SOURCES.forEach(function (source) {
                //
                //     map.addSource(source.sourceId, source.sourceConfig);
                //
                // });

            },
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

            },
            updateSource: function (sourceId, data) {

                REFERENCE_SOURCES[sourceId].data = data;

            }

        };

    });