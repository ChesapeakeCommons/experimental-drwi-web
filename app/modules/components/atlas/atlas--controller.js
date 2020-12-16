'use strict';

/**
 * @ngdoc function
 * @name FieldDoc.controller:MapInterfaceviewController
 * @description
 * # MapInterfaceviewController
 * Controller of the FieldDoc
 */
angular.module('FieldDoc')
    .controller('AtlasController',
        function(environment, Account, Notifications, $rootScope, $http, MapInterface, $routeParams,
                 $scope, $location, mapbox, Site, user, $window, $timeout,
                 Utility, $interval, AtlasDataManager, AtlasLayoutUtil, ipCookie,
                 Practice, Project, LayerUtil, SourceUtil, PopupUtil, MapUtil) {

            var self = this;

            self.urlComponents = LayerUtil.getUrlComponents();

            var DRAINAGE_ID = 'fd.delineation.1';

            $rootScope.viewState = {
                'map': true
            };

            $rootScope.toolbarState = {
                'dashboard': true
            };

            self.clsMap = {
                practice: Practice,
                site: Site,
                project: Project
            };

            self.layers = [{
                id: DRAINAGE_ID,
                name: 'Drainage',
                selected: false
            }];

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

            self.updateNodeLayer = function (nodeType, geometryType) {

                var zoom = self.map.getZoom();

                if (zoom < 14 && nodeType === 'practice') return;

                if (zoom < 10 && nodeType === 'site') return;

                var boundsArray = self.map.getBounds().toArray();

                boundsArray = [
                    boundsArray[0].join(','),
                    boundsArray[1].join(',')
                ].join(',');

                console.log(
                    'boundsArray:',
                    boundsArray
                );

                var fetchedFeatures = AtlasDataManager.getFetchedKeys(
                    nodeType, geometryType);

                var exclude = fetchedFeatures.join(',');

                console.log(
                    'exclude:',
                    exclude
                );

                var params = {
                    bbox: boundsArray,
                    exclude: exclude,
                    featureType: nodeType,
                    geometryType: geometryType,
                    zoom: zoom
                };

                MapInterface.featureLayer(
                    params
                ).$promise.then(function(successResponse) {

                    console.log(
                        'updateNodeLayer:successResponse:',
                        successResponse
                    );

                    self.nodeLayer = successResponse;

                    var sourceId = 'fd.' + nodeType + '.' + geometryType;

                    var source = self.map.getSource(sourceId);

                    var fetchedFeatures = AtlasDataManager.getFetched(
                        nodeType, geometryType);

                    var updatedFeatures = successResponse.features.concat(
                        fetchedFeatures
                    );

                    successResponse.features.forEach(function (feature) {

                        AtlasDataManager.trackFeature(
                            nodeType, geometryType, feature);

                    });

                    if (source !== undefined) {

                        source.setData({
                            'type': successResponse.type,
                            'features': updatedFeatures
                        });

                    }

                }, function(errorResponse) {

                    console.log('Unable to load node layer data.');

                    self.showElements();

                });

            };

            self.fetchPrimaryNode = function (featureType, featureId) {

                var cls = self.clsMap[featureType];

                var params = {
                    id: featureId
                };

                cls.getSingle(
                    params
                ).$promise.then(function(successResponse) {

                    delete successResponse.$promise;

                    delete successResponse.$resolved;

                    self.permissions = successResponse.permissions;

                    self.primaryNode = successResponse;

                    if (!self.primaryNode.hasOwnProperty('type')) {

                        self.primaryNode.type = 'Feature';

                    }

                    if (!self.primaryNode.hasOwnProperty('properties')) {

                        self.primaryNode.properties = self.primaryNode;

                    }

                    self.featureType = self.primaryNode.type;

                    self.featureClass = self.clsMap[self.featureType];

                    if ((featureType === 'practice' ||
                        featureType === 'site')) {

                        self.delineateWatershed(self.primaryNode);

                    }

                    var urlData = AtlasDataManager.createURLData(
                        self.primaryNode,
                        false
                    );

                    $location.search(urlData);

                    self.showElements();

                    MapUtil.fitMap(
                        self.map,
                        self.primaryNode,
                        self.padding,
                        false
                    );

                    self.loadMetrics();

                    //
                    // Set banner image in side panel.
                    //

                    AtlasLayoutUtil.clearBannerImage();

                    if (self.primaryNode.properties.picture) {

                        AtlasLayoutUtil.setBannerImage(
                            self.primaryNode
                        );

                    }

                }, function(errorResponse) {

                    console.log('Unable to load map data.');

                    self.showElements();

                });

            };

            self.positionSidebar = function(elem) {

                var transform = 'translateX(' + 0 + 'px)';

                if (self.collapsed) {

                    transform = 'translateX(-' + elem.offsetWidth + 'px)';

                }

                elem.style.transform = transform;

            };

            self.toggleSidebar = function() {

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

                MapUtil.fitMap(
                    self.map,
                    self.primaryNode,
                    self.padding,
                    true
                );

                self.positionSidebar(elem);

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

            self.toggleDrainage = function() {

                self.toggleLayer(DRAINAGE_ID);

            };

            self.toggleLayer = function(layerId) {

                console.log(
                    'self.toggleLayer:layerId:',
                    layerId
                );

                LayerUtil.toggleLayer(layerId, self.map);

            };

            self.switchMapStyle = function(styleId, index) {

                console.log('self.switchMapStyle --> styleId', styleId);

                console.log('self.switchMapStyle --> index', index);

                console.log(
                    'self.switchMapStyle:currentStyle',
                    self.map.getStyle()
                );

                self.mapOptions.style = self.mapStyles[index].url;

                self.map.setStyle(self.mapStyles[index].url);

            };

            self.getMapOptions = function() {

                self.mapStyles = mapbox.baseStyles;

                console.log(
                    'self.createMap --> mapStyles',
                    self.mapStyles);

                self.activeStyle = 0;

                mapboxgl.accessToken = mapbox.accessToken;

                console.log(
                    'self.createMap --> accessToken',
                    mapboxgl.accessToken);

                self.mapOptions = JSON.parse(JSON.stringify(mapbox.defaultOptions));

                self.mapOptions.container = 'map';

                self.mapOptions.style = self.mapStyles[0].url;

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

            self.addReferenceLayers = function () {

                //
                // Add source and layer for site and practice
                // watershed delineations (drainages).
                //

                var drainageSourceConfig = {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                };

                SourceUtil.trackSource(DRAINAGE_ID, drainageSourceConfig);

                MapUtil.addSource(self.map, DRAINAGE_ID, drainageSourceConfig);

                var paintSpec = LayerUtil.getPaint('delineation', 'fill');

                var drainageLayerSpec = {
                    id: DRAINAGE_ID,
                    source: DRAINAGE_ID,
                    type: 'fill',
                    paint: paintSpec
                };

                drainageLayerSpec.layout = {
                    visibility: 'none'
                };

                LayerUtil.trackLayer(drainageLayerSpec);

                //
                // Add index layers to facilitate order control.
                //

                self.map.addSource('empty', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });

                //
                // The project and label layers have the highest z-index priority.
                //

                self.map.addLayer({
                    id: 'project-index',
                    type: 'symbol',
                    source: 'empty'
                });

                self.map.addLayer({
                    id: 'label-index',
                    type: 'symbol',
                    source: 'empty'
                });

                //
                // The practice layer has the second-highest z-index priority.
                //

                self.map.addLayer({
                    id: 'practice-index',
                    type: 'symbol',
                    source: 'empty'
                }, 'project-index'); // Place this layer below projects.

                //
                // The site layer has the second-lowest z-index priority.
                //

                self.map.addLayer({
                    id: 'site-index',
                    type: 'symbol',
                    source: 'empty'
                }, 'practice-index'); // Place this layer below projects and practices.

                //
                // The drainage layer has the lowest z-index priority.
                //

                self.map.addLayer(drainageLayerSpec, 'site-index');

            };

            self.addGeoJSONSources = function () {

                self.urlComponents.forEach(function (component) {

                    console.log(
                        'self.addGeoJSONSources:component:',
                        component);

                    var source = SourceUtil.createURLSource(
                        component[0], component[1]);

                    console.log(
                        'self.addGeoJSONSources:source:',
                        source);

                    try {

                        MapUtil.addSource(self.map, source.id, source.config);

                    } catch (e) {

                        console.warn(e);

                    }

                    var type = LayerUtil.getType(component[1]);

                    var layerSpec = {
                        id: source.id,
                        source: source.id,
                        type: type,
                        paint: LayerUtil.getPaint(component[0], type)
                    };

                    var zoomSpec = LayerUtil.getZoom(component[0]);

                    layerSpec.minzoom = zoomSpec.min;

                    layerSpec.maxzoom = zoomSpec.max;

                    var labelLayer = LayerUtil.createLabelLayer(
                        source,
                        component[0],
                        component[1]
                    );

                    labelLayer.minzoom = zoomSpec.min;

                    labelLayer.maxzoom = zoomSpec.max;

                    LayerUtil.trackLayer(labelLayer);

                    try {

                        MapUtil.addLayer(
                            self.map,
                            labelLayer,
                            component[0] + '-label'
                        );

                    } catch (e) {

                        console.warn(e);

                    }

                    try {

                        LayerUtil.trackLayer(layerSpec);

                        MapUtil.addLayer(
                            self.map,
                            layerSpec,
                            component[0]
                        );

                    } catch (e) {

                        console.warn(e);

                    }

                });

            };

            self.createMap = function(options) {

                if (!options) return;

                self.map = new mapboxgl.Map(options);

                self.map.on('click', function (e) {

                    var features = self.map.queryRenderedFeatures(e.point);

                    if (features.length) {

                        var target = features[0];

                        if (target.properties.id !== self.primaryNode.properties.id) {

                            self.fetchPrimaryNode(
                                target.properties.type,
                                target.properties.id
                            );

                        }

                    }

                    console.log(
                        'map.click:features:',
                        features
                    );

                });

                self.map.on('styledata', function() {

                    if (self.map.getLayer('fd.project-label') !== undefined) {

                        if (self.mapOptions.style.indexOf('satellite') >= 0) {

                            try {

                                self.map.setPaintProperty(
                                    'fd.project-label',
                                    'text-color',
                                    '#FFFFFF'
                                );

                                self.map.setPaintProperty(
                                    'fd.project-label',
                                    'text-halo-color',
                                    '#212121'
                                );

                            } catch (e) {

                                console.warn(e);

                            }

                        } else {

                            try {

                                self.map.setPaintProperty(
                                    'fd.project-label',
                                    'text-color',
                                    [
                                        'interpolate',
                                        ['exponential', 0.5],
                                        ['zoom'],
                                        9,
                                        '#616161',
                                        14,
                                        '#212121'
                                    ]
                                );

                                self.map.setPaintProperty(
                                    'fd.project-label',
                                    'text-halo-color',
                                    'rgba(255,255,255,0.75)'
                                );

                            } catch (e) {

                                console.warn(e);

                            }

                        }

                    }

                    //
                    // Update stored layers.
                    //

                    LayerUtil.trackLayers(self.map);

                    //
                    // Update stored sources.
                    //

                    SourceUtil.trackSources(self.map);

                });

                self.map.on('moveend', function() {

                    self.urlComponents.forEach(function (component) {

                        $timeout(function () {

                            self.updateNodeLayer(component[0], component[1]);

                        }, 1000);

                    });

                });

                self.map.on('idle', function() {

                    //
                    // Retrieve stored layers.
                    //

                    var preservedLayers = LayerUtil.list();

                    //
                    // Retrieve stored sources.
                    //

                    var preservedSources = SourceUtil.list();

                    if (preservedSources) {

                        //
                        // Remove stored sources. They will be restored in
                        // the following loop calls.
                        //

                        SourceUtil.removeAll();

                        preservedSources.forEach(function (source) {

                            console.log(
                                'Adding preserved source:',
                                source
                            );

                            //
                            // If source not present on map object, add it.
                            //

                            if (self.map.getSource(source.id) === undefined) {

                                self.map.addSource(source.id, source.config);

                            }

                            //
                            // Track source in stored sources.
                            //

                            SourceUtil.trackSource(source.id, source.config);

                        });

                    }

                    if (preservedLayers) {

                        //
                        // Remove stored layers. They will be restored in
                        // the following loop calls.
                        //

                        LayerUtil.removeAll();

                        preservedLayers.forEach(function (layer) {

                            console.log(
                                'Adding preserved layer:',
                                layer
                            );

                            //
                            // If layer not present on map object, add it.
                            //

                            if (self.map.getLayer(layer.id) === undefined) {

                                self.map.addLayer(layer);

                            }

                            //
                            // Track layer in stored layers.
                            //

                            LayerUtil.trackLayer(layer);

                        });

                    }

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

                    // self.map.addControl(new mapboxgl.GeolocateControl({
                    //     positionOptions: {
                    //         enableHighAccuracy: true
                    //     },
                    //     trackUserLocation: true
                    // }));

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

                    self.extractUrlParams();

                    self.addReferenceLayers();

                    self.addGeoJSONSources();

                });

                self.urlComponents.forEach(function (combination) {

                    var layerId = [
                        'fd',
                        combination[0],
                        combination[1]
                    ].join('.');

                    self.map.on('click', layerId, function (e) {

                        console.log(
                            'map:click:layerId',
                            layerId
                        );

                        SourceUtil.resetFeatureStates(
                            self.map, self.urlComponents);

                        if (e.features.length > 0) {

                            console.log(
                                'map:click:focusedFeature',
                                e.features[0]
                            );

                            if (typeof self.focusedFeature === 'number') {

                                self.map.removeFeatureState({
                                    source: layerId,
                                    id: self.focusedFeature
                                });

                            }

                            self.focusedFeature = e.features[0].id;

                            self.map.setFeatureState({
                                source: layerId,
                                id: self.focusedFeature,
                            }, {
                                focus: true
                            });

                        }

                    });

                });

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

            self.loadMetrics = function() {

                self.featureClass.progress({
                    id: self.primaryNode.properties.id
                }).$promise.then(function(successResponse) {

                    // console.log('Project metrics', successResponse);

                    Utility.processMetrics(successResponse.features);

                    self.metrics = Utility.groupByModel(successResponse.features);

                    console.log('self.metrics', self.metrics);

                    $timeout(function () {

                        AtlasLayoutUtil.resizeMainContent();

                    }, 50);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.extractUrlParams = function () {

                var params = $location.search();

                console.log(
                    'extractUrlParams:params:',
                    params
                );

                self.origin = AtlasDataManager.getOrigin(params);

                console.log(
                    'extractUrlParams:origin:',
                    self.origin
                );

                self.nodeData = AtlasDataManager.getData(params);

                console.log(
                    'extractUrlParams:nodeData:',
                    self.nodeData
                );

                self.fetchPrimaryNode(
                    self.nodeData.featureType,
                    self.nodeData.featureId
                );

            };

            $scope.$on('$routeUpdate', function () {

                var params = $location.search();

                self.extractUrlParams(params);

            });

            window.addEventListener('popstate', function (event) {
                // The popstate event is fired each time when the current history entry changes.

                var params = $location.search();

                self.extractUrlParams(params);

            }, false);

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

                    self.stageMap(true);

                });

            } else {

                $location.path('/logout');

            }

        });