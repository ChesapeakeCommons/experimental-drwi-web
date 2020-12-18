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
                 Utility, $interval, AtlasDataManager, AtlasLayoutUtil, ipCookie, ZoomUtil,
                 Practice, Project, LayerUtil, SourceUtil, PopupUtil, MapUtil, LabelLayer, DataLayer) {

            var self = this;

            self.urlComponents = LayerUtil.getUrlComponents();

            var DRAINAGE_ID = 'fd.drainage.polygon';

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
                id: 'fd.project.point',
                name: 'Projects',
                selected: true
            }, {
                id: 'fd.site.polygon',
                name: 'Site polygons',
                selected: true
            }, {
                id: 'fd.site.line',
                name: 'Site lines',
                selected: true
            }, {
                id: 'fd.site.point',
                name: 'Site points',
                selected: true
            }, {
                id: 'fd.practice.polygon',
                name: 'Practice polygons',
                selected: true
            }, {
                id: 'fd.practice.line',
                name: 'Practice lines',
                selected: true
            }, {
                id: 'fd.practice.point',
                name: 'Practice points',
                selected: true
            }, {
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

                var params = {
                    bbox: boundsArray,
                    // exclude: exclude,
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

                }, function(errorResponse) {

                    console.log('Unable to load node layer data.');

                    self.showElements();

                });

            };

            self.fetchPrimaryNode = function (featureType, featureId) {

                var cls = self.clsMap[featureType];

                if (cls === undefined) return;

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

                    var urlData = AtlasDataManager.createURLData(
                        self.primaryNode,
                        false,
                        {
                            style: self.styleString,
                            zoom: self.map.getZoom()
                        }
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

                    console.log('Unable to load feature data.');

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

                LayerUtil.toggleLayer(layerId, self.map);

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

                //
                // Update URL data.
                //

                if (self.primaryNode) {

                    var urlData = AtlasDataManager.createURLData(
                        self.primaryNode,
                        false,
                        {
                            style: style.name.toLowerCase(),
                            zoom: self.map.getZoom()
                        }
                    );

                    $location.search(urlData);

                }

                self.mapOptions.style = self.mapStyles[index].url;

                self.map.setStyle(
                    self.mapStyles[index].url,
                    {
                        diff: false
                    }
                );

            };

            self.getMapOptions = function() {

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

                self.mapOptions.style = self.mapStyles[self.activeStyle].url;

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

                        return

                    }

                    var styleString = MapUtil.getStyleString(self.map);

                    console.log(
                        'styledata:styleString:',
                        styleString
                    );

                    // if (styleString === self.currentStyleString) return;

                    //
                    // Restore reference sources and layers.
                    //

                    self.populateMap();

                    //
                    // Restore feature source data.
                    //

                    SourceUtil.restoreSources(self.map);

                    //
                    // Set text color for label layers.
                    //

                    LayerUtil.setTextColor(self.map, styleString);

                });

                self.map.on('moveend', function() {

                    self.urlComponents.forEach(function (component) {

                        $timeout(function () {

                            self.updateNodeLayer(component[0], component[1]);

                        }, 500);

                    });

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

                    self.populateMap();

                    var nodeString = self.urlData.node;

                    var nodeTokens = nodeString.split('.');

                    self.fetchPrimaryNode(
                        nodeTokens[0],
                        +nodeTokens[1]
                    );

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

            self.populateMap = function () {

                LayerUtil.addReferenceSources(self.map);

                LayerUtil.addReferenceLayers(self.map);

                LabelLayer.addLabelLayers(self.map);

                DataLayer.addDataLayers(self.map);

                LayerUtil.setVisibility(self.map, self.visibilityIndex);

                self.layers.forEach(function (layer) {

                    var visibility = layer.selected ? 'visible' : 'none';

                    var labelLayerId = layer.id + '-label';

                    var labelLayer = self.map.getLayer(labelLayerId);

                    if (labelLayer !== undefined) {

                        self.map.setLayoutProperty(
                            labelLayerId,
                            'visibility',
                            visibility
                        );

                    }

                    self.map.setLayoutProperty(
                        layer.id,
                        'visibility',
                        visibility
                    );

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

            self.extractUrlParams = function (params) {

                // var params = $location.search();

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

                if (!angular.isDefined(self.map)) {

                    self.stageMap(true);

                }

            };

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

                });

            } else {

                $location.path('/logout');

            }

        });