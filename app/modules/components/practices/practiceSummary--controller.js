'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('CustomSummaryController',
        function ($scope, Account, $location, $timeout, $log, Report, $rootScope,
                  $route, Utility, user, Project, Site, $window, mapbox,
                  Practice, practice, LayerService, MapManager, AtlasDataManager) {

            var self = this,
                practiceId = $route.current.params.practiceId;

            $rootScope.toolbarState = {
                'dashboard': true
            };

            $rootScope.page = {};

            self.state = undefined;

            self.map = undefined;

            self.status = {
                loading: true
            };

            self.programSummary = {
                program_count: 0
            };

            self.print = function () {

                $window.print();

            };

            /*
            START CREATE MODAL
            */

            self.presentChildModal = function (featureType) {

                if (featureType !== 'practice' &&
                    featureType !== 'site' &&
                    featureType !== 'report') return;

                self.showChildModal = true;

                self.childType = featureType;

            };

            /*
            END CREATE MODAL
            */

            self.showElements = function () {

                $timeout(function () {

                    self.status.loading = false;

                    self.status.processing = false;

                    $timeout(function () {

                        if (!self.mapOptions) {

                            self.mapOptions = self.getMapOptions();

                        }

                        self.createMap(self.mapOptions);

                    }, 500);

                }, 500);

            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {
                if (self.practice.site != null) {
                    $location.path(self.practice.links.site.html);
                } else {

                }
                $location.path("/projects/" + self.practice.project.id);

            }

            /*DELETE LOGIC*/

            self.confirmDelete = function (obj, targetCollection) {

                console.log('self.confirmDelete', obj, targetCollection);

                if (self.deletionTarget &&
                    self.deletionTarget.collection === 'practice') {

                    self.cancelDelete();

                } else {

                    self.deletionTarget = {
                        'collection': targetCollection,
                        'feature': obj
                    };

                }

            };

            self.cancelDelete = function () {

                self.deletionTarget = null;

            };

            self.deleteFeature = function (featureType, index) {

                console.log('self.deleteFeature', featureType, index);

                var targetCollection;

                switch (featureType) {

                    case 'report':

                        targetCollection = Report;

                        break;

                    default:

                        targetCollection = Practice;

                        break;

                }

                targetCollection.delete({
                    id: +self.deletionTarget.feature.id
                }).$promise.then(function (data) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this ' + featureType + '.',
                        'prompt': 'OK'
                    }];

                    if (index !== null &&
                        typeof index === 'number' &&
                        featureType === 'report') {

                        self.reports.splice(index, 1);

                        self.cancelDelete();

                        $timeout(closeAlerts, 2000);

                        if (index === 0) {

                            $route.reload();

                        }

                    } else {

                        $timeout(closeRoute, 2000);

                    }

                }).catch(function (errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete this ' + featureType + '. There are pending tasks affecting this feature.',
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

            /*END DELETE LOGIC*/

            self.loadReports = function () {

                Practice.reports({
                    id: self.practice.id
                }).$promise.then(function (successResponse) {

                    console.log('self.practice', successResponse);

                    self.reports = successResponse.features;

                    self.status.loading = false;

                }, function (errorResponse) {

                    self.status.loading = false;

                });

            };

            self.loadPractice = function () {

                practice.$promise.then(function (successResponse) {

                    console.log('self.practice', successResponse);

                    self.practice = successResponse;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        return;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    $rootScope.page.title = self.practice.name ? self.practice.name : 'Un-named Practice';

                    /*programs will need to be redefined using project.programs*/

                    self.programs = self.practice.organization.programs;

                    self.programSummary.program_count = self.programs.length;

                    if (self.programs.length > 0 && self.currentProgram == undefined) {
                        self.currentProgram = self.programs[0];
                    }

                    self.loadReports();

                    /* 01.26.2021 : this is a check to see if a program list exists,
                                              once the db has been updated so all projects have a program list,
                                              this check will be defunct.
                                              It has been added here to enable debugging of other areas.
                                           */
                    if(self.programs[0] !== undefined) {
                        self.loadMetrics(self.practice.id, self.currentProgram.program_id);
                    }

                    self.processSetup(self.practice.setup);

//                        self.loadTags();

                    self.tags = Utility.processTags(self.practice.tags);

                    self.showElements();

                }, function (errorResponse) {

                    self.status.loading = false;

                    self.showElements();

                });

            };

            /*START STATE CALC*/

            self.processSetup = function (setup) {

                const next_action = setup.next_action;

                self.states = setup.states;

                self.next_action = next_action;

                console.log("self.states", self.states);

                console.log("self.next_action", self.next_action);
                /*
                                    switch (next_action) {
                                        case 'add_name':
                                            self.next_action_lable =    "<p>This practice needs a name. " +
                                                "Click <i class='material-icons'>edit</i> " +
                                                "to <a href='value'>edit this practice</a>" +
                                                "</p>"
                                                ;

                                            break;

                                        case 'add_type':
                                            self.next_action_lable =  String("<p> This practice needs a Practice Type. " +
                                                "Click <i class='material-icons'>edit</i> " +
                                                "to <a href='value'>edit this practice</a>" +
                                                "</p>");
                                            ;

                                            break;

                                        case 'add_geometry':
                                            self.next_action_lable =    "This practice needs a Location Geometry. " +
                                                "Click <i class='material-icons'>location_on</i> " +
                                                "to <a href='/practices/{{ page.practice.id }}/location '>edit this practice</a>" +
                                                "</p>"
                                            ;

                                            break;

                                        case 'add_targets':
                                            self.next_action_lable =    "This practice needs Metric Targets added. " +
                                                "Click <i class='material-icons'>multiline_chart</i> " +
                                                "to <a href='/practices/{{ page.practice.id }}/targets '>edit this practice</a>" +
                                                "</p>"
                                            ;

                                            break;

                                        case 'edit_targets':

                                            break;

                                        default:
                                    }

                                    console.log("self.next_action_lable",self.next_action_lable);

                 */

            };

            /*END STATE CALC*/

            self.addReading = function (measurementPeriod) {

                var newReading = new Report({
                    'measurement_period': 'Installation',
                    'report_date': new Date(),
                    'practice_id': practiceId,
                    'organization_id': self.practice.organization_id
                });

                newReading.$save().then(function (successResponse) {

                    $location.path('/reports/' + successResponse.id + '/edit');

                }, function (errorResponse) {

                    console.error('ERROR: ', errorResponse);

                });

            };

            self.loadTags = function () {

                Practice.tags({
                    id: self.practice.id
                }).$promise.then(function (successResponse) {

                    console.log('Practice.tags', successResponse);

                    successResponse.features.forEach(function (tag) {

                        if (tag.color &&
                            tag.color.length) {

                            tag.lightColor = tinycolor(tag.color).lighten(5).toString();

                        }

                    });

                    self.tags = successResponse.features;

                }, function (errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.loadModel = function () {

                Practice.model({
                    id: self.practice.id
                }).$promise.then(function (successResponse) {

                    console.log('Practice model successResponse', successResponse);

                }, function (errorResponse) {

                    console.log('Practice model errorResponse', errorResponse);

                });

            };

            $scope.loadMetrics = self.loadMetrics = function (practice_id, program_id) {

                // loop over programs to see if currentProgram is currently set.

                for (let program of self.programs) {

                    if (program.program_id === program_id) {

                        self.currentProgram = program;

                        break;
                    }

                }

                Practice.progress({
                    id: practice_id,
                }).$promise.then(function (successResponse) {

                    console.log('Practice metrics', successResponse);

                    Utility.processMetrics(successResponse.features);

                    self.metrics = Utility.groupByModel(successResponse.features);

                    console.log('self.metrics', self.metrics);

                }, function (errorResponse) {

                    console.log('Practice metrics errorResponse', errorResponse);

                });

            };

            self.showMetricModal = function (metric) {

                console.log('self.showMetricModal', metric);

                self.selectedMetric = metric;

                self.displayModal = true;

            };

            self.closeMetricModal = function () {

                self.selectedMetric = null;

                self.displayModal = false;

            };

            self.addLayers = function (arr) {

                arr.forEach(function (feature) {

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

            self.fetchLayers = function (taskId) {

                LayerService.collection({
                    program: self.practice.project.program_id,
                    sort: 'index'
                }).$promise.then(function (successResponse) {

                    console.log(
                        'self.fetchLayers --> successResponse',
                        successResponse);

                    self.addLayers(successResponse.features);

                    self.layers = successResponse.features;

                    console.log(
                        'self.fetchLayers --> self.layers',
                        self.layers);

                }, function (errorResponse) {

                    console.log(
                        'self.fetchLayers --> errorResponse',
                        errorResponse);

                });

            };

            self.toggleLayer = function (layer) {

                console.log('self.toggleLayer --> layer', layer);

                var layerId = layer.spec.id;

                var visibility = self.map.getLayoutProperty(layerId, 'visibility');

                if (visibility === 'visible') {

                    self.map.setLayoutProperty(layerId, 'visibility', 'none');

                } else {

                    self.map.setLayoutProperty(layerId, 'visibility', 'visible');

                }

            };

            self.switchMapStyle = function (styleId, index) {

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

            self.getMapOptions = function () {

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

            self.createMap = function (options) {

                if (!options) return;

                console.log('self.createMap --> Starting...');

                var tgt = document.querySelector('.map');

                console.log(
                    'self.createMap --> tgt',
                    tgt);

                console.log('self.createMap --> options', options);

                self.map = new mapboxgl.Map(options);

                self.map.on('load', function () {

                    var nav = new mapboxgl.NavigationControl();

                    self.map.addControl(nav, 'top-left');

                    var fullScreen = new mapboxgl.FullscreenControl();

                    self.map.addControl(fullScreen, 'top-left');

                    var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
                    var bbox = turf.bbox(line);
                    self.map.fitBounds(bbox, {duration: 0, padding: 40});

                    MapManager.addFeature(
                        self.map,
                        self.practice,
                        'geometry',
                        true,
                        true,
                        'practice'
                    );

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

                user.$promise.then(function (userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {
                        can_edit: false
                    };

                    self.loadPractice();

                });
            }


        });

