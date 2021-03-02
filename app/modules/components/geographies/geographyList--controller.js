(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:GeographyListController
     * @description
     */
    angular.module('FieldDoc')
        .controller('GeographyListController',
            function(Account, $location, $window, $timeout, $rootScope, $scope,
                $route, geographies, user, Utility, GeographyService,
                $interval, Shapefile, GeographyType, Task, mapbox) {

                var self = this;

                self.programId = $route.current.params.programId;

                $rootScope.viewState = {
                    'geography': true
                };

                $rootScope.page = {};

                self.showModal = {
                    category: false,
                    program: false
                };

                self.filters = {
                    category: undefined,
                    program: undefined
                };

                self.numericFilters = [
                    'category',
                    'program'
                ];

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

                    GeographyService.delete({
                        id: obj.id
                    }).$promise.then(function(data) {

                        self.deletionTarget = null;

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this geography.',
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
                                'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this geography.',
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

                self.createGeography = function() {

                    $location.path('/geographies/collection/new');

                };

                self.buildFilter = function() {

                    console.log(
                        'self.buildFilter --> Starting...');

                    var data = {
                        combine: 'true',
                        exclude_geometry: 'true'
                    };

                    for (var key in self.filters) {

                        if (self.filters.hasOwnProperty(key)) {

                            if (self.numericFilters.indexOf(key) >= 0) {

                                var filterVal = +self.filters[key];

                                if (Number.isInteger(filterVal) &&
                                    filterVal > 0) {

                                    data[key] = filterVal;

                                }

                            } else {

                                data[key] = self.filters[key];

                            }

                        }

                    }

                    $location.search(data);

                    return data;

                };

                self.loadFeatures = function(params) {

                    console.log(
                        'self.loadFeatures --> params',
                        params);

                    // var params = self.buildFilter();

                    GeographyService.collection(params).$promise.then(function(successResponse) {

                        console.log('successResponse', successResponse);

                        self.summary = successResponse.summary;

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

                    if (self.selectedProgram !== null &&
                        typeof self.selectedProgram !== 'undefined' &&
                        self.selectedProgram > 0) {

                        GeographyService.batchDelete({
                            program: self.selectedProgram
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

                    return GeographyType.collection({
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

                    GeographyType.collection({
                        sort: 'name:desc'
                    }).$promise.then(function(response) {

                        console.log('GeographyType.collection response', response);

                        var categories = [];

                        response.features.forEach(function(result) {

                            delete result.category;

                            categories.push(result);

                            // result.category = null;

                        });

                        categories.unshift({
                            id: 0,
                            name: 'All categories'
                        });

                        self.geographyGroups = categories;

                        self.filters.category = self.geographyGroups[0].id;

                        // return response.features.slice(0, 5);

                    });

                };

                self.fetchTasks = function() {

                    var params = {
                        scale: 'collection',
                        scope: 'geography',
                        status: 'pending'
                    };

                    if (self.program && self.program.id) {

                        params.program = self.program.id;

                    }

                    return Task.collection(params).$promise.then(function(response) {

                        console.log('Task.collection response', response);

                        self.pendingTasks = response.features;

                        if (self.pendingTasks.length < 1) {

                            // self.loadFeatures();

                            self.inspectSearchParams();

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

                // 
                // Map functionality
                // 

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

                        localOptions.container = 'geography-preview-' + index;

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

                            self.populateMap(previewMap, feature, null, true);

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
                // Observe internal route changes. Note that `reloadOnSearch`
                // must be set to `false`.
                // 
                // See: https://stackoverflow.com/questions/15093916
                // 

                self.inspectSearchParams = function(forceFilter) {

                    var params = $location.search();

                    console.log(
                        'self.inspectSearchParams --> params',
                        params);

                    var keys = Object.keys(params);

                    console.log(
                        'self.inspectSearchParams --> keys',
                        keys);

                    if (!keys.length || forceFilter) {

                        params = self.buildFilter();

                        console.log(
                            'self.inspectSearchParams --> params(2)',
                            params);

                    }

                    for (var key in params) {

                        if (self.filters.hasOwnProperty(key)) {

                            if (self.numericFilters.indexOf(key) >= 0) {

                                var filterVal = +params[key];

                                if (Number.isInteger(filterVal)) {

                                    self.filters[key] = filterVal;

                                }

                            } else {

                                self.filters[key] = params[key];

                            }

                        }

                    }

                    self.loadFeatures(params);

                };

                // $scope.$on('$routeUpdate', function() {

                // var params = $location.search();

                // self.inspectSearchParams();

                // });

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        var programs = Utility.extractUserPrograms($rootScope.user);

                        programs.unshift({
                            id: 0,
                            name: 'All programs'
                        });

                        self.programs = programs;

                        self.filters.program = self.programs[0].id;

                        self.loadGroups();

                        // self.loadFeatures();

                        self.fetchTasks();

                        self.inspectSearchParams();

                    });

                }

            });

})();