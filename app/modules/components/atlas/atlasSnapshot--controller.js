'use strict';

/**
 * @ngdoc function
 * @name FieldDoc.controller:MapInterfaceviewController
 * @description
 * # MapInterfaceviewController
 * Controller of the FieldDoc
 */
angular.module('FieldDoc')
    .controller('AtlasSnapshotController',
        function(environment, Account, Notifications, $rootScope, $http, MapInterface, $routeParams,
                 $scope, $location, mapbox, Site, user, $window, $timeout,
                 Utility, $interval, AtlasDataManager, AtlasLayoutUtil, ipCookie, ZoomUtil,
                 Practice, Project, Program, LayerUtil, SourceUtil, PopupUtil, MapUtil, LabelLayer,
                 DataLayer, HighlightLayer, WaterReporterInterface, GeographyService, User) {

            var self = this;

            self.queryFeatures = [];

            self.showAllFeatures = false;

            self.urlComponents = LayerUtil.getUrlComponents();

            var DRAINAGE_ID = 'fd.drainage.polygon';

            $rootScope.viewState = {
                'atlas': true
            };

            $rootScope.toolbarState = {
                'dashboard': true
            };

            self.clsMap = {
                map: MapInterface,
                practice: Practice,
                program: Program,
                project: Project,
                site: Site,
                territory: GeographyService
            };

            self.layers = [
                {
                    id: 'fd.project.point',
                    name: 'Projects',
                    selected: true
                },
                {
                    id: 'fd.site.*',
                    name: 'Sites',
                    selected: true
                },
                // {
                //     id: 'fd.site.line',
                //     name: 'Site lines',
                //     selected: true
                // },
                // {
                //     id: 'fd.site.point',
                //     name: 'Site points',
                //     selected: true
                // },
                // {
                //     id: 'fd.practice.polygon',
                //     name: 'Practice polygons',
                //     selected: true
                // },
                // {
                //     id: 'fd.practice.line',
                //     name: 'Practice lines',
                //     selected: true
                // },
                {
                    id: 'fd.practice.*',
                    name: 'Practices',
                    selected: true
                },
                {
                    id: 'wr.station.point',
                    name: 'Water Reporter stations',
                    selected: false
                },
                // {
                //     id: 'wr.post.point',
                //     name: 'Water Reporter posts',
                //     selected: true
                // },
                {
                    id: DRAINAGE_ID,
                    name: 'Drainage',
                    selected: false
                }
            ];

            $rootScope.page = {};

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            self.status = {
                loading: true
            };

            self.padding = {
                top: 100,
                right: 100,
                bottom: 100,
                left: 100
            };

            self.presentChildModal = function(featureType) {

                if (featureType !== 'practice' &&
                    featureType !== 'site') return;

                self.showChildModal = true;

                self.childType = featureType;

            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 0);

            };

            self.toggleLayerConstraint = function () {

                console.log(
                    'toggleLayerConstraint:showAllFeatures',
                    self.showAllFeatures
                );

                LayerUtil.toggleFocusFilter(
                    self.map,
                    self.showAllFeatures);

            };

            self.refreshFeatureLayers = function () {

                self.urlComponents.forEach(function (component) {

                    $timeout(function () {

                        self.updateNodeLayer(component[0], component[1]);

                    }, 500);

                });

            };

            self.updateNodeLayer = function (nodeType, geometryType,
                                             programId) {

                if (self.map === undefined) return;

                var zoom = self.map.getZoom();

                if (zoom < 14 &&
                    nodeType === 'practice' &&
                    geometryType !== 'centroid') return;

                if (zoom < 10 &&
                    nodeType === 'site' &&
                    geometryType !== 'centroid') return;

                var boundsArray = self.map.getBounds().toArray();

                boundsArray = [
                    boundsArray[0].join(','),
                    boundsArray[1].join(',')
                ].join(',');

                console.log(
                    'self.updateNodeLayer:boundsArray:',
                    boundsArray
                );

                console.log(
                    'self.updateNodeLayer:urlData:',
                    self.urlData
                );

                var params = {
                    bbox: boundsArray,
                    // exclude: exclude,
                    featureType: nodeType,
                    // focus: focus,
                    geometryType: geometryType,
                    zoom: zoom
                };

                try {

                    var nodeString = self.urlData.node;

                    var nodeTokens = nodeString.split('.');

                    params.focus = nodeTokens.join(':');

                } catch (e) {

                    console.warn(
                        'Primary node is undefined.'
                    )

                }

                if (angular.isDefined(self.urlData.filters) &&
                    typeof self.urlData.filters === 'string' &&
                    self.urlData.filters.length) {

                    params.filters = self.urlData.filters;

                    params.t = Date.now();

                    // delete params.focus;

                }

                if (programId) {

                    params.program = programId;

                }

                if (nodeType === 'post' ||
                    nodeType === 'station') {

                    params.access_token = self.user.wr_token;

                    WaterReporterInterface.featureLayer(
                        params
                    ).$promise.then(function (successResponse) {

                        console.log(
                            'updateNodeLayer:successResponse:',
                            successResponse
                        );

                        // self.nodeLayer = successResponse;

                        successResponse.features.forEach(function (feature) {

                            feature.id = feature.properties.id;

                            AtlasDataManager.trackFeature(
                                nodeType, geometryType, feature);

                        });

                        var sourceId = 'wr.' + nodeType + '.' + geometryType;

                        var source = self.map.getSource(sourceId);

                        var fetchedFeatures = AtlasDataManager.getFetched(
                            nodeType, geometryType);

                        if (source !== undefined) {

                            source.setData({
                                'type': 'FeatureCollection',
                                'features': fetchedFeatures
                            });

                        }

                    }, function (errorResponse) {

                        console.log('Unable to load node layer data.');

                        self.showElements();

                    });

                } else {

                    MapInterface.featureLayer(
                        params
                    ).$promise.then(function (successResponse) {

                        console.log(
                            'updateNodeLayer:successResponse:',
                            successResponse
                        );

                        self.nodeLayer = successResponse;

                        successResponse.features.forEach(function (feature) {

                            AtlasDataManager.trackFeature(
                                nodeType, geometryType, feature);

                        });

                        var sourceId = 'fd.' + nodeType + '.' + geometryType;

                        var source = self.map.getSource(sourceId);

                        var fetchedFeatures = AtlasDataManager.getFetched(
                            nodeType, geometryType);

                        if (source !== undefined) {

                            source.setData({
                                'type': successResponse.type,
                                'features': fetchedFeatures
                            });

                        }

                    }, function (errorResponse) {

                        console.log('Unable to load node layer data.');

                        self.showElements();

                    });

                }

            };

            self.fetchPrimaryNode = function (featureType, featureId,
                                              programId, callback) {

                console.log(
                    'self.fetchPrimaryNode:featureType',
                    featureType
                );

                console.log(
                    'self.fetchPrimaryNode:featureId',
                    featureId
                );

                console.log(
                    'self.fetchPrimaryNode:programId',
                    programId
                );

                //
                // Reset stored array of queried features.
                //

                self.queryFeatures = undefined;

                AtlasDataManager.setQueryFeatures([]);

                var cls = self.clsMap[featureType];

                if (cls === undefined) return;

                var params = {
                    id: featureId,
                    src: 'atlas'
                };

                if (featureType === 'territory') {

                    params.exclude = [
                        'creator',
                        'geometry',
                        'intersections',
                        'practices',
                        'simple_geometry',
                        'targets',
                        'tasks'
                    ].join(',');

                    if (!Number.isInteger(parseInt(featureId, 10))) {

                        params.id = Utility.machineName(
                            featureId,
                            '_'
                        );

                    }

                }

                if (programId) {

                    params.program = programId;

                }

                cls.getSingle(
                    params
                ).$promise.then(function(successResponse) {

                    delete successResponse.$promise;

                    delete successResponse.$resolved;

                    self.summary = successResponse;

                    self.permissions = successResponse.permissions;

                    self.primaryNode = successResponse;

                    if (!self.primaryNode.hasOwnProperty('properties')) {

                        self.primaryNode.properties = self.primaryNode;

                    }

                    self.featureType = self.primaryNode.properties.type;

                    self.featureClass = self.clsMap[self.featureType];

                    if (!self.primaryNode.hasOwnProperty('type')) {

                        self.primaryNode.type = 'Feature';

                    }

                    if ((featureType === 'practice' ||
                        featureType === 'site')) {

                        self.delineateWatershed(self.primaryNode);

                    }

                    AtlasDataManager.setPrimaryNode(self.primaryNode);

                    self.showElements();

                    MapUtil.fitMap(
                        self.map,
                        self.primaryNode,
                        self.padding,
                        false
                    );

                    if (featureType === 'territory') {

                        self.processMetrics(
                            successResponse.metric_progress
                        );

                    } else {

                        self.loadMetrics(self.primaryNode.properties.id);

                    }

                    //
                    // Set banner image in side panel.
                    //

                    AtlasLayoutUtil.clearBannerImage();

                    if (self.primaryNode.properties.picture) {

                        AtlasLayoutUtil.setBannerImage(
                            self.primaryNode
                        );

                    }

                    if (callback) callback();

                }, function(errorResponse) {

                    console.log('Unable to load feature data.');

                    self.showElements();

                    if (callback) callback();

                });

            };

            self.fetchStation = function (target) {

                //
                // Reset stored array of queried features.
                //

                self.queryFeatures = undefined;

                AtlasDataManager.setQueryFeatures([]);

                self.showLayerOptions = false;

                self.station = target;

                self.toggleSidebar(false, true);

                $timeout(function () {

                    var frame = document.getElementsByTagName('iframe')[0];

                    console.log(
                        'map.click:frame:',
                        frame
                    );

                    frame.setAttribute('height', $window.innerHeight);
                    frame.setAttribute('width', $window.innerWidth);

                    frame.style.height = $window.innerHeight;
                    frame.style.width = $window.innerWidth;

                    frame.style.backgroundColor = 'transparent';
                    frame.frameBorder = '0';
                    frame.allowTransparency = 'true';

                    frame.src = [
                        'https://dev.api.waterreporter.org/v2/embed/station/',
                        self.station.properties.id
                    ].join('');

                }, 10);

            };

            self.fetchMap = function () {

                self.primaryNode = undefined;

                MapInterface.get({
                    id: $routeParams.id
                }).$promise.then(function(successResponse) {

                    self.summary = successResponse;

                    self.mapSummary = successResponse;

                    self.featureClass = MapInterface;

                    self.loadMetrics($routeParams.id);

                    MapUtil.fitMap(
                        self.map,
                        self.mapSummary,
                        self.padding,
                        false
                    );

                    // if (featureType === 'territory') {
                    //
                    //     self.processMetrics(
                    //         successResponse.metric_progress
                    //     );
                    //
                    // } else {
                    //
                    //     self.loadMetrics();
                    //
                    // }

                    LayerUtil.setProgramId(0);

                    LayerUtil.addCustomLayers(
                        successResponse.layers,
                        self.layers,
                        self.padding,
                        self.map,
                        self.fetchPrimaryNode);

                    self.updateUrlParams(self.urlData.filters);

                    // LayerUtil.fetchCustomLayers(
                    //     null,
                    //     null,
                    //     self.layers,
                    //     self.padding,
                    //     self.map,
                    //     self.fetchPrimaryNode);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.positionSidebar = function(elem, forceClose) {

                forceClose = (typeof forceClose === 'boolean') ? forceClose : false;

                var transform = 'translateX(' + 0 + 'px)';

                if (self.collapsed || forceClose) {

                    transform = 'translateX(-' + elem.offsetWidth + 'px)';

                }

                elem.style.transform = transform;

            };

            self.toggleSidebar = function(fitMap, forceClose) {

                fitMap = (typeof fitMap === 'boolean') ? fitMap : true;

                forceClose = (typeof forceClose === 'boolean') ? forceClose : false;

                self.collapsed = !self.collapsed;

                console.log(
                    'self.toggleSidebar:collapsed',
                    self.collapsed
                );

                var elem = document.querySelector('.sidebar');

                self.padding.left = self.collapsed ? 100 : elem.offsetWidth + 100;

                console.log(
                    'self.toggleSidebar:padding:',
                    self.padding
                );

                if (fitMap) {

                    MapUtil.fitMap(
                        self.map,
                        self.primaryNode,
                        self.padding,
                        true
                    );

                }

                self.positionSidebar(elem, forceClose);

            };

            self.positionMenu = function(elem) {

                var transform = 'translateX(' + 0 + 'px)';

                if (self.menuCollapsed) {

                    transform = 'translateX(' + elem.offsetWidth + 'px)';

                }

                console.log(
                    'self.positionMenu:transform',
                    transform
                );

                elem.style.transform = transform;

            };

            self.toggleMenu = function() {

                self.menuCollapsed = !self.menuCollapsed;

                console.log(
                    'self.toggleMenu:menuCollapsed',
                    self.menuCollapsed
                );

                var elem = document.querySelector('#sidebar');

                console.log(
                    'self.toggleMenu:elem',
                    elem
                );

                self.positionMenu(elem);

            };

            self.delineateWatershed = function(feature) {

                $http({
                    method: 'POST',
                    url: 'http://watersheds.cci.drexel.edu/api/watershedboundary/',
                    data: feature.geometry,
                    headers: {
                        'Authorization-Bypass': true
                    }
                }).then(function successCallback(successResponse) {

                    console.log(
                        'delineateWatershed:successResponse:',
                        successResponse);

                    var drainageFeature = {
                        "type": "Feature",
                        "geometry": successResponse.data,
                        "properties": {
                            "id": DRAINAGE_ID
                        }
                    };

                    AtlasDataManager.trackFeature(
                        'drainage',
                        'polygon',
                        drainageFeature
                    );

                    // set drainage source data

                    var source = self.map.getSource(DRAINAGE_ID);

                    if (source !== undefined) {

                        source.setData({
                            type: 'FeatureCollection',
                            'features': [
                                drainageFeature
                            ]
                        });

                    }

                }, function errorCallback(errorResponse) {

                    console.log(
                        'delineateWatershed:errorResponse:',
                        errorResponse
                    );

                });

            };

            self.toggleLayer = function(layerId) {

                console.log(
                    'self.toggleLayer:layerId:',
                    layerId
                );

                self.preventFullCycle = true;

                if (layerId.endsWith('*')) {

                    var components = layerId.split('.');

                    var featureType = components[1];

                    var layerTypes = [
                        'line',
                        'point',
                        'polygon'
                    ];

                    layerTypes.forEach(function (layerType) {

                        var layerRef = [
                            'fd',
                            featureType,
                            layerType
                        ].join('.');

                        LayerUtil.toggleLayer(layerRef, self.map);

                    });

                } else {

                    LayerUtil.toggleLayer(layerId, self.map);

                }

            };

            self.switchMapStyle = function(style, index) {

                console.log('self.switchMapStyle --> styleId', style);

                console.log('self.switchMapStyle --> index', index);

                console.log(
                    'self.switchMapStyle:currentStyle',
                    self.map.getStyle()
                );

                self.visibilityIndex = LayerUtil.visibilityIndex(self.map);

                console.log(
                    'switchMapStyle:visibilityIndex:',
                    self.visibilityIndex);

                self.currentStyleString = MapUtil.getStyleString(self.map);

                console.log(
                    'switchMapStyle:currentStyleString:',
                    self.currentStyleString);

                self.mapOptions.style = self.mapStyles[index].url;

                self.map.setStyle(
                    self.mapStyles[index].url,
                    {
                        diff: false
                    }
                );

            };

            self.getMapOptions = function() {

                self.standardStyles = mapbox.standardStyles;

                self.mapStyles = mapbox.baseStyles;

                console.log(
                    'self.createMap --> mapStyles',
                    self.mapStyles);

                self.activeStyle = 0;

                var styleString = self.urlData.style;

                console.log(
                    'self.getMapOptions:styleString:',
                    styleString
                );

                self.mapStyles.forEach(function (style, index) {

                    if (style.name.toLowerCase() === styleString) {

                        self.activeStyle = index;

                    }

                });

                mapboxgl.accessToken = mapbox.accessToken;

                console.log(
                    'self.createMap --> accessToken',
                    mapboxgl.accessToken);

                self.mapOptions = JSON.parse(JSON.stringify(mapbox.defaultOptions));

                self.mapOptions.container = 'map';

                if (typeof styleString === 'string') {

                    self.mapOptions.style = styleString;

                } else {

                    self.mapOptions.style = self.mapStyles[self.activeStyle].url;

                }

                self.mapOptions.transformRequest = function(url, resourceType) {

                    var sessionCookie = ipCookie('FIELDDOC_SESSION');

                    if (resourceType === 'Source' &&
                        url.startsWith(environment.apiUrl)) {

                        return {
                            url: url,
                            headers: {
                                'Authorization': 'Bearer ' + sessionCookie
                            },
                            credentials: 'include'  // Include cookies for cross-origin requests.
                        };

                    }

                };

                return self.mapOptions;

            };

            self.createMap = function(options) {

                if (!options) return;

                self.map = new mapboxgl.Map(options);

                self.map.on('click', function (e) {

                    if (self.station) {

                        self.station = undefined;

                        self.toggleSidebar(false);

                    }

                    var features = LayerUtil.validateQueryFeatures(
                        self.map.queryRenderedFeatures(e.point)
                    );

                    console.log(
                        'map.click:features:',
                        features
                    );

                    if (!features.length) return;

                    if (features.length > 1) {

                        console.log(
                            'map.click:features.length > 1:',
                            features
                        );

                        $scope.$apply(function () {

                            self.queryFeatures = features;

                            AtlasDataManager.setQueryFeatures(
                                features
                            );

                        });

                    } else {

                        var target = features[0];

                        console.log(
                            'map.click:target:',
                            target
                        );

                        // HighlightLayer.setHighlight(
                        //     self.map,
                        //     target
                        // );

                        if (target.layer.id.indexOf('station') >= 0) {

                            console.log(
                                'map.click:station:',
                                target
                            );

                            self.fetchStation(target);

                        } else {

                            var primaryId = undefined;

                            if (angular.isDefined(self.primaryNode)) {

                                primaryId = self.primaryNode.properties.id;

                            }

                            if (target.properties.id !== primaryId) {

                                self.urlData.node = [
                                    target.properties.type,
                                    '.',
                                    target.properties.id
                                ].join('');

                                self.fetchPrimaryNode(
                                    target.properties.type,
                                    target.properties.id
                                );

                            }

                        }

                    }

                });

                self.map.on('styledata', function() {

                    console.log(
                        'styledata:style:',
                        self.map.getStyle()
                    );

                    console.log(
                        'styledata:currentStyleString:',
                        self.currentStyleString
                    );

                    //
                    // Reset flag set ahead of single layer visibility change.
                    //

                    if (self.preventFullCycle) {

                        self.preventFullCycle = false;

                        return;

                    }

                    var styleString = MapUtil.getStyleString(self.map);

                    console.log(
                        'styledata:styleString:',
                        styleString
                    );

                    //
                    // Set text color for label layers.
                    //

                    LayerUtil.setTextColor(self.map, styleString);

                    if (!angular.isDefined(self.currentStyleString)) return;

                    //
                    // Restore reference sources and layers.
                    //

                    self.populateMap();

                    //
                    // Restore feature source data.
                    //

                    SourceUtil.restoreSources(self.map);

                });

                self.map.on('moveend', function() {

                    self.refreshFeatureLayers();

                });

                self.map.on('idle', function() {

                    //

                });

                self.map.on('load', function() {

                    console.log("Loading Map");

                    var scale = new mapboxgl.ScaleControl({
                        maxWidth: 80,
                        unit: 'imperial'
                    });

                    self.map.addControl(scale, 'bottom-right');

                    var nav = new mapboxgl.NavigationControl();

                    self.map.addControl(nav, 'bottom-right');

                    var geocoder = new MapboxGeocoder({
                        accessToken: mapboxgl.accessToken,
                        clearOnBlur: true,
                        countries: 'us',
                        mapboxgl: mapboxgl,
                        marker: false,
                        minLength: 3,
                        placeholder: 'Find addresses and places'
                    });

                    document.querySelector('.geocoder').appendChild(geocoder.onAdd(self.map));

                    if (self.layers && self.layers.length) {

                        // self.addLayers(self.layers);

                    } else {

                        // self.fetchLayers();

                    }

                    self.padding.left = AtlasLayoutUtil.getLeftMapOffset();

                    var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);

                    var bounds = turf.bbox(line);

                    self.map.fitBounds(bounds, {
                        padding: self.padding
                    });

                    //
                    // Add reference sources and layers.
                    //

                    LayerUtil.resetCustomIdx();

                    self.populateMap();

                    LayerUtil.resetSources(self.map);

                    if (angular.isDefined(self.storedFilters)) {

                        LayerUtil.removeProjectFilter(self.map);

                    }

                    // LayerUtil.fetchCustomLayers(
                    //     null,
                    //     null,
                    //     self.layers,
                    //     self.padding,
                    //     self.map,
                    //     self.fetchPrimaryNode);

                    // self.updateUrlParams();

                    self.fetchMap();

                    self.showElements();

                });

            };

            self.setLayerVisibility = function () {

                var layerRefs = [];

                self.layers.forEach(function (layer) {

                    var visibility = layer.selected ? 'visible' : 'none';

                    if (layer.id.endsWith('*')) {

                        var components = layer.id.split('.');

                        var featureType = components[1];

                        var layerTypes = [
                            'line',
                            'point',
                            'polygon'
                        ];

                        layerTypes.forEach(function (layerType) {

                            var layerRef = [
                                'fd',
                                featureType,
                                layerType
                            ].join('.');

                            layerRefs.push({
                                id: layerRef,
                                visibility: visibility
                            });

                        });

                    } else {

                        layerRefs.push({
                            id: layer.id,
                            visibility: visibility
                        });

                    }

                });

                layerRefs.forEach(function (layerRef) {

                    var labelLayerId = layerRef.id + '-label';

                    var labelLayer = self.map.getLayer(labelLayerId);

                    if (labelLayer !== undefined) {

                        self.map.setLayoutProperty(
                            labelLayerId,
                            'visibility',
                            layerRef.visibility
                        );

                    }

                    self.map.setLayoutProperty(
                        layerRef.id,
                        'visibility',
                        layerRef.visibility
                    );

                });

            };

            self.populateMap = function () {

                LayerUtil.addReferenceSources(self.map);

                LayerUtil.addReferenceLayers(self.map);

                LabelLayer.addLabelLayers(self.map);

                DataLayer.addDataLayers(self.map);

                // HighlightLayer.addHighlightLayers(self.map);

                LayerUtil.addCustomLayers(
                    LayerUtil.customLayerIdx(),
                    self.layers,
                    self.padding,
                    self.map,
                    self.fetchPrimaryNode
                );

                LayerUtil.setVisibility(self.map, self.visibilityIndex);

                self.setLayerVisibility();

                LayerUtil.toggleFocusFilter(
                    self.map,
                    self.showAllFeatures
                );

            };

            self.stageMap = function(createMap) {

                AtlasLayoutUtil.sizeSidebar();

                if (createMap) {

                    if (!self.mapOptions) {

                        self.mapOptions = self.getMapOptions();

                    }

                    self.createMap(self.mapOptions);

                }

            };

            self.processMetrics = function (data) {

                Utility.processMetrics(data.features);

                if (data.hasOwnProperty('timestamp')) {

                    if (data.timestamp.toString().length === 10) {

                        data.timestamp = data.timestamp * 1000;

                    }

                    self.progressTimestamp = data.timestamp;

                }

                self.metrics = data.features;

                var nodeType;

                if (angular.isDefined(self.primaryNode)) {

                    nodeType = self.primaryNode.properties.type;

                }

                self.metrics.forEach(function(metric) {

                    Utility.calcProgress(
                        metric,
                        true,
                        nodeType
                    );

                });

                self.metrics = Utility.groupByModel(data.features);

                // self.metrics = Utility.groupByModel(data.features);

                console.log('self.metrics', self.metrics);

                $timeout(function () {

                    AtlasLayoutUtil.resizeMainContent();

                }, 50);

            }

            self.loadMetrics = function(featureId) {

                self.featureClass.progress({
                    id: featureId
                }).$promise.then(function(successResponse) {

                    self.processMetrics(successResponse);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.updateUrlParams = function (filterString) {

                if (!angular.isDefined(filterString) ||
                    typeof filterString !== 'string') {

                    filterString = self.urlData.filters;

                }

                console.log(
                    'self.updateUrlParams:filterString',
                    filterString
                );

                var urlParams = AtlasDataManager.createURLData(
                    self.primaryNode,
                    false,
                    {
                        filterString: filterString,
                        style: self.urlData.style,
                        zoom: self.map.getZoom()
                    }
                );

                console.log(
                    'self.updateUrlParams:urlParams',
                    urlParams
                );

                $location.search(urlParams);

                self.urlData = AtlasDataManager.getData(urlParams);

                console.log(
                    'self.updateUrlParams:urlData',
                    self.urlData
                );

            };

            self.extractUrlParams = function (params) {

                console.log(
                    'extractUrlParams:params:',
                    params
                );

                self.origin = AtlasDataManager.getOrigin(params);

                console.log(
                    'extractUrlParams:origin:',
                    self.origin
                );

                var dataObj = AtlasDataManager.getData(params);

                console.log(
                    'extractUrlParams:dataObj:',
                    dataObj
                );

                self.urlData = dataObj;

                self.storedFilters = AtlasDataManager.getUrlFilters(
                    self.urlData
                );

                console.log(
                    'extractUrlParams:storedFilters:',
                    self.storedFilters
                );

                if (!angular.isDefined(self.map)) {

                    self.stageMap(true);

                }

            };

            // self.syncActiveFilters = function () {
            //
            //     if (!angular.isDefined(self.storedFilters)) return;
            //
            //     for (var key in self.filterOptions) {
            //
            //         if (self.filterOptions.hasOwnProperty(key)) {
            //
            //             var options = self.filterOptions[key];
            //
            //             console.log(
            //                 'self.syncActiveFilters:options',
            //                 options
            //             );
            //
            //             if (options.length) {
            //
            //                 var storedIds = self.storedFilters[key];
            //
            //                 console.log(
            //                     'self.syncActiveFilters:storedIds',
            //                     storedIds
            //                 );
            //
            //                 if (Array.isArray(storedIds)) {
            //
            //                     options.forEach(function (feature) {
            //
            //                         if (storedIds.indexOf(feature.id) >= 0) {
            //
            //                             feature.selected = true;
            //
            //                             self.bookmarkReady = true;
            //
            //                             self.activeFilters[key].push(feature);
            //
            //                         }
            //
            //                     });
            //
            //                 }
            //
            //             }
            //
            //         }
            //
            //     }
            //
            // };

            // self.resetActiveFilters = function () {
            //
            //     self.bookmarkReady = false;
            //
            //     self.activeFilters = {};
            //
            //     var categories = Object.keys(self.filterOptions);
            //
            //     categories.forEach(function (category) {
            //
            //         self.activeFilters[category] = [];
            //
            //     });
            //
            // };

            // self.loadFilterOptions = function () {
            //
            //     User.atlasFilters().$promise.then(function(successResponse) {
            //
            //         self.filterOptions = successResponse;
            //
            //         self.resetActiveFilters();
            //
            //         self.syncActiveFilters();
            //
            //     });
            //
            // };

            window.addEventListener('popstate', function (event) {
                // The popstate event is fired each time when the current history entry changes.

                var params = $location.search();

                self.extractUrlParams(params);

                var nodeString = self.urlData.node;

                var nodeTokens = nodeString.split('.');

                self.fetchPrimaryNode(
                    nodeTokens[0],
                    +nodeTokens[1]
                );

            }, false);

            $scope.$on('$destroy', function () {

                console.log(
                    'AtlasController:destroy...'
                );

                //
                // Perform a hard reset of all map data.
                //

                AtlasDataManager.resetTrackedFeatures();

                // LayerUtil.resetCustomIdx();
                //
                // LayerUtil.removeLayers(self.map);
                //
                // LayerUtil.resetSources(self.map);

                self.map.remove();

            });

            //
            // Verify Account information for proper UI element display
            //

            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.user = $rootScope.user;

                    $rootScope.page.title = 'Atlas';

                    //
                    // Assign map to a scoped variable
                    //

                    var params = $location.search();

                    self.extractUrlParams(params, true);

                    // self.loadFilterOptions();

                    // self.fetchMap();

                });

            } else {

                $location.path('/logout');

            }

        });