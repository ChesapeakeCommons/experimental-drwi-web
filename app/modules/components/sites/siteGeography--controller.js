(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteSummaryController
     * @description
     */
    angular.module('FieldDoc')
        .controller('SiteGeographyController',
            function(Account, $location, $window, $timeout, $rootScope, $scope,
                $route, nodes, user, Utility, site, Site, Practice,
                $interval, mapbox) {

                var self = this;

                $rootScope.toolbarState = {
                    'viewGeographies': true
                };

                $rootScope.page = {};

                self.map = undefined;

                console.log('self.map', self.map);

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

                            if (self.nodeCollection) {

                                self.parseNodes(self.nodeCollection);

                            }

                        }, 50);

                    }, 50);

                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    $location.path(self.site.links.project.html);

                }

                self.confirmDelete = function(obj, targetCollection) {

                    console.log('self.confirmDelete', obj, targetCollection);

                    if (self.deletionTarget &&
                        self.deletionTarget.collection === 'site') {

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

                self.deleteFeature = function(featureType, index) {

                    console.log('self.deleteFeature', featureType, index);

                    var targetCollection,
                        targetId;

                    switch (featureType) {

                        case 'practice':

                            targetCollection = Practice;

                            break;

                        default:

                            targetCollection = Site;

                            break;

                    }

                    if (self.deletionTarget.feature.properties) {

                        targetId = self.deletionTarget.feature.properties.id;

                    } else {

                        targetId = self.deletionTarget.feature.id;

                    }

                    targetCollection.delete({
                        id: +targetId
                    }).$promise.then(function(data) {

                        self.alerts.push({
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this ' + featureType + '.',
                            'prompt': 'OK'
                        });

                        if (index !== null &&
                            typeof index === 'number' &&
                            featureType === 'practice') {

                            self.practices.splice(index, 1);

                            self.cancelDelete();

                            $timeout(closeAlerts, 2000);

                        } else {

                            $timeout(closeRoute, 2000);

                        }

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + self.deletionTarget.feature.properties.name + '”. There are pending tasks affecting this ' + featureType + '.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this ' + featureType + '.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this ' + featureType + '.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(closeAlerts, 2000);

                    });

                };

                self.buildStaticMapURL = function(geometry) {

                    var styledFeature = {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "marker-size": "small",
                            "marker-color": "#2196F3",
                            "stroke": "#2196F3",
                            "stroke-opacity": 1.0,
                            "stroke-width": 2,
                            "fill": "#2196F3",
                            "fill-opacity": 0.5
                        }
                    };

                    // Build static map URL for Mapbox API

                    return 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/static/geojson(' + encodeURIComponent(JSON.stringify(styledFeature)) + ')/auto/400x200@2x?access_token=pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw';

                };

                self.buildFeature = function(geometry) {

                    var styleProperties = {
                        color: "#2196F3",
                        opacity: 1.0,
                        weight: 2,
                        fillColor: "#2196F3",
                        fillOpacity: 0.5
                    };

                    return {
                        data: {
                            "type": "Feature",
                            "geometry": geometry,
                            "properties": {
                                "marker-size": "small",
                                "marker-color": "#2196F3",
                                "stroke": "#2196F3",
                                "stroke-opacity": 1.0,
                                "stroke-width": 2,
                                "fill": "#2196F3",
                                "fill-opacity": 0.5
                            }
                        },
                        style: styleProperties
                    };

                };

                self.processCollection = function(collection, arr) {

                    arr.forEach(function(feature) {

                        if (feature.geometry !== null) {

                            feature.staticURL = self.buildStaticMapURL(feature.geometry);

                            feature.geojson = self.buildFeature(feature.geometry);

                        }

                        if (feature.code !== null &&
                            typeof feature.code === 'string') {

                            feature.classification = feature.code.length;

                        }

                    });

                    if (collection === 'watersheds') {

                        Utility.sortCollection(arr, 'classification');

                    } else {

                        Utility.sortCollection(arr, 'name');

                    }

                };

                self.loadSite = function() {

                    site.$promise.then(function(successResponse) {

                        console.log('self.site', successResponse);

                        self.site = successResponse;

                        if (successResponse.permissions.read &&
                            successResponse.permissions.write) {

                            self.makePrivate = false;

                        } else {

                            self.makePrivate = true;

                        }

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        if (self.site.geometry !== null) {

                            self.site.staticURL = self.buildStaticMapURL(self.site.geometry);

                        }

                        $rootScope.page.title = self.site.name;

                        self.project = successResponse.project;

                        console.log('self.project', self.project);

                        //
                        // Load spatial nodes
                        //

                        nodes.$promise.then(function(successResponse) {

                            for (var collection in successResponse) {

                                if (successResponse.hasOwnProperty(collection) &&
                                    Array.isArray(successResponse[collection])) {

                                    self.processCollection(
                                        collection,
                                        successResponse[collection]);

                                }

                            }

                            self.nodeCollection = successResponse;

                            console.log('self.nodeCollection', self.nodeCollection);

                            self.showElements();

                        }, function(errorResponse) {

                            self.showElements();

                        });

                    });

                };

                self.getMapOptions = function() {

                    self.mapStyles = mapbox.baseStyles;

                    console.log(
                        'self.getMapOptions --> mapStyles',
                        self.mapStyles);

                    self.activeStyle = 0;

                    mapboxgl.accessToken = mapbox.accessToken;

                    console.log(
                        'self.getMapOptions --> accessToken',
                        mapboxgl.accessToken);

                    self.mapOptions = JSON.parse(JSON.stringify(mapbox.defaultOptions));

                    self.mapOptions.container = 'primary--map';

                    self.mapOptions.style = self.mapStyles[0].url;

                    return self.mapOptions;

                };

                self.parseNodes = function(data) {

                    for (var key in data) {

                        if (data.hasOwnProperty(key) &&
                            Array.isArray(data[key])) {

                            self.addMapPreviews(key, data[key]);

                        }

                    }

                };

                self.addMapPreviews = function(key, arr) {

                    console.log('self.addMapPreviews --> key', key);

                    console.log('self.addMapPreviews --> arr', arr);

                    var interactions = [
                        'scrollZoom',
                        'boxZoom',
                        'dragRotate',
                        'dragPan',
                        'keyboard',
                        'doubleClickZoom',
                        'touchZoomRotate'
                    ];

                    arr.forEach(function(feature, index) {

                        var localOptions = JSON.parse(JSON.stringify(self.mapOptions));

                        localOptions.style = self.mapStyles[0].url;

                        localOptions.container = key + '-preview-' + index;

                        var previewMap = new mapboxgl.Map(localOptions);

                        previewMap.on('load', function() {

                            interactions.forEach(function(behavior) {

                                previewMap[behavior].disable();

                            });

                            self.populateMap(previewMap, feature, 'geometry');

                        });

                    });

                };

                self.populateMap = function(map, feature, attribute) {

                    console.log('self.populateMap --> feature', feature);

                    var bounds;

                    if (feature[attribute] !== null &&
                        typeof feature[attribute] !== 'undefined') {

                        bounds = turf.bbox(feature[attribute]);

                        map.fitBounds(bounds, {
                            padding: 40
                        });

                        map.addLayer({
                            'id': 'geography-preview',
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
                            'id': 'geography-preview-outline',
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

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        self.loadSite();

                    });

                }

            });

})();