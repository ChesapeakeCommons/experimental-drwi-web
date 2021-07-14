'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('LayerUtil',
        function(LabelLayer, LayerService, MapUtil,
                 AtlasDataManager, Utility) {

            var programId = undefined;

            var globalLabelColor = 'dark';

            var CUSTOM_LAYERS = {};

            var AUTO_SOURCE = {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            };

            var BASE_SOURCE = JSON.parse(JSON.stringify(AUTO_SOURCE));
            
            BASE_SOURCE.generateId = false;

            var REFERENCE_SOURCES = {
                'empty': AUTO_SOURCE,
                'fd.drainage.polygon': AUTO_SOURCE,
                'fd.practice.centroid': BASE_SOURCE,
                'fd.practice.point': BASE_SOURCE,
                'fd.practice.multipoint': BASE_SOURCE,
                'fd.practice.linestring': BASE_SOURCE,
                'fd.practice.multilinestring': BASE_SOURCE,
                'fd.practice.polygon': BASE_SOURCE,
                'fd.practice.multipolygon': BASE_SOURCE,
                'fd.site.point': BASE_SOURCE,
                'fd.site.multipoint': BASE_SOURCE,
                'fd.site.linestring': BASE_SOURCE,
                'fd.site.multilinestring': BASE_SOURCE,
                'fd.site.polygon': BASE_SOURCE,
                'fd.site.multipolygon': BASE_SOURCE,
                'fd.project.point': BASE_SOURCE,
                'wr.station.point': BASE_SOURCE
            };

            var REFERENCE_LAYERS = [
                //
                // The project and label layers have the highest z-index priority.
                //
                {
                    layerConfig: {
                        id: 'project-index',
                        type: 'symbol',
                        source: 'empty'
                    },
                    beforeId: ''
                },
                {
                    layerConfig: {
                        id: 'label-index',
                        type: 'symbol',
                        source: 'empty'
                    },
                    beforeId: ''
                },
                {
                    layerConfig: {
                        id: 'station-index',
                        type: 'symbol',
                        source: 'empty'
                    },
                    beforeId: ''
                },
                // {
                //     layerConfig: {
                //         id: 'post-index',
                //         type: 'symbol',
                //         source: 'empty'
                //     },
                //     beforeId: ''
                // },
                //
                // The practice layer has the second-highest z-index priority.
                //
                {
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
                // ['post', 'point'],
                ['practice', 'centroid'],
                ['practice', 'linestring'],
                ['practice', 'point'],
                ['practice', 'polygon'],
                ['practice', 'multilinestring'],
                ['practice', 'multipoint'],
                ['practice', 'multipolygon'],
                ['site', 'centroid'],
                ['site', 'linestring'],
                ['site', 'point'],
                ['site', 'polygon'],
                ['site', 'multilinestring'],
                ['site', 'multipoint'],
                ['site', 'multipolygon'],
                ['station', 'point'],
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

                            if (key.startsWith('fd.') ||
                                key.startsWith('wr.')) {

                                map.on('mouseleave', key, function () {
                                    map.getCanvas().style.cursor = '';
                                });

                                map.on('mouseover', key, function () {
                                    map.getCanvas().style.cursor = 'pointer';
                                });

                            }

                        }

                    }

                },
                _index: {},
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
                addCustomLayers: function(features, layers,
                                          padding, map, callback) {

                    var mod = this;

                    console.log(
                        'LayerUtil.addCustomLayers.features:',
                        features);

                    console.log(
                        'LayerUtil.addCustomLayers.layers:',
                        layers);

                    console.log(
                        'LayerUtil.addCustomLayers.padding:',
                        padding);

                    console.log(
                        'LayerUtil.addCustomLayers.map:',
                        map);

                    console.log(
                        'LayerUtil.addCustomLayers.programId:',
                        mod.programId);

                    if (!Array.isArray(features) ||
                        !features.length ||
                        !Number.isInteger(mod.programId)) return;

                    features.forEach(function(feature) {

                        if (feature.layer_spec === undefined) return;

                        console.log(
                            'LayerUtil.addCustomLayers --> feature',
                            feature);

                        console.log(
                            'LayerUtil.addCustomLayers --> feature.layer_spec',
                            feature.layer_spec);

                        console.log(
                            'LayerUtil.addCustomLayers:callback',
                            callback
                        );

                        var filter = false;

                        try {

                            console.log(
                                'LayerUtil.addCustomLayers:primaryNode',
                                AtlasDataManager.primaryNode
                            );

                            var layer = AtlasDataManager.primaryNode.properties.layer.layer_spec;

                            feature.selected = filter = (feature.layer_spec.id === layer.id);

                        } catch (e) {

                            console.log(
                                'LayerUtil.addCustomLayers:',
                                'Unable to parse stored primary node.'
                            );

                        }

                        if (!feature.selected ||
                            typeof feature.selected === 'undefined') {

                            feature.selected = false;

                        } else {

                            feature.layer_spec.layout.visibility = 'visible';

                        }

                        //
                        // Append config item to layer control array.
                        //

                        var data = {
                            id: feature.layer_spec.id,
                            name: feature.name,
                            selected: feature.selected,
                            symbol: feature.symbol
                        };

                        if (!CUSTOM_LAYERS.hasOwnProperty(feature.layer_spec.id)) {

                            CUSTOM_LAYERS[feature.layer_spec.id] = feature;

                            layers.push(data);

                        }

                        if (map.getLayer(feature.layer_spec.id) === undefined) {

                            //
                            // Add custom layers below site features.
                            //

                            map.addLayer(feature.layer_spec, 'site-index');

                            var filterDef = filter ? ['in', 'name', AtlasDataManager.primaryNode.properties.name] : null;

                            console.log(
                                'LayerUtil.addCustomLayers:filterDef',
                                filterDef
                            );

                            map.setFilter(feature.layer_spec.id, filterDef);

                            map.on('click', feature.layer_spec.id, function (e) {

                                console.log(
                                    'map:customLayer.click:layerId',
                                    feature.layer_spec.id
                                );

                                if (AtlasDataManager.getQueryFeatures().length > 1) return;

                                if (e.features.length > 0) {

                                    console.log(
                                        'map:customLayer.click:focusedFeature',
                                        e.features[0]
                                    );

                                    var target = e.features[0];

                                    MapUtil.fitMap(
                                        map,
                                        target,
                                        padding,
                                        true
                                    );

                                    //
                                    // Fetch metadata and metric summary.
                                    //

                                    console.log(
                                        'map:customLayer.click:programId',
                                        mod.programId
                                    );

                                    callback(
                                        'territory',
                                        target.properties.name,
                                        mod.programId
                                    );

                                }

                            });

                        }

                    });

                },
                customLayerIdx: function () {

                    return Utility.values(CUSTOM_LAYERS);

                },
                fetchCustomLayers: function (featureType, featureId,
                                             layers, padding, map, callback) {

                    var mod = this;

                    var data = {
                        sort: 'index'
                    };

                    if (featureType === 'program') {

                        data.program = featureId;

                        mod.setProgramId(featureId);

                    } else {

                        data.origin = featureType + ':' + featureId;

                    }

                    LayerService.collection(
                        data
                    ).$promise.then(function(successResponse) {

                        console.log(
                            'LayerUtil.fetchCustomLayers --> successResponse',
                            successResponse);

                        mod.setProgramId(
                            successResponse.program_id
                        );

                        mod.addCustomLayers(
                            successResponse.features,
                            layers,
                            padding,
                            map,
                            callback);

                    }, function(errorResponse) {

                        console.log(
                            'LayerUtil.fetchCustomLayers --> errorResponse',
                            errorResponse);

                    });

                },
                removeAll: function() {

                    this._index = {};

                },
                removeProjectFilter: function(map) {

                    if (!map) return;

                    var layerIds = [
                        'fd.project.point',
                        'fd.project.point-label'
                    ];

                    layerIds.forEach(function (layerId) {

                        if (map.getLayer(layerId)) {

                            map.setFilter(layerId, null);

                        }

                    });

                },
                setProgramFilter: function(map, programId) {

                    var layerIds = [
                        'fd.project.point',
                        'fd.project.point-label'
                    ];

                    layerIds.forEach(function (layerId) {

                        if (map.getLayer(layerId)) {

                            map.setFilter(
                                layerId,
                                ['==', 'program_id', programId]
                            );

                        }

                    });

                },
                removeLayers: function(map) {

                    var layers = map.getStyle().layers;

                    layers.forEach(function (layer) {

                        if ((layer.id.startsWith('fd.') ||
                            layer.id.startsWith('wr.')) &&
                            map.getLayer(layer.id)) {

                            map.removeLayer(layer.id);

                        }

                    });

                },
                resetCustomIdx: function() {

                    CUSTOM_LAYERS = {};

                },
                resetSources: function (map) {

                    var sourceIds = Object.keys(REFERENCE_SOURCES);

                    // sourceIds = sourceIds.concat(Object.keys(CUSTOM_LAYERS));

                    sourceIds.forEach(function (sourceId) {

                        var source = map.getSource(sourceId);

                        if (source !== undefined) {

                            source.setData({
                                'type': 'FeatureCollection',
                                'features': []
                            });

                        }

                    });

                },
                toggleFocusFilter: function(map, focus) {

                    var filterDef = focus ? null : ['get', 'focus'];

                    var layers = map.getStyle().layers;

                    layers.forEach(function (layer) {

                        if (layer.id.startsWith('fd.') &&
                            layer.id.indexOf('drainage') < 0 &&
                            layer.id.indexOf('highlight') < 0 &&
                            map.getLayer(layer.id)) {

                            map.setFilter(layer.id, filterDef);

                        }

                    });

                },
                setGlobalLabelColor: function (styleString) {

                    this.globalLabelColor = 'dark';

                    if (typeof styleString === 'string' &&
                        (styleString.indexOf('dark') >= 0 ||
                        styleString.indexOf('satellite') >= 0)) {

                        this.globalLabelColor = 'light';

                    }

                },
                setTextColor: function (map) {

                    var mod = this;

                    var layerIds = Object.keys(LabelLayer.index());

                    layerIds.forEach(function (layerId) {

                        if ((layerId.startsWith('fd.') ||
                            layerId.startsWith('wr.')) &&
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

                                if (mod.globalLabelColor === 'light') {

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
                setProgramId: function(programId) {

                    console.log(
                        'LayerUtil.setProgramId:programId:',
                        programId
                    );

                    this.programId = programId;

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

                    var labelLayerId = layerId + '-label';

                    var labelLayer = map.getLayer(labelLayerId);

                    if (visibility === 'visible') {

                        map.setLayoutProperty(layerId, 'visibility', 'none');

                        if (labelLayer !== undefined) {

                            map.setLayoutProperty(labelLayerId, 'visibility', 'none');

                        }

                    } else {

                        map.setLayoutProperty(layerId, 'visibility', 'visible');

                        if (labelLayer !== undefined) {

                            map.setLayoutProperty(labelLayerId, 'visibility', 'visible');

                        }

                    }

                },
                validateQueryFeatures: function (features) {

                    var mod = this;

                    var validFeatures = {};

                    features.forEach(function (feature) {

                        feature.programId = mod.programId;

                        var layerId = feature.layer.id;

                        var featureId = feature.properties.id;

                        var featureType = feature.properties.type;

                        if (featureId === undefined &&
                            featureType === undefined) {

                            featureId = layerId + '-' + feature.id;

                            feature.properties.type = 'territory';

                            if (CUSTOM_LAYERS.hasOwnProperty(layerId)) {

                                feature.properties.id = Utility.machineName(
                                    feature.properties.name,
                                    '_'
                                );

                            }

                        }

                        if (layerId.startsWith('fd.') ||
                            layerId.startsWith('wr.') ||
                            CUSTOM_LAYERS.hasOwnProperty(layerId)) {

                            validFeatures[featureId] = feature;

                        }

                    });

                    return Utility.values(validFeatures);

                },
                visibilityIndex: function (map) {

                    var layers = map.getStyle().layers;

                    var idx = {};

                    layers.forEach(function (layer) {

                        if (layer.id.startsWith('fd.') ||
                            layer.id.startsWith('wr.')) {

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