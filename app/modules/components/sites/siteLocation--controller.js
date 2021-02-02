(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteLocationController
     * @description
     * # SiteEditController
     * Controller of the FieldDoc
     */
    angular.module('FieldDoc')
        .controller('SiteLocationController',
            function(Account, environment, $http, $location, mapbox,
                     Notifications, Site, site, $rootScope, $route,
                     $scope, $timeout, $interval, user, Shapefile,
                     Utility, Task, LayerService, MapManager,
                     Project,$window) {

                var self = this;

                $rootScope.toolbarState = {
                    'editLocation': true
                };

                $rootScope.page = {};

                self.map = undefined;

                self.setFileInput = true;

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

                            if (typeof self.map !== 'undefined') {

                                self.populateMap(self.map, self.site, 'geometry');

                            } else {

                                self.createMap(self.mapOptions);
                                if(self.practices != undefined) {
                                    MapManager.drawOtherGeometries(
                                        'secondary_practices',
                                        self.map,
                                        self.practices,
                                        self.site,
                                        MapManager.addFeature
                                    );
                                }
                                MapManager.drawOtherGeometries(
                                    'secondary_sites',
                                    self.map,
                                    self.sites,
                                    self.site,
                                    MapManager.addFeature
                                );

                            }

                        }, 500);

                    }, 500);

                };

                self.fetchTasks = function(taskId) {

                    if (taskId &&
                        typeof taskId === 'number') {

                        return Task.get({
                            id: taskId
                        }).$promise.then(function(response) {

                            console.log('Task.get response', response);

                            // if (response.status &&
                            //     response.status === 'complete') {
                            //
                            //     self.hideTasks();
                            //
                            // }

                            if (response.status && response.status === 'complete') {

                                $window.scrollTo(0, 0);

                                self.map = undefined;

                                self.hideTasks();

                                self.resetFileInput();

                                self.uploadError = null;

                                self.fileImport = null;

                                self.loadPractice();

                            }

                            if (response.status && response.status === 'failed') {

                                self.hideTasks();

                                self.uploadError = {
                                    message: response.error
                                };

                                self.fileImport = null;

                            }

                        });

                    } else {

                        return Site.tasks({
                            id: $route.current.params.siteId
                        }).$promise.then(function(response) {

                            console.log('Task.get response', response);

                            self.pendingTasks = response.features;

                            if (self.pendingTasks.length < 1) {

                                self.hideTasks();

                            }

                        });

                    }

                };

                self.resetFileInput = function() {

                    self.setFileInput = false;

                    $timeout(function () {

                        self.setFileInput = true;

                    }, 10);

                };

                self.hideTasks = function() {

                    self.pendingTasks = [];

                    if (typeof self.taskPoll !== 'undefined') {

                        $interval.cancel(self.taskPoll);

                    }

                    self.loadFeature();

                };

                self.uploadShapefile = function() {

                    if (!self.fileImport ||
                        !self.fileImport.length) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Please select a file.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        return false;

                    }

                    self.progressMessage = 'Uploading your file...';

                    var fileData = new FormData();

                    fileData.append('file', self.fileImport[0]);

                    fileData.append('feature_type', 'site');

                    fileData.append('feature_id', self.site.id);

                    console.log('fileData', fileData);

                    console.log('Shapefile', Shapefile);

                    try {

                        Shapefile.upload({}, fileData, function(successResponse) {

                            console.log('successResponse', successResponse);

                            self.uploadError = null;

                            self.fileImport = null;

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Upload complete. Processing data...',
                                'prompt': 'OK'
                            }];

                            $timeout(closeAlerts, 2000);

                            if (successResponse.task) {

                                self.pendingTasks = [
                                    successResponse.task
                                ];

                            }

                            self.taskPoll = $interval(function() {

                                self.fetchTasks(successResponse.task.id);

                            }, 500);

                        }, function(errorResponse) {

                            console.log('Upload error', errorResponse);

                            self.uploadError = errorResponse;

                            self.fileImport = null;

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'The file could not be processed.',
                                'prompt': 'OK'
                            }];

                            $timeout(closeAlerts, 2000);

                        });

                    } catch (error) {

                        console.log('Shapefile upload error', error);

                    }

                };

                self.scrubFeature = function(feature) {

                    var excludedKeys = [
                        'allocations',
                        'creator',
                        'counties',
                        'dashboards',
                        'extent',
                        'geographies',
                        // 'geometry',
                        'last_modified_by',
                        'members',
                        'metrics',
                        'metric_types',
                        'organization',
                        'partners',
                        'partnerships',
                        'practices',
                        'practice_types',
                        'program',
                        'project',
                        'reports',
                        'sites',
                        'status',
                        'tags',
                        'tasks',
                        'watersheds',
                        'users'
                    ];

                    var reservedProperties = [
                        'links',
                        'map_options',
                        'permissions',
                        '$promise',
                        '$resolved'
                    ];

                    excludedKeys.forEach(function(key) {

                        if (feature.properties) {

                            delete feature.properties[key];

                        } else {

                            delete feature[key];

                        }

                    });

                    reservedProperties.forEach(function(key) {

                        delete feature[key];

                    });

                };

                self.saveSite = function() {

                    self.scrubFeature(self.site);

                    self.status.processing = true;

                    Site.update({
                        id: self.site.id
                    }, self.site).then(function(successResponse) {

                        self.status.processing = false;

                        self.site = successResponse;

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Site location saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    }).catch(function(errorResponse) {

                        self.status.processing = false;

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong and the location could not be saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    });

                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    $location.path(self.site.links.project.html);

                }

                self.confirmDelete = function(obj) {

                    console.log('self.confirmDelete', obj);

                    self.deletionTarget = self.deletionTarget ? null : obj;

                };

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.deleteFeature = function() {

                    Site.delete({
                        id: +self.deletionTarget.id
                    }).$promise.then(function(data) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this site.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeRoute, 2000);

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this site.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this site.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this site.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(closeAlerts, 2000);

                    });

                };

                self.loadFeature = function() {

                    Site.get({
                        id: $route.current.params.siteId,
                        format: 'geojson'
                    }).$promise.then(function(successResponse) {

                        console.log('self.site', successResponse);

                        self.site = successResponse;

                        self.featureType = 'site';

                        self.dimension = Utility.measureGeometry(self.site);

                        if (successResponse.permissions.read &&
                            successResponse.permissions.write) {

                            self.makePrivate = false;

                        } else {

                            self.makePrivate = true;

                        }

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = self.site.name;

                        self.loadPractices();

                 //       self.showElements();

                    }, function(errorResponse) {

                        self.loadPractices();

                     //   self.showElements();

                    });

                };

                /* START PRACTICES PANEL */
                self.loadPractices = function() {
                    Site.practices({
                        id: self.site.id,
                        limit: 24,
                        page: 1,
                        t: Date.now()
                    }).$promise.then(function(successResponse) {

                        self.practices = successResponse.features;

                        self.practicesSummary = successResponse.summary;

                        //  self.showElements();

                        self.loadSites();


                    }, function(errorResponse) {

                        //  self.showElements();
                        self.loadSites();

                    });

                };

                /* START SITES PANEL */

                self.loadSites = function(params) {

                    Project.sites({
                        id: self.site.properties.project_id,
                        limit: 24,
                        t: Date.now()}).$promise.then(function(successResponse) {

                        console.log('Project sites --> ', successResponse);

                        self.sites = successResponse.features;

                        self.showElements();

                    }, function(errorResponse) {

                        console.log('loadSites.errorResponse', errorResponse);



                        self.showElements();

                    });

                };

                /* END SITES PANEL */

                self.updateGeometry = function(event) {

                    var data = self.drawControls.getAll();

                    console.log('self.updateGeometry --> data', data);

                    $scope.$apply(function() {

                        if (data.features.length > 0) {

                            var feature = data.features[0];

                            self.dimension = Utility.measureGeometry(feature);

                            if (feature.geometry) {

                                self.site.geometry = feature.geometry;

                            }

                        } else {

                            self.dimension = Utility.measureGeometry({});

                            self.site.geometry = null;

                        }

                    });

                };

                self.populateMap = function(map, feature, attribute) {

                    console.log('self.populateMap --> feature', feature);

                    if (self.drawControls) {

                        self.drawControls.deleteAll();

                    }

                    if (feature[attribute] !== null &&
                        typeof feature[attribute] !== 'undefined') {

                        var bounds = turf.bbox(feature[attribute]);

                        map.fitBounds(bounds, {
                            padding: 40
                        });

                        if (self.drawControls) {

                            var editableLayer = {
                                id: 'practice-' + feature.id,
                                type: 'Feature',
                                properties: {},
                                geometry: feature[attribute]
                            };

                            self.drawControls.add(editableLayer);

                            self.drawControls.changeMode(
                                'simple_select', {
                                    featureId: 'feature-' + feature.id
                                });

                        }

                    }

                };

                self.switchMapStyle = function(styleId, index) {

                    console.log('self.switchMapStyle --> styleId', styleId);

                    console.log('self.switchMapStyle --> index', index);

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

                    self.mapOptions.container = 'primary--map';

                    self.mapOptions.style = self.mapStyles[0].url;

                    if (self.site &&
                        self.site.map_options) {

                        var mapOptions = self.site.map_options;

                        if (mapOptions.hasOwnProperty('centroid') &&
                            mapOptions.centroid !== null) {

                            self.mapOptions.center = self.site.map_options.centroid.coordinates;

                        }

                    }

                    return self.mapOptions;

                };

                self.createMap = function(options) {

                    if (!options) return;

                    console.log('self.createMap --> Starting...');

                    self.map = new mapboxgl.Map(options);

                    self.map.on('load', function() {

                        if(self.site.geometry == null
                            || self.site.geometry == 'undefined'
                        ){
                            var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
                            var bbox = turf.bbox(line);
                            self.map.fitBounds(bbox, { duration: 0, padding: 40 });

                          /*  MapManager.addFeature(
                                self.map,
                                self.practice,
                                'geometry',
                                true,
                                true,
                                'practice'
                            );

                           */
                        }

                        var map_ctrl_linestring = true;
                        var map_ctrl_point = true;
                        var map_ctrl_polygon = true;

                        self.drawControls = new MapboxDraw({
                            displayControlsDefault: false,
                            controls: {
                                line_string: map_ctrl_linestring,
                                point: map_ctrl_point,
                                polygon: map_ctrl_polygon,
                                trash: true
                            },
                            userProperties: true,
                            styles: [
                                {
                                    'id': 'gl-draw-polygon-fill-inactive',
                                    'type': 'fill',
                                    'filter': ['all', ['==', 'active', 'false'],
                                        ['==', '$type', 'Polygon'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'paint': {
                                        'fill-color': '#06aadf',
                                        'fill-outline-color': '#06aadf',
                                        'fill-opacity': 0.5
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-fill-active',
                                    'type': 'fill',
                                    'filter': ['all', ['==', 'active', 'true'],
                                        ['==', '$type', 'Polygon']
                                    ],
                                    'paint': {
                                        'fill-color': '#06aadf',
                                        'fill-outline-color': '#06aadf',
                                        'fill-opacity': 0.1
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-midpoint',
                                    'type': 'circle',
                                    'filter': ['all', ['==', '$type', 'Point'],
                                        ['==', 'meta', 'midpoint']
                                    ],
                                    'paint': {
                                        'circle-radius': 3,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-stroke-inactive',
                                    'type': 'line',
                                    'filter': ['all', ['==', 'active', 'false'],
                                        ['==', '$type', 'Polygon'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'layout': {
                                        'line-cap': 'round',
                                        'line-join': 'round'
                                    },
                                    'paint': {
                                        'line-color': '#06aadf',
                                        'line-width': 2
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-stroke-active',
                                    'type': 'line',
                                    'filter': ['all', ['==', 'active', 'true'],
                                        ['==', '$type', 'Polygon']
                                    ],
                                    'layout': {
                                        'line-cap': 'round',
                                        'line-join': 'round'
                                    },
                                    'paint': {
                                        'line-color': '#06aadf',
                                        'line-dasharray': [0.2, 2],
                                        'line-width': 2
                                    }
                                },
                                {
                                    'id': 'gl-draw-line-inactive',
                                    'type': 'line',
                                    'filter': ['all', ['==', 'active', 'false'],
                                        ['==', '$type', 'LineString'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'layout': {
                                        'line-cap': 'round',
                                        'line-join': 'round'
                                    },
                                    'paint': {
                                        'line-color': '#06aadf',
                                        'line-width': 2
                                    }
                                },
                                {
                                    'id': 'gl-draw-line-active',
                                    'type': 'line',
                                    'filter': ['all', ['==', '$type', 'LineString'],
                                        ['==', 'active', 'true']
                                    ],
                                    'layout': {
                                        'line-cap': 'round',
                                        'line-join': 'round'
                                    },
                                    'paint': {
                                        'line-color': '#06aadf',
                                        'line-dasharray': [0.2, 2],
                                        'line-width': 2
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
                                    'type': 'circle',
                                    'filter': ['all', ['==', 'meta', 'vertex'],
                                        ['==', '$type', 'Point'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'paint': {
                                        'circle-radius': 5,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-and-line-vertex-inactive',
                                    'type': 'circle',
                                    'filter': ['all', ['==', 'meta', 'vertex'],
                                        ['==', '$type', 'Point'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'paint': {
                                        'circle-radius': 3,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-point-point-stroke-inactive',
                                    'type': 'circle',
                                    'filter': ['all', ['==', 'active', 'false'],
                                        ['==', '$type', 'Point'],
                                        ['==', 'meta', 'feature'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'paint': {
                                        'circle-radius': 5,
                                        'circle-opacity': 1,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-point-inactive',
                                    'type': 'circle',
                                    'filter': ['all', ['==', 'active', 'false'],
                                        ['==', '$type', 'Point'],
                                        ['==', 'meta', 'feature'],
                                        ['!=', 'mode', 'static']
                                    ],
                                    'paint': {
                                        'circle-radius': 3,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-point-stroke-active',
                                    'type': 'circle',
                                    'filter': ['all', ['==', '$type', 'Point'],
                                        ['==', 'active', 'true'],
                                        ['!=', 'meta', 'midpoint']
                                    ],
                                    'paint': {
                                        'circle-radius': 7,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-point-active',
                                    'type': 'circle',
                                    'filter': ['all', ['==', '$type', 'Point'],
                                        ['!=', 'meta', 'midpoint'],
                                        ['==', 'active', 'true']
                                    ],
                                    'paint': {
                                        'circle-radius': 5,
                                        'circle-color': '#06aadf'
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-fill-static',
                                    'type': 'fill',
                                    'filter': ['all', ['==', 'mode', 'static'],
                                        ['==', '$type', 'Polygon']
                                    ],
                                    'paint': {
                                        'fill-color': '#404040',
                                        'fill-outline-color': '#404040',
                                        'fill-opacity': 0.1
                                    }
                                },
                                {
                                    'id': 'gl-draw-polygon-stroke-static',
                                    'type': 'line',
                                    'filter': ['all', ['==', 'mode', 'static'],
                                        ['==', '$type', 'Polygon']
                                    ],
                                    'layout': {
                                        'line-cap': 'round',
                                        'line-join': 'round'
                                    },
                                    'paint': {
                                        'line-color': '#404040',
                                        'line-width': 2
                                    }
                                },
                                {
                                    'id': 'gl-draw-line-static',
                                    'type': 'line',
                                    'filter': ['all', ['==', 'mode', 'static'],
                                        ['==', '$type', 'LineString']
                                    ],
                                    'layout': {
                                        'line-cap': 'round',
                                        'line-join': 'round'
                                    },
                                    'paint': {
                                        'line-color': '#404040',
                                        'line-width': 2
                                    }
                                },
                                {
                                    'id': 'gl-draw-point-static',
                                    'type': 'circle',
                                    'filter': ['all', ['==', 'mode', 'static'],
                                        ['==', '$type', 'Point']
                                    ],
                                    'paint': {
                                        'circle-radius': 5,
                                        'circle-color': '#404040'
                                    }
                                }
                            ]



                        });


                        /*    self.drawControls = new MapboxDraw({
                                displayControlsDefault: false,
                                controls: {
                                    line_string: true,
                                    point: true,
                                    polygon: true,
                                    trash: true
                                }
                            });
                        s*/

                        console.log('drawControls', self.drawControls);

                        self.map.addControl(self.drawControls);

                        var nav = new mapboxgl.NavigationControl();

                        self.map.addControl(nav, 'top-left');

                        var fullScreen = new mapboxgl.FullscreenControl();

                        self.map.addControl(fullScreen, 'top-left');

                        // 
                        // Add geocoder
                        // 

                        var geocoder = new MapboxGeocoder({
                            accessToken: mapboxgl.accessToken,
                            mapboxgl: mapboxgl
                        });

                        document.getElementById('geocoder').appendChild(geocoder.onAdd(self.map));

                        self.populateMap(self.map, self.site, 'geometry');

                        self.map.on('draw.create', self.updateGeometry);
                        self.map.on('draw.delete', self.updateGeometry);
                        self.map.on('draw.update', self.updateGeometry);

                    });

                };

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {
                            isLoggedIn: Account.hasToken(),
                            role: $rootScope.user.properties.roles[0],
                            account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null,
                            can_edit: false
                        };

                        self.loadFeature();

                        self.fetchTasks();

                    });

                } else {

                    $location.path('/logout');

                }

            });

}());