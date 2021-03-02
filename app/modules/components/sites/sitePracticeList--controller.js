(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteSummaryController
     * @description
     */
    angular.module('FieldDoc')
        .controller('SitePracticeListController',
            function(Account, $location, $window, $timeout, Practice, $rootScope, $scope,
                     $route, user, Utility, site, mapbox, Site, Project, practices,
                     $interval, LayerService, MapManager,
                     Shapefile, Task, QueryParamManager) {

                var self = this;

                $rootScope.toolbarState = {
                    'dashboard': true
                };

                $rootScope.page = {};

                self.map = undefined;

                self.status = {
                    loading: true,
                    processing: false
                };

                self.print = function() {

                    $window.print();

                };

                self.presentChildModal = function(featureType) {

                    if (featureType !== 'practice') return;

                    self.showChildModal = true;

                    self.childType = featureType;

                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                        $timeout(function() {

                            if (!self.mapOptions) {

                                self.mapOptions = self.getMapOptions();

                            }

                            if (self.practices && self.practices.length) {

                                self.createStaticMapURLs(self.practices);

                            }

                        }, 50);

                    }, 50);

                };

                function closeRoute() {

                    $location.path(self.site.links.project.html);

                }
                /*DELETE LOGIC*/
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

                        case 'site':

                            targetCollection = Site;

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

                        if (index !== null &&
                            typeof index === 'number' &&
                            featureType === 'practice') {

                            self.practices.splice(index, 1);

                            self.summary.feature_count--;

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
                /*END DELETE LOGIC*/

                /*COPY LOGIC */
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

                self.cleanName = function(string_) {
                    return Utility.machineName(string_);
                };

                self.loadSite = function() {

                    site.$promise.then(function(successResponse) {

                        self.site = successResponse;

                        if (successResponse.permissions.read &&
                            successResponse.permissions.write) {

                            self.makePrivate = false;

                        } else {

                            self.makePrivate = true;

                        }

                        self.permissions = successResponse.permissions;

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = self.site.name;

                        self.project = successResponse.project;

                        //
                        // Load practices
                        //

                        self.loadPractices();

                        self.tags = Utility.processTags(self.site.tags);

                    });

                };

                self.loadPractices = function(params) {

                    console.log(
                        'loadPractices:params:',
                        params
                    );

                    params = QueryParamManager.adjustParams(
                        params,
                        {
                            id: self.site.id,
                            t: Date.now()
                        },
                        true);

                    self.queryParams = QueryParamManager.getParams();

                    Site.practices(params).$promise.then(function(successResponse) {

                        self.practices = successResponse.features;

                        self.summary = successResponse.summary;

                        self.showElements(true);

                        self.tags = Utility.processTags(self.site.tags);

                    }, function(errorResponse) {

                        self.showElements(false);

                    });

                };

                self.loadTags = function() {

                    Site.tags({
                        id: self.site.id
                    }).$promise.then(function(successResponse) {

                        console.log('Site.tags', successResponse);

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

                /*  createStaticMapUrls:
                    takes self.sites as self.practices as argument
                    iterates of self.practices
                    checks if project extent exists
                    checks if practice geometry exists, if so, calls Utility.buildStateMapURL, pass geometry
                    adds return to practices[] as staticURL property
                    if no site geometry, adds default URL to practices[].staticURL
                */
                self.createStaticMapURLs = function(arr) {

                    arr.forEach(function(feature, index) {

                        //      if (feature.properties.project.extent) {

                        if (feature.geometry != null) {

                            feature.staticURL = Utility.buildStaticMapURL(feature.geometry, 'practice', 400, 200);

                            if (feature.staticURL.length >= 4096) {
                                feature.staticURL = ['https://api.mapbox.com/styles/v1',
                                    '/mapbox/streets-v11/static/-76.4034,38.7699,3.67/400x200?access_token=',
                                    'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                                ].join('');
                            }

                            self.practices[index].staticURL = feature.staticURL;

                        } else {

                            self.practices[index].staticURL = ['https://api.mapbox.com/styles/v1',
                                '/mapbox/streets-v11/static/-76.8205,38.7069,4.46,0/400x200?access_token=',
                                'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                            ].join('');
                        }

                        //     }

                    });
                }

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

                        console.log(
                            'self.addMapPreviews --> feature, index',
                            feature,
                            index);

                        var localOptions = JSON.parse(JSON.stringify(self.mapOptions));

                        localOptions.style = self.mapStyles[0].url;

                        localOptions.container = 'practice-geography-preview-' + feature.properties.id;

                        var previewMap = new mapboxgl.Map(localOptions);

                        previewMap.on('load', function() {

                            interactions.forEach(function(behavior) {

                                previewMap[behavior].disable();

                            });

                            MapManager.addFeature(
                                previewMap,
                                feature,
                                'geometry',
                                true);

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

                self.reloadPage = function() {
                    $location.reload();
                };

                self.hideTasks = function() {

                    self.pendingTasks = [];

                    if (typeof self.taskPoll !== 'undefined') {

                        $interval.cancel(self.taskPoll);

                    }

                    $timeout(function() {

                        self.loadPractices();

                    }, 100);

                };

                self.fetchTasks = function(taskId) {

                    if (taskId &&
                        typeof taskId === 'number') {

                        return Task.get({
                            id: taskId
                        }).$promise.then(function(response) {

                            console.log('Task.get response', response);

                            if (response.status && response.status === 'complete') {

                                self.hideTasks();

                                self.uploadError = null;

                                self.fileImport = null;

                            } else if (response.status && response.status === 'failed') {

                                self.hideTasks();

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

                //
                // Verify Account information for proper UI element display
                //

                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.user = Account.userObject = userResponse;

                        self.permissions = {};

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

                        self.loadSite();

                    });

                }

            });

})();