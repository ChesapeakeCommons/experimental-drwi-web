'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeLocationController',
        function(Account, Image, $location, $log, mapbox, Media,
                 Site, Practice, practice, $q, $rootScope, $route,
                 $scope, $timeout, $interval, site, user, Shapefile,
                 Utility, Task, LayerService, MapManager,
                 Project, $window) {

            var self = this;

            $rootScope.toolbarState = {
                'editLocation': true
            };

            self.status = {
                loading: true
            };

            self.map = undefined;

            self.setFileInput = true;

            $rootScope.page = {};

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                    $timeout(function() {

                        if (!self.mapOptions) {

                            self.mapOptions = self.getMapOptions();

                        }

                        if (self.map) {

                            self.populateMap(self.map, self.practice);

                        } else {

                            self.createMap(self.mapOptions);

                       //     drawOtherGeometries('secondary_practices');

                            MapManager.drawOtherGeometries(
                                'secondary_practices',
                                self.map,
                                self.practices,
                                self.practice,
                                MapManager.addFeature
                            );

                            MapManager.drawOtherGeometries(
                                'secondary_sites',
                                self.map,
                                self.sites,
                                self.site,
                                MapManager.addFeature
                            );

                        //    drawOtherGeometries('secondary_sites');

                        }

                    }, 50);

                }, 50);

            };

            self.loadSite = function() {

                var exclude = [
                    'allocations',
                    'creator',
                    'counties',
                    'geographies',
                    'last_modified_by',
                    'watersheds',
                    'partnerships',
                    'practices',
                    'project',
                    'tags',
                    'tasks'
                ].join(',');

                Practice.site({
                    id: $route.current.params.practiceId,
                    format: 'geojson',
                    exclude: exclude
                }).$promise.then(function(successResponse) {

                    console.log('self.site', successResponse);

                    self.site = successResponse;

                    self.loadPractice();

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.loadSiteDirect = function(){

                var exclude = [
                    'allocations',
                    'creator',
                    'counties',
                    'geographies',
                    'last_modified_by',
                    'watersheds',
                    'partnerships',
                    'practices',
                    'project',
                    'tags',
                    'tasks'
                ].join(',');

                site({
                    id: self.practice.site.id,
                    format: 'geojson'
                    //  exclude: exclude
                }).$promise.then(function(successResponse) {

                    console.log('self.site YES', successResponse);

                    self.site = successResponse;

                    self.loadPractice();

                }, function(errorResponse) {

                    //

                });
            }

            self.loadPractice = function() {

                var exclude = [
                    'centroid',
                    'creator',
                    'dashboards',
                    'extent',
                    // 'geometry',
                    'last_modified_by',
                    'members',
                    'metric_types',
                    'partnerships',
                    'practices',
                    'practice_types',
                    'properties',
                    'targets',
                    'tasks',
                    'sites'
                ].join(',');

                Practice.get({
                    id: $route.current.params.practiceId,
                    exclude: exclude
                }).$promise.then(function(successResponse) {

                    console.log('self.practice', successResponse);

                    self.practice = successResponse;

                    self.featureType = 'practice';

                    self.dimension = Utility.measureGeometry(self.practice);

                    self.processSetup(self.practice.setup);

                    self.practiceType = successResponse.practice_type  || successResponse.practice_type;

                    console.log('self.practiceType',  self.practiceType);

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        return;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    $rootScope.page.title = self.practice.name ? self.practice.name : 'Un-named Practice';

                    self.loadSites();

                    self.showElements();

                }, function(errorResponse) {

                    self.showElements();

                });

            };

            /* START PRACTICES PANEL */
            self.loadPractices = function() {
                Project.practices({
                    id: self.practice.project.id,
                    limit: 24,
                    page: 1,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    self.practices = successResponse.features;

                    self.practicesSummary = successResponse.summary;

                }, function(errorResponse) {

                    //

                });

            };

            /* END PRACTICES PANEL */


            /* START SITES PANEL */

            self.loadSites = function() {

                console.log('self.loadSites --> Starting...');

                Project.sites({
                    id: self.practice.project.id,
                    limit: 24,
                    page: 1,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('Project sites --> ', successResponse);

                    self.sites = successResponse.features;

                    console.log("self.sites", self.sites);

                    self.loadPractices();

                }, function(errorResponse) {

                    console.log('loadSites.errorResponse', errorResponse);

                });

            };

            /* END SITES PANEL */


            /*START STATE CALC*/

            self.processSetup = function(setup){

                const next_action = setup.next_action;

                self.states = setup.states;

                self.next_action = next_action;

                console.log("self.states",self.states);

                console.log("self.next_action",self.next_action);

            };

            self.fetchTasks = function(taskId) {

                if (taskId &&
                    typeof taskId === 'number') {

                    return Task.get({
                        id: taskId
                    }).$promise.then(function(response) {

                        console.log('Task.get response', response);

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

                    return Practice.tasks({
                        id: $route.current.params.practiceId
                    }).$promise.then(function(response) {

                        console.log('Task.get response', response);

                        self.pendingTasks = response.features;

                        if (self.pendingTasks.length < 1) {

                            self.loadSite();

                            $interval.cancel(self.taskPoll);

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

                self.loadSite();

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

                fileData.append('feature_type', 'practice');

                fileData.append('feature_id', self.practice.id);

                console.log('fileData', fileData);

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

                    self.fileImport = null;

                }

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'allocations',
                    'creator',
                    'dashboards',
                    'geographies',
                    // 'geometry',
                    'images',
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

                    if (feature) {

                        delete feature[key];

                    } else {

                        delete feature[key];

                    }

                });

                reservedProperties.forEach(function(key) {

                    delete feature[key];

                });

            };

            self.savePractice = function() {

                self.status.processing = true;

                self.scrubFeature(self.practice);

                console.log("Save Geometry", self.practice);

                if(self.practice.geometry !== null) {

                    self.practice.$update().then(function (successResponse) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practice location saved.',
                            'prompt': 'OK'
                        }];

                        console.log("Save response", successResponse);

                        $timeout(closeAlerts, 2000);

                        self.practiceType = successResponse.practice_type;

                        if(!self.states.has_targets){

                            $timeout(railsRedirection,3000);

                        }

                        self.showElements();

                    }, function (errorResponse) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong and the location could not be saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        self.showElements();

                    });
                }else{
                    self.status.processing = false;
                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Please a Location Geometry to this practice',
                        'prompt': 'OK'
                    }];
                    $timeout(closeAlerts, 2000);
                }

            };

            function railsRedirection(){
                window.location.replace("/practices/"+self.practice.id+"/targets");
            }

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                if(self.practice.site != null){
                    $location.path(self.practice.links.site.html);
                }else{

                } $location.path("/projects/"+self.practice.project.id);

            }

            self.updateGeometry = function(event) {

                var data = self.drawControls.getAll();

                console.log('self.updateGeometry --> data', data);

                $scope.$apply(function() {

                    if (data.features.length > 0) {

                        var feature = data.features[0];

                        self.dimension = Utility.measureGeometry(feature);

                        if (feature.geometry) {

                            self.practice.geometry = feature.geometry;

                        }

                    } else {

                        self.dimension = Utility.measureGeometry({});

                        self.practice.geometry = null;

                    }

                });

            };

            self.populateMap = function(map, practice) {

                console.log('practice.geometry', practice.geometry);

                if (self.drawControls) {

                    self.drawControls.deleteAll();

                }

                if (practice.geometry !== null &&
                    typeof practice.geometry !== 'undefined') {

                    //  if(self.site.geometry == null
                    //      || self.site.geometry == 'undefined'){
                    var bounds = turf.bbox(practice.geometry);

                    map.fitBounds(bounds, {
                        padding: 40
                    });
                    //  }

                    if (self.drawControls) {

                        var feature = {
                            id: 'practice-' + practice.id,
                            type: 'Feature',
                            properties: {

                            },
                            paint: {
                                'fill-color': '#df063e',
                                'fill-opacity': 0.4
                            },
                            geometry: practice.geometry

                        };

                        self.drawControls.add(feature);

                        self.drawControls.changeMode(
                            'simple_select',
                            {
                                featureId: 'practice-' + practice.id
                            });

                    }

                }

            };

            self.switchMapStyle = function(styleId, index) {

                if(self.site != null && self.site.geometry != null){

                    self.map.on('style.load', function () {

                        let mapLayer = self.map.getLayer('feature-site-'+self.site.properties.id);

                        if(typeof mapLayer !== 'undefined') {

                        }else{

                            MapManager.addFeature(
                                self.map,
                                self.site,
                                'geometry',
                                true,
                                false,
                                'site'
                            );

                            self.map.moveLayer("feature-site-"+self.site.properties.id,"country-label");
                            self.map.moveLayer("feature-outline-site-"+self.site.properties.id,"country-label");

                        }

                    });

                }

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

                if (self.practice &&
                    self.practice.map_options) {

                    var mapOptions = self.practice.map_options;

                    if (mapOptions.hasOwnProperty('centroid') &&
                        mapOptions.centroid !== null) {

                        self.mapOptions.center = self.practice.map_options.centroid.coordinates;

                    }

                }

                return self.mapOptions;

            };

            self.createMap = function(options) {

                if (!options) return;

                console.log('self.createMap --> Starting...');

                self.map = new mapboxgl.Map(options);

                self.map.on('load', function () {

                    if(self.site != null && self.site.geometry != null){

                        if(self.practice.geometry == null
                            || self.practice.geometry === 'undefined'
                        ){
                            var bounds = turf.bbox(self.site.geometry);

                            self.map.fitBounds(bounds, {
                                duration: 0,
                                padding: 40
                            });
                        }

                        MapManager.addFeature(

                            self.map,
                            self.site,
                            'geometry',
                            true,
                            false,
                            'site'
                        );
                    }else if(self.practice.geometry == null
                        || self.practice.geometry === 'undefined'
                    ){
                        if(self.practice.project.extent != null){

                        //    var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
                            let bbox = turf.bbox(self.practice.project.extent);
                            self.map.fitBounds(bbox, { duration: 0, padding: 40 });

                        }else{

                            var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
                            var bbox = turf.bbox(line);
                            self.map.fitBounds(bbox, { duration: 0, padding: 40 });


                        }

                        MapManager.addFeature(
                            self.map,
                            self.practice,
                            'geometry',
                            true,
                            true,
                            'practice'
                        );
                    }

                    var map_ctrl_linestring = false;
                    var map_ctrl_point = false;
                    var map_ctrl_polygon = false;

                    console.log("self.practiceType.unit.dimension",self.practiceType.unit.dimension);

                    if(self.practiceType.unit.dimension == 'area'){
                        map_ctrl_polygon = true;
                    }
                    else if(self.practiceType.unit.dimension == 'length'){
                        map_ctrl_linestring = true;
                    }else{
                        map_ctrl_polygon = true;
                        map_ctrl_linestring = true;
                        map_ctrl_point = true;
                    }



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
                                    'fill-color': '#df063e',
                                    'fill-outline-color': '#df063e',
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
                                    'fill-color': '#df063e',
                                    'fill-outline-color': '#df063e',
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
                                    'circle-color': '#df063e'
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
                                    'line-color': '#df063e',
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
                                    'line-color': '#df063e',
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
                                    'line-color': '#df063e',
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
                                    'line-color': '#df063e',
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
                                    'circle-color': '#df063e'
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
                                    'circle-color': '#df063e'
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
                                    'circle-color': '#df063e'
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
                                    'circle-color': '#df063e'
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
                                    'circle-color': '#df063e'
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
                                    'circle-color': '#df063e'
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

                    console.log("ADDING THE MAP");

                    console.log("SITE",self.site);

                    self.populateMap(self.map, self.practice);

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
                        can_edit: false
                    };

                    self.loadPractice();

                    self.fetchTasks();

                });

            }

        });