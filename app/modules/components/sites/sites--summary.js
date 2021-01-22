(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteSummaryController
     * @description
     */
    angular.module('FieldDoc')
        .controller('SiteSummaryController',
            function(Account, $location, $window, $timeout, Practice, $rootScope, $scope,
                $route, user, Utility, site, mapbox, Site, Project, practices, Organization,
                $interval, LayerService, MapManager,
                Shapefile, Task, AtlasDataManager) {

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

                self.programSummary = {
                    program_count : 0
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

                            self.createMap(self.mapOptions);

                            if (self.practices && self.practices.length) {

                                //    self.addMapPreviews(self.practices);
                                self.createStaticMapURLs(self.practices);

                            }

                        }, 500);

                    }, 500);

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
                /*END COPY LOGIC*/
                self.cleanName = function(string_) {
                    return Utility.machineName(string_);
                };

                self.loadSite = function() {

                    console.log("LOAD SITE");

                    site.$promise.then(function(successResponse) {

                        console.log("SITE RESPONSE");

                        console.log('self.site', successResponse);

                        self.site = successResponse;

                        self.atlasParams = AtlasDataManager.createURLData(self.site);

                        if (successResponse.permissions.read &&
                            successResponse.permissions.write) {

                            self.makePrivate = false;

                        } else {

                            self.makePrivate = true;

                        }

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = self.site.name;

                        self.project = successResponse.project;

                        console.log('self.project', self.project);

                        /*programs will need to be redefined using project.programs*/

                        self.loadOrganization(self.project.organization_id);

                        self.tags = Utility.processTags(self.site.tags);

                    });

                };


                /*
            START Program context switch logic
            Note: we are currently loading in Organization Programs
            This is to be replaced with
             */


                self.loadOrganization = function(organizationId) {

                    Organization.profile({
                        id: organizationId
                    }).$promise.then(function(successResponse) {

                        console.log('self.organization', successResponse);

                        self.organization = successResponse;

                        /*programs will need to be redefined using project.programs*/

                        self.programs = successResponse.programs;

                        self.programSummary.program_count = self.programs.length;

                        if(self.programs.length > 0 && self.currentProgram == undefined){
                            self.currentProgram = self.programs[0];
                        }

                        self.loadMetrics(self.site.id,self.currentProgram.program_id);

                        self.loadPractices();

                        self.status.loading = false;

                    }, function(errorResponse) {

                        console.error('Unable to load organization.');

                        self.status.loading = false;

                    });

                };

                /*
                END Program context switch logic
                 */

                self.loadPractices = function() {

                    Site.practices({
                        id: self.site.id,
                        limit: 4,
                        page: 1,
                        t: Date.now()
                    }).$promise.then(function(successResponse) {

                        self.practices = successResponse.features;

                        self.summary = successResponse.summary;

                        console.log('self.practices', successResponse);

                        self.showElements();

                      //  self.loadMetrics();

                        self.tags = Utility.processTags(self.site.tags);

                    }, function(errorResponse) {

                        self.showElements();

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

                // self.processCollection = function(arr) {

                //     arr.forEach(function(feature) {

                //         if (feature.geometry !== null) {

                //             // feature.staticURL = self.buildStaticMapURL(feature.geometry);

                //             feature.geojson = self.buildFeature(feature.geometry);

                //             feature.bounds = self.transformBounds(feature);

                //         }

                //     });

                // };

                $scope.loadMetrics = self.loadMetrics = function(site_id,program_id) {

                    // loop over programs to see if currentProgram is currently set.

                    for(let program of self.programs){

                        if (program.program_id === program_id) {

                            self.currentProgram = program;

                            break;
                        }

                    }

                    Site.progress({
                        id: site_id
                    }).$promise.then(function(successResponse) {

                        console.log('Site metrics', successResponse);

                        Utility.processMetrics(successResponse.features);

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
                        program: self.site.project.program_id,
                        sort: 'index'
                    }).$promise.then(function(successResponse) {

                        console.log(
                            'self.fetchLayers --> successResponse',
                            successResponse);

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

                        var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
                        var bbox = turf.bbox(line);
                        self.map.fitBounds(bbox, { duration: 0, padding: 40 });

                        MapManager.addFeature(
                            self.map,
                            self.site,
                            'geometry',
                            true,
                            true);

                        if (self.layers && self.layers.length) {

                            self.addLayers(self.layers);

                        } else {

                            self.fetchLayers();

                        }

                        if (self.practices && Array.isArray(self.practices)) {

                            self.practices.forEach(function(feature) {

                                MapManager.addFeature(
                                    self.map,
                                    feature,
                                    'geometry',
                                    true,
                                    false,
                                    'practice'
                                );

                            });

                        }

                    });

                };

                //
                // Begin batch import methods
                //

                self.uploadShapefile = function() {

                    /*Cast the file into an array
                    could possibly remove this with reworks
                    to the Upload directive
                    */
                    var tempFileImport = [];
                    tempFileImport.push(self.fileImport);
                    self.fileImport = tempFileImport;

                    if (!self.fileImport ||
                        !self.fileImport.length
                    ) {

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

                    fileData.append('site_id', self.site.id);

                    fileData.append('collection', true);

                    fileData.append('project_id', self.site.project_id);

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

                    }

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

                        self.loadSite();

                    });

                }

            });

})();