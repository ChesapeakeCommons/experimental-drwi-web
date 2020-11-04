'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProjectsController',
        function(Account, $location, $log, Project, Tag,
                 $rootScope, $scope, Site, user, mapbox,
                 $interval, $timeout, Utility, QueryParamManager) {

            var self = this;

            $rootScope.viewState = {
                'project': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Projects',
                actions: []
            };

            self.projectStatuses = [
                'all',
                'draft',
                'active',
                'complete'
            ];

            self.showModal = {};

            self.status = {
                loading: true
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 250);

            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            self.confirmDelete = function(obj) {

                self.deletionTarget = obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.deleteFeature = function(obj, index) {

                Project.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this project.',
                        'prompt': 'OK'
                    }];

                    self.projects.splice(index, 1);

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this project.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this project.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this project.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.loadProjects = function(params) {

                console.log(
                    'loadProjects:params:',
                    params
                );

                params = QueryParamManager.adjustParams(
                    params,
                    {
                        combine: 'true'
                    });

                self.queryParams = QueryParamManager.getParams();

                Project.collection(params).$promise.then(function(successResponse) {

                    successResponse.features.forEach(function(feature) {

                        if (feature.extent) {

                            feature.staticURL = Utility.buildStaticMapURL(
                                feature.extent,
                                null,
                                400,
                                200);

                        }

                    });

                    self.projects = successResponse.features;

                    self.summary = successResponse.summary;

                    self.summary.organizations.unshift({
                        id: 0,
                        name: 'All'
                    });

                    self.showElements();

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                    self.showElements();

                });

            };

            self.loadTags = function() {

                Tag.collection({}).$promise.then(function(successResponse) {

                    self.tags = successResponse.features;

                    self.tags.unshift({
                        id: 0,
                        name: 'All'
                    });

                    self.loadProjects(self.queryParams);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            };

            self.addMapPreviews = function(arr) {

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

                    localOptions.container = 'project-geography-preview-' + index;

                    var previewMap = new mapboxgl.Map(localOptions);

                    previewMap.on('load', function() {

                        interactions.forEach(function(behavior) {

                            previewMap[behavior].disable();

                        });

                        self.populateMap(previewMap, feature, 'extent');

                    });

                });

            };

            self.populateMap = function(map, feature, attribute) {

                //            console.log('self.populateMap --> feature', feature);

                if (feature[attribute] !== null &&
                    typeof feature[attribute] !== 'undefined') {

                    var bounds = turf.bbox(feature[attribute]);

                    map.fitBounds(bounds, {
                        padding: 40
                    });

                }

            };

            self.getMapOptions = function() {

                self.mapStyles = mapbox.baseStyles;

                //             console.log(
                //                 'self.createMap --> mapStyles',
                //                 self.mapStyles);

                self.activeStyle = 0;

                mapboxgl.accessToken = mapbox.accessToken;

                //            console.log(
                //                'self.createMap --> accessToken',
                //                mapboxgl.accessToken);

                self.mapOptions = JSON.parse(JSON.stringify(mapbox.defaultOptions));

                self.mapOptions.container = 'primary--map';

                self.mapOptions.style = self.mapStyles[0].url;

                return self.mapOptions;

            };

            self.toggleTable = function () {

                $rootScope.collapseSidebar = !$rootScope.collapseSidebar;

                self.viewTable = !self.viewTable;

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.user = userResponse;

                    self.permissions = {
                        isLoggedIn: Account.hasToken()
                    };

                    var programs = Utility.extractUserPrograms($rootScope.user);

                    programs.unshift({
                        id: 0,
                        name: 'All'
                    });

                    self.programs = programs;

                    //
                    // Set default query string params.
                    //

                    var existingParams = QueryParamManager.getParams();

                    QueryParamManager.setParams(
                        existingParams,
                        true);

                    //
                    // Set scoped query param variable.
                    //

                    self.queryParams = QueryParamManager.getParams();

                    //
                    // Project functionality
                    //

                    self.loadTags();

                });

            } else {

                $location.path('/logout');

            }

        });