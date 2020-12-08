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
        function(Account, Notifications, $rootScope, $http, MapInterface, $routeParams,
                 $scope, $location, mapbox, Site, user, $window, $timeout,
                 Utility, $interval, AtlasMapManager, AtlasDataManager, DrexelInterface) {

            var self = this;

            $rootScope.viewState = {
                'map': true
            };

            $rootScope.toolbarState = {
                'dashboard': true
            };

            $rootScope.page = {};

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                $location.path('/maps');

            }

            self.status = {
                loading: true
            };

            self.presentChildModal = function(featureType) {

                if (featureType !== 'practice' &&
                    featureType !== 'site') return;

                self.showChildModal = true;

                self.childType = featureType;

            };

            self.showElements = function(createMap) {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                    if (createMap) {

                        console.log("CREATE MAP");

                        $timeout(function() {

                            console.log("MAKING THE MAP");

                            if (!self.mapOptions) {

                                self.mapOptions = self.getMapOptions();

                            }

                            self.createMap(self.mapOptions);

                        }, 0);

                    }

                }, 0);

            };

            self.refreshMetricProgress = function () {

                var progressPoll = $interval(function() {

                    self.loadMetrics();

                }, 4000);

                $timeout(function () {

                    $interval.cancel(progressPoll);

                }, 20000);

            };

            self.loadMetrics = function() {

                MapInterface.progress({
                    id: self.map.id
                }).$promise.then(function(successResponse) {

                    console.log('MapInterface metrics', successResponse);

                    Utility.processMetrics(successResponse.features);

                    self.metrics = Utility.groupByModel(successResponse.features);

                    console.log('self.metrics', self.metrics);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.showMetricModal = function(metric) {

                console.log('self.showMetricModal', metric);

                self.selectedMetric = metric;

                self.displayModal = true;

            };

            self.closeMetricModal = function() {

                self.selectedMetric = null;

                self.displayModal = false;

            };

            self.reloadPage = function() {
                $location.reload();
            };

            self.loadMap = function () {

                var params = {};

                if ($routeParams.id) {

                    params.id = +$routeParams.id;

                } else {

                    params = $location.search();

                }

                MapInterface.query(
                    params
                ).$promise.then(function(successResponse) {

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;

                    // self.showElements(true);

                    self.populateMap();

                }, function(errorResponse) {

                    console.log('Unable to load map data.');

                    // self.showElements(true);

                });

            };

            self.delineateWatershed = function(practice) {

                // var data = {
                //     // "bmp_type": "Forest Buffer",
                //     // "bmp_group": "Polygon Drainage",
                //     'bmp_short_name': 'riparianbuffers',
                //     'bmp_geometry': practice.geometry
                // };

                // DrexelInterface.delineate(
                //     {},
                //     params
                // ).$promise.then(function(successResponse) {
                //
                //     console.log(
                //         'delineateWatershed:successResponse:',
                //         successResponse
                //     )
                //
                // }, function(errorResponse) {
                //
                //     console.error(
                //         'delineateWatershed:errorResponse:',
                //         errorResponse
                //     )
                //
                // });

                $http({
                    method: 'POST',
                    url: 'http://watersheds.cci.drexel.edu/api/watershedboundary/',
                    data: practice,
                    headers: {
                        'Authorization-Bypass': true
                    }
                }).then(function successCallback(successResponse) {

                    console.log(
                        'delineateWatershed:successResponse:',
                        successResponse);

                    var feature = {
                        "type": "Feature",
                        "geometry": successResponse.data,
                        "properties": {
                            "id": Date.now()
                        }
                    };

                    var sourceSpec = AtlasMapManager.createSource(
                        feature,
                        'delineation'
                    );

                    console.log(
                        'sourceSpec:',
                        sourceSpec
                    );

                    self.map.addSource(sourceSpec.id, sourceSpec.config);

                    var layerSpec = AtlasMapManager.createLayer(
                        sourceSpec,
                        'delineation'
                    );

                    console.log(
                        'layerSpec:',
                        layerSpec
                    );

                    layerSpec.id = sourceSpec.id;

                    self.map.addLayer(layerSpec);

                    try {

                        var bounds = turf.bbox(
                            feature.geometry
                        );

                        self.map.fitBounds(bounds, {
                            padding: 40
                        });

                    } catch (e) {

                        console.warn(e);

                    }

                }, function errorCallback(errorResponse) {

                    console.log(
                        'delineateWatershed:successResponse:',
                        errorResponse
                    );

                });

            };

            self.populateMap = function() {

                var bounds;

                try {

                    try {

                        bounds = turf.bbox(
                            self.feature.primary_node.properties.extent
                        );

                    } catch (e) {

                        console.warn(e);

                        bounds = turf.bbox(
                            self.feature.primary_node.geometry
                        );

                    }

                } catch (e) {

                    console.warn(e);

                }

                if (bounds && typeof bounds !== 'undefined') {

                    self.map.fitBounds(bounds, {
                        padding: 40
                    });

                }

                var featureType = self.feature.primary_node.properties.type;

                if (featureType === 'practice') {

                    self.delineateWatershed(self.feature.primary_node);

                }

                try {

                    var sourceSpec = AtlasMapManager.createSource(
                        self.feature.primary_node,
                        featureType
                    );

                    console.log(
                        'sourceSpec:',
                        sourceSpec
                    );

                    self.map.addSource(sourceSpec.id, sourceSpec.config);

                    var layerSpec = AtlasMapManager.createLayer(
                        sourceSpec,
                        featureType
                    );

                    console.log(
                        'layerSpec:',
                        layerSpec
                    );

                    try {

                        layerSpec.id = sourceSpec.id;

                        self.map.addLayer(layerSpec);

                    } catch (e) {

                        console.warn(e);

                        if (featureType === 'project') {

                            try {

                                var popupHtml = AtlasMapManager.createPopup(
                                    self.feature.id,
                                    self.feature.primary_node,
                                    'project',
                                    self.activeStyle);

                                var marker = new mapboxgl.Marker()
                                    .setLngLat([
                                        self.feature.primary_node.properties.centroid.coordinates[0],
                                        self.feature.primary_node.properties.centroid.coordinates[1]
                                    ])
                                    .setPopup(
                                        new mapboxgl.Popup({
                                            maxWidth: 'none'
                                        }).setDOMContent(popupHtml)
                                    ) // add popup
                                    .addTo(self.map);

                            } catch (e) {

                                console.warn(e);

                            }

                        }

                    }

                } catch (e) {

                    console.error(e);

                }

            };

            self.toggleLayer = function(layer) {

                console.log('self.toggleLayer --> layer', layer);

                var layerId = layer.spec.id;

                var visibility = self.map.getLayoutProperty(layerId, 'visibility');

                if (visibility === 'visible') {

                    self.map.setLayoutProperty(layerId, 'visibility', 'none');

                } else {

                    self.map.setLayoutProperty(layerId, 'visibility', 'visible');

                }

            };

            self.switchMapStyle = function(styleId, index) {

                console.log('self.switchMapStyle --> styleId', styleId);

                console.log('self.switchMapStyle --> index', index);

                var center = self.map.getCenter();

                var zoom = self.map.getZoom();

                if (center.lng && center.lat) {

                    self.mapOptions.center = [center.lng, center.lat];

                }

                if (zoom) {

                    self.mapOptions.zoom = zoom;

                }

                self.mapOptions.style = self.mapStyles[index].url;

                self.map.remove();

                self.createMap(self.mapOptions);

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

                return self.mapOptions;

            };

            self.createMap = function(options) {

                if (!options) return;

                console.log('self.createMap --> Starting...');

                var tgt = document.getElementById('map');

                console.log(
                    'self.createMap --> tgt',
                    tgt);

                console.log('self.createMap --> options', options);

                self.map = new mapboxgl.Map(options);

                self.map.on('load', function() {

                    console.log("Loading Map");

                    var nav = new mapboxgl.NavigationControl();

                    self.map.addControl(nav, 'top-left');

                    var scale = new mapboxgl.ScaleControl({
                        maxWidth: 80,
                        unit: 'imperial'
                    });

                    self.map.addControl(scale);

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

                    var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);

                    var bounds = turf.bbox(line);

                    self.map.fitBounds(bounds, {
                        padding: 40
                    });

                    self.loadMap();

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.user = $rootScope.user;

                    //
                    // Assign map to a scoped variable
                    //

                    self.showElements(true);

                });

            } else {

                $location.path('/logout');

            }

        });