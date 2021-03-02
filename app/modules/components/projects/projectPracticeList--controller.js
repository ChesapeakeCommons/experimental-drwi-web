'use strict';

/**
 * @ngdoc function
 * @name FieldDoc.controller:ProjectviewController
 * @description
 * # ProjectviewController
 * Controller of the FieldDoc
 */
angular.module('FieldDoc')
    .controller('ProjectPracticeListController',
        function(Account, Notifications, $rootScope, Project, $routeParams,
                 $scope, $location, mapbox, user, $window, $timeout,
                 Practice, project, Utility, $interval, LayerService,
                 MapManager, Task, QueryParamManager) {

            var self = this;

            $rootScope.viewState = {
                'project': true
            };

            $rootScope.toolbarState = {
                'dashboard': true
            };

            $rootScope.page = {};

            self.map = undefined;

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                $location.path('/projects');

            }

            self.status = {
                loading: true
            };

            self.print = function() {

                $window.print();

            };

            self.presentChildModal = function(featureType) {

                if (featureType !== 'practice') return;

                self.showChildModal = true;

                self.childType = featureType;

            };

            /* START PRACTICES PANEL */

            self.loadPractices = function(params) {

                console.log(
                    'loadPractices:params:',
                    params
                );

                params = QueryParamManager.adjustParams(
                    params,
                    {
                        id: self.project.id,
                        t: Date.now()
                    },
                    true);

                self.queryParams = QueryParamManager.getParams();

                Project.practices(params).$promise.then(function(successResponse) {

                    self.practices = successResponse.features;

                    self.summary = successResponse.summary;

                    self.showElements(true);

                }, function(errorResponse) {

                    self.showElements(false);

                });

            };

            /* END PRACTICES PANEL */

            self.showElements = function(createMap) {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                    if (createMap) {

                        $timeout(function() {

                            if (!self.mapOptions) {

                                self.mapOptions = self.getMapOptions();

                            }

                            if (self.practices && self.practices.length) {

                                self.createStaticMapURLs(
                                    self.practices, "practice", 400, 200);

                            }

                        }, 50);

                    }

                }, 50);

            };

            //
            // Assign project to a scoped variable
            //

            self.loadProject = function() {

                project.$promise.then(function(successResponse) {

                    console.log('self.project', successResponse);

                    self.permissions = successResponse.permissions;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        self.showElements(false);

                    } else {

                        self.project = successResponse;

                        $rootScope.page.title = 'Project Practices';

                        self.loadPractices();

                    }

                    self.tags = Utility.processTags(self.project.tags);

                }).catch(function(errorResponse) {

                    console.log('loadProject.errorResponse', errorResponse);

                    self.showElements(false);

                });

            };

            /*START DELETE LOGIC*/

            self.confirmDelete = function(obj, targetCollection) {

                console.log('self.confirmDelete', obj, targetCollection);

                if (self.deletionTarget &&
                    self.deletionTarget.collection === 'project') {

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

                var targetCollection,
                    targetId;

                switch (featureType) {

                    case 'practice':

                        targetCollection = Practice;

                        break;

                    default:

                        targetCollection = Project;

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

                    if (featureType === 'practice' ||
                        featureType === 'site') {

                        self.refreshMetricProgress();

                    }

                    if (index !== null &&
                        typeof index === 'number' &&
                        featureType === 'site') {

                        self.sites.splice(index, 1);

                        self.cancelDelete();

                        $timeout(closeAlerts, 2000);

                    } else if (index !== null &&
                        typeof index === 'number' &&
                        featureType === 'practice') {

                        self.practices.splice(index, 1);

                        self.summary.feature_count--;

                        self.cancelDelete();

                        $timeout(closeAlerts, 2000);

                    } else {
                        console.log("CLOSE ROUTE");
                        $timeout(closeRoute, 2000);

                    }

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.deletionTarget.feature.name + '”. There are pending tasks affecting this ' + featureType + '.',
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

            self.confirmCopy = function(obj, targetCollection) {

                console.log('self.confirmCopy', obj, targetCollection);

                if (self.copyTarget &&
                    self.copyTarget.collection === 'project') {

                    self.cancelCopy();

                } else {

                    self.copyTarget = {
                        'collection': targetCollection,
                        'feature': obj
                    };

                }

            };

            self.cancelCopy = function() {

                self.copyTarget = null;

            };

            self.copyFeature = function(featureType, index) {

                var targetCollection,
                    targetId;

                switch (featureType) {

                    case 'practice':

                        targetCollection = Practice;

                        break;

                    case 'site':

                        targetCollection = Site;

                        break;

                    default:

                        targetCollection = Project;

                        break;

                }

                if (self.copyTarget.feature.properties) {

                    targetId = self.copyTarget.feature.properties.id;

                } else {

                    targetId = self.copyTarget.feature.id;

                }

                Practice.copy({
                    id: +targetId
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully copied this ' + featureType + '.',
                        'prompt': 'OK'
                    });

                    console.log("COPIED PRACTICE DATA", data)
                    console.log("self.practices-->", self.practices)

                    if (typeof index === 'number' &&
                        featureType === 'practice') {

                        //   var practice = angular.toJSON(data);

                        data.properties = data;

                        self.practices.unshift(data);

                        if (self.practices.length > self.limit) {
                            self.practices.pop();
                        }

                        self.createStaticMapURLs(self.practices, "practice");

                        self.cancelCopy();

                        $timeout(closeAlerts, 2000);

                    } else {


                        $timeout(closeRoute, 2000);

                    }

                }).catch(function(errorResponse) {

                    console.log('self.copyFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to copy “' + self.copyTarget.feature.name + '”. There are pending tasks affecting this ' + featureType + '.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to copy this ' + featureType + '.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to copy this ' + featureType + '.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };
            /*END COPY LOGIC*/

            self.loadTags = function() {

                Project.tags({
                    id: self.project.id
                }).$promise.then(function(successResponse) {

                    console.log('Project.tags', successResponse);

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

            self.processCollection = function(arr) {

                arr.forEach(function(feature) {

                    if (feature.geometry !== null) {

                        feature.geojson = self.buildFeature(feature.geometry);

                        feature.bounds = turf.bbox(feature.geometry);

                    }

                });

            };

            /*
            createStaticMapUrls:
                takes self.sites as self.sites as argument
                iterates of self.sites
                checks if project extent exists
                checks if site geometry exists, if so, calls Utility.buildStateMapURL, pass geometry
                adds return to site[] as staticURL property
                if no site geometry, adds default URL to site[].staticURL

                branch : FD_489-turf.simplify 2020.07.28
            */
            self.createStaticMapURLs = function(arr, feature_type) {

                console.log("createStaticMapURLS -> arr", arr)

                arr.forEach(function(feature, index) {

                    if (feature.geometry != null) {

                        console.log("THUMB", feature);

                        feature.staticURL = Utility.buildStaticMapURL(
                            feature.geometry,
                            feature_type,
                            400,
                            200);

                        if (feature.staticURL.length >= 4096) {

                            feature.staticURL = ['https://api.mapbox.com/styles/v1',
                                '/mapbox/streets-v11/static/-76.4034,38.7699,3.67/400x200?access_token=',
                                'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                            ].join('');
                        }

                        console.log('feature.staticURL', feature.staticURL);

                        if (feature_type == "site") {

                            self.sites[index].staticURL = feature.staticURL;

                            console.log("self.sites" + index + ".staticURL", self.sites[index].staticURL);

                        }
                        if (feature_type == "practice") {
                            self.practices[index].staticURL = feature.staticURL;

                            console.log("self.practices" + index + ".staticURL", self.practices[index].staticURL);

                        }

                    } else {

                        if (feature_type == "site") {
                            self.sites[index].staticURL = ['https://api.mapbox.com/styles/v1',
                                '/mapbox/streets-v11/static/-76.8205,38.7069,4.46,0/400x200?access_token=',
                                'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                            ].join('');


                        }
                        if (feature_type == "practice") {
                            self.practices[index].staticURL = ['https://api.mapbox.com/styles/v1',
                                '/mapbox/streets-v11/static/-76.8205,38.7069,4.46,0/400x200?access_token=',
                                'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                            ].join('');

                        }

                    }

                    //    }else{
                    //      console.log("A 7");
                    //   }

                });

            }

            /*
            addMapPreviews:
                this func may now be defunct - review needed...
            */
            self.addMapPreviews = function(arr) {

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

                    console.log(
                        'self.addMapPreviews --> feature, index',
                        feature,
                        index);

                    var localOptions = JSON.parse(JSON.stringify(self.mapOptions));

                    localOptions.style = self.mapStyles[0].url;

                    localOptions.container = 'site-geography-preview-' + feature.properties.id;

                    var previewMap = new mapboxgl.Map(localOptions);

                    previewMap.on('load', function() {

                        interactions.forEach(function(behavior) {

                            previewMap[behavior].disable();

                        });

                        console.log(
                            'self.addMapPreviews --> ',
                            'Add feature to map preview.');

                        console.log(
                            'self.addMapPreviews --> previewMap',
                            previewMap);

                        console.log(
                            'self.addMapPreviews --> feature',
                            feature);

                        MapManager.addFeature(previewMap, feature, 'geometry', true);

                    });

                });

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

                var program = self.project.program;

                if (program &&
                    program.centroid) {

                    if (program.hasOwnProperty('centroid')) {

                        self.mapOptions.center = program.centroid.coordinates;

                    }

                }

                return self.mapOptions;

            };

            self.hideTasks = function(featureType) {

                self.pendingTasks = [];

                if (typeof self.taskPoll !== 'undefined') {

                    $interval.cancel(self.taskPoll);

                }

                if (featureType === 'practice') {

                    $timeout(function() {

                        self.loadPractices();

                    }, 100);

                } else {

                    $timeout(function() {

                        self.loadSites();

                    }, 100);

                }

            };

            self.fetchTasks = function(taskId, featureType) {

                if (taskId &&
                    typeof taskId === 'number') {

                    return Task.get({
                        id: taskId
                    }).$promise.then(function(response) {

                        console.log('Task.get response', response);

                        if (response.status && response.status === 'complete') {

                            self.hideTasks(featureType);

                            self.uploadError = null;

                            self.fileImport = null;

                        } else if (response.status && response.status === 'failed') {

                            self.hideTasks(featureType);

                            self.uploadError = {
                                message: response.error
                            };

                            self.fileImport = null;

                        }

                    });

                } else {

                    //

                }

            };

            //
            // End batch import methods
            //

            self.reloadPage = function() {
                $location.reload();
            };

            //
            // Verify Account information for proper UI element display
            //

            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.user = Account.userObject = userResponse;

                    self.permissions = {
                        can_edit: false
                    };

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

                    self.loadProject();

                });

            }

        });