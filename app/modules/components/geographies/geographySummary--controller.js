(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:GeographySummaryController
     * @description
     */
    angular.module('FieldDoc')
        .controller('GeographySummaryController',
            function(Account, $location, $window, $timeout, $rootScope, $scope, $route,
                user, Utility, geography, mapbox, LayerService, GeographyService,
                     $interval, AtlasDataManager) {

                var self = this;

                $rootScope.viewState = {
                    'geography': true
                };

                $rootScope.toolbarState = {
                    'dashboard': true
                };

                $rootScope.page = {};

                self.map = undefined;

                self.status = {
                    loading: true,
                    processing: false
                };

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                        $timeout(function() {

                            if (!self.mapOptions) {

                                self.mapOptions = self.getMapOptions();

                            }

                            self.createMap(self.mapOptions);

                            // if (self.sites && self.sites.length) {

                            //     self.addMapPreviews(self.sites);

                            // }

                        }, 50);

                    }, 50);

                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    $location.path('/geographies');

                }

                self.confirmDelete = function(obj, targetCollection) {

                    console.log('self.confirmDelete', obj, targetCollection);

                    if (self.deletionTarget &&
                        self.deletionTarget.collection === 'geography') {

                        self.cancelDelete();

                    } else {

                        self.deletionTarget = {
                            'collection': targetCollection,
                            'feature': obj
                        };

                    }

                };

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.deleteFeature = function() {

                    console.log('self.deleteFeature');

                    var targetId;

                    if (self.deletionTarget.feature.properties) {

                        targetId = self.deletionTarget.feature.properties.id;

                    } else {

                        targetId = self.deletionTarget.feature.id;

                    }

                    GeographyService.delete({
                        id: +targetId
                    }).$promise.then(function(data) {

                        self.alerts.push({
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this geography.',
                            'prompt': 'OK'
                        });

                        $timeout(closeRoute, 2000);

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + self.deletionTarget.feature.properties.name + '”. There are pending tasks affecting this geography.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this geography.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this geography.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(closeAlerts, 2000);

                    });

                };

                self.cleanName = function(string_) {
                    return Utility.machineName(string_);
                };

                self.loadGeography = function() {

                    geography.$promise.then(function(successResponse) {

                        console.log('self.geography', successResponse);

                        self.geography = successResponse;

                        self.atlasParams = AtlasDataManager.createURLData(self.geography);

                        if (successResponse.permissions.read) {

                            self.makePrivate = false;

                        } else {

                            self.makePrivate = true;

                        }

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = self.geography.name;

                        self.loadMetrics();

                        self.loadTags();

                        self.showElements();

                    });

                };

                self.loadTags = function() {

                    GeographyService.tags({
                        id: self.geography.id
                    }).$promise.then(function(successResponse) {

                        console.log('GeographyService.tags', successResponse);

                        successResponse.features.forEach(function(tag) {

                            if (tag.color &&
                                tag.color.length) {

                                tag.lightColor = tinycolor(tag.color).lighten(5).toString();

                            }

                        });

                        self.tags = successResponse.features;

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                };

                self.loadMetrics = function() {

                    GeographyService.progress({
                        id: self.geography.id
                    }).$promise.then(function(successResponse) {

                        console.log(
                            'Territory.loadMetrics:successResponse',
                            successResponse
                        );

                        // Utility.processMetrics(successResponse.features);

                        if (successResponse.hasOwnProperty('timestamp')) {

                            if (successResponse.timestamp.toString().length === 10) {

                                successResponse.timestamp = successResponse.timestamp * 1000;

                            }

                            self.progressTimestamp = successResponse.timestamp;

                        }

                        console.log(
                            'Territory.loadMetrics:progressTimestamp',
                            self.progressTimestamp
                        );

                        self.metrics = successResponse.features;

                        self.metrics.forEach(function(metric) {

                            Utility.calcProgress(
                                metric,
                                true,
                                self.geography.type
                            );

                        });

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

                self.addLayers = function(arr) {

                    arr.forEach(function(feature) {

                        console.log(
                            'self.addLayers --> feature',
                            feature);

                        var spec = feature.layer_spec || {};

                        console.log(
                            'self.addLayers --> spec',
                            spec);

                        feature.spec = spec;

                        console.log(
                            'self.addLayers --> feature.spec',
                            feature.spec);

                        if (!feature.selected ||
                            typeof feature.selected === 'undefined') {

                            feature.selected = false;

                        } else {

                            feature.spec.layout.visibility = 'visible';

                        }

                        if (feature.spec.id) {

                            try {

                                self.map.addLayer(feature.spec);

                            } catch (error) {

                                console.log(
                                    'self.addLayers --> error',
                                    error);

                            }

                        }

                    });

                    return arr;

                };

                self.fetchLayers = function(taskId) {

                    LayerService.collection({
                        program: self.geography.program_id
                    }).$promise.then(function(successResponse) {

                        console.log(
                            'self.fetchLayers --> successResponse',
                            successResponse);

                        if (successResponse.features.length) {

                            console.log('self.fetchLayers --> Sorting layers.');

                            successResponse.features.sort(function(a, b) {

                                return b.index < a.index;

                            });

                        }

                        self.addLayers(successResponse.features);

                        self.layers = successResponse.features;

                        console.log(
                            'self.fetchLayers --> self.layers',
                            self.layers);

                    }, function(errorResponse) {

                        console.log(
                            'self.fetchLayers --> errorResponse',
                            errorResponse);

                    });

                };

                self.populateMap = function(map, feature, attribute) {

                    console.log('self.populateMap --> feature', feature);

                    if (feature[attribute] !== null &&
                        typeof feature[attribute] !== 'undefined') {

                        var bounds = turf.bbox(feature[attribute]);

                        map.fitBounds(bounds, {
                            padding: 40
                        });

                        map.addLayer({
                            'id': 'geography',
                            'type': 'fill',
                            'source': {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'geometry': feature[attribute]
                                }
                            },
                            'layout': {
                                'visibility': 'visible'
                            },
                            'paint': {
                                'fill-color': '#06aadf',
                                'fill-opacity': 0.4
                            }
                        });

                        map.addLayer({
                            'id': 'geography-outline',
                            'type': 'line',
                            'source': {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'geometry': feature[attribute]
                                }
                            },
                            'layout': {
                                'visibility': 'visible'
                            },
                            'paint': {
                                'line-color': 'rgba(6, 170, 223, 0.8)',
                                'line-width': 2
                            }
                        });

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

                    self.mapOptions.container = 'primary--map';

                    self.mapOptions.style = self.mapStyles[0].url;

                    return self.mapOptions;

                };

                self.createMap = function(options) {

                    if (!options) return;

                    console.log('self.createMap --> Starting...');

                    var tgt = document.querySelector('.map');

                    console.log(
                        'self.createMap --> tgt',
                        tgt);

                    console.log('self.createMap --> options', options);

                    self.map = new mapboxgl.Map(options);

                    self.map.on('load', function() {

                        var nav = new mapboxgl.NavigationControl();

                        self.map.addControl(nav, 'top-left');

                        var fullScreen = new mapboxgl.FullscreenControl();

                        self.map.addControl(fullScreen, 'top-left');

                        self.populateMap(self.map, self.geography, 'geometry');

                        if (self.layers && self.layers.length) {

                            self.addLayers(self.layers);

                        } else {

                            self.fetchLayers();

                        }

                    });

                };

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        self.loadGeography();

                    });

                }

            });

})();