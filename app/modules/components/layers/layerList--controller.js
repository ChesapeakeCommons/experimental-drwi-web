(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:LayerListController
     * @description
     */
    angular.module('FieldDoc')
        .controller('LayerListController',
            function(Account, $location, $window, $timeout, $rootScope, $scope,
                $route, geographies, user, Utility, LayerService, $interval,
                Shapefile, LayerType, Task) {

                var self = this;

                self.programId = $route.current.params.programId;

                $rootScope.viewState = {
                    'layer': true
                };

                $rootScope.page = {};

                self.map = JSON.parse(JSON.stringify(MapPreview));

                console.log('self.map', self.map);

                self.status = {
                    loading: true,
                    processing: false
                };

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                    }, 50);

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

                    LayerService.delete({
                        id: obj.id
                    }).$promise.then(function(data) {

                        self.deletionTarget = null;

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this layer.',
                            'prompt': 'OK'
                        }];

                        self.geographies.splice(index, 1);

                        $timeout(closeAlerts, 2000);

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this layer.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this layer.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this layer.',
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

                self.processCollection = function(arr) {

                    arr.forEach(function(feature) {

                        if (feature.geometry !== null) {

                            feature.staticURL = self.buildStaticMapURL(feature.geometry);

                            feature.geojson = self.buildFeature(feature.geometry);

                        }

                        feature.bounds = Utility.transformBounds(feature.bounds);

                        if (feature.code !== null &&
                            typeof feature.code === 'string') {

                            feature.classification = feature.code.length;

                        }

                        console.log('feature', feature);

                    });

                };

                self.createLayer = function() {

                    $location.path('/geographies/collection/new');

                    // self.layer = new LayerService({
                    //     'program_id': self.programId,
                    //     'organization_id': $rootScope.user.organization_id
                    // });

                    // self.layer.$save(function(successResponse) {

                    //     $location.path('/geographies/' + successResponse.id + '/edit');

                    // }, function(errorResponse) {

                    //     console.error('Unable to create a new layer, please try again later.');

                    // });

                };

                self.buildFilter = function() {

                    var params = $location.search(),
                        data = {
                            t: Date.now()
                        };

                    if (self.selectedProgram &&
                        typeof self.selectedProgram.id !== 'undefined' &&
                        self.selectedProgram.id > 0) {

                        data.program = self.selectedProgram.id;

                        $location.search('program', self.selectedProgram.id);

                    } else if (params.program !== null &&
                        typeof params.program !== 'undefined') {

                        data.program = params.program;

                    } else {

                        $location.search({});

                    }

                    return data;

                };

                self.loadFeatures = function() {

                    var params = self.buildFilter();

                    LayerService.collection(params).$promise.then(function(successResponse) {

                        console.log('successResponse', successResponse);

                        for (var collection in successResponse) {

                            if (successResponse.hasOwnProperty(collection) &&
                                Array.isArray(successResponse[collection])) {

                                self.processCollection(successResponse[collection]);

                            }

                        }

                        self.featureCount = successResponse.count;

                        self.geographies = successResponse.features;

                        console.log('self.geographies', self.geographies);

                        self.showElements();

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                        self.showElements();

                    });

                };

                self.deleteCollection = function() {

                    self.batchDelete = false;

                    if (self.selectedProgram &&
                        typeof self.selectedProgram.id !== 'undefined' &&
                        self.selectedProgram.id > 0) {

                        LayerService.batchDelete({
                            program: self.selectedProgram.id
                        }).$promise.then(function(successResponse) {

                            console.log('successResponse', successResponse);

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Successfully deleted these geographies.',
                                'prompt': 'OK'
                            }];

                            $timeout(closeAlerts, 2000);

                            self.loadFeatures();

                        }).catch(function(errorResponse) {

                            console.log('self.deleteFeature.errorResponse', errorResponse);

                            if (errorResponse.status === 409) {

                                self.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Unable to delete. There are pending tasks affecting these geographies.',
                                    'prompt': 'OK'
                                }];

                            } else if (errorResponse.status === 403) {

                                self.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'You don’t have permission to delete these geographies.',
                                    'prompt': 'OK'
                                }];

                            } else {

                                self.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Something went wrong while attempting to delete these geographies.',
                                    'prompt': 'OK'
                                }];

                            }

                            $timeout(closeAlerts, 2000);

                        });

                    }

                };

                self.searchGroups = function(value) {

                    return LayerType.collection({
                        q: value
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        response.features.forEach(function(result) {

                            result.category = null;

                        });

                        return response.features.slice(0, 5);

                    });

                };

                self.loadGroups = function(value) {

                    LayerType.collection({
                        sort: 'name:desc'
                    }).$promise.then(function(response) {

                        console.log('LayerType.collection response', response);

                        response.features.forEach(function(result) {

                            result.category = null;

                        });

                        self.layerGroups = response.features;

                        // return response.features.slice(0, 5);

                    });

                };

                self.fetchTasks = function() {

                    var params = {
                        scale: 'collection',
                        scope: 'layer',
                        status: 'pending'
                    };

                    if (self.program && self.program.id) {

                        params.program = self.program.id;

                    }

                    return Task.collection(params).$promise.then(function(response) {

                        console.log('Task.collection response', response);

                        self.pendingTasks = response.features;

                        if (self.pendingTasks.length < 1) {

                            self.loadFeatures();

                            $interval.cancel(self.taskPoll);

                        }

                    });

                };

                self.hideTasks = function() {

                    self.pendingTasks = [];

                    if (typeof self.taskPoll !== 'undefined') {

                        $interval.cancel(self.taskPoll);

                    }

                    self.loadFeatures();

                };

                self.uploadCollection = function() {

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

                    if (self.fileImport) {

                        var fileData = new FormData();

                        fileData.append('file', self.fileImport[0]);

                        if (self.group) {

                            if (self.group.id) {

                                fileData.append('group', self.group.id);

                            } else if (typeof self.group === 'string') {

                                fileData.append('group', self.group);

                            }

                        }

                        if (self.program && self.program.id) {

                            fileData.append('program', self.program.id);

                        }

                        fileData.append('persist', true);

                        console.log('fileData', fileData);

                        $window.scrollTo(0, 0);

                        Shapefile.upload({}, fileData, function(successResponse) {

                            console.log('successResponse', successResponse);

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

                                self.fetchTasks();

                            }, 500);

                        }, function(errorResponse) {

                            console.log('Upload error', errorResponse);

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'The file could not be processed.',
                                'prompt': 'OK'
                            }];

                            $timeout(closeAlerts, 2000);

                        });

                    }

                };

                self.extractPrograms = function(user) {

                    var _programs = [];

                    user.programs.forEach(function(program) {

                        _programs.push(program.properties);

                    });

                    return _programs;

                };

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        self.programs = self.extractPrograms($rootScope.user);

                        if ($rootScope.user.programs.length) {

                            self.selectedProgram = $rootScope.user.programs[0];

                        }

                        self.loadGroups();

                        self.loadFeatures();

                        self.fetchTasks();

                    });

                }

            });

})();