'use strict';

/**
 * @ngdoc function
 * @name FieldDoc.controller:ProjectviewController
 * @description
 * # ProjectviewController
 * Controller of the FieldDoc
 */
angular.module('FieldDoc')
    .controller('ProjectSummaryController',
        function(Account, Notifications, $rootScope, Project, $routeParams,
                 $scope, $location, mapbox, Site, user, $window, $timeout,
                 Practice, project, Utility, $interval, LayerService,
                 MapManager, Shapefile, Task, QueryParamManager, AtlasDataManager) {

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

            self.presentUploadModal = function(featureType) {

                if (featureType !== 'practice' &&
                    featureType !== 'site') return;

                self.showUploadModal = true;

                self.childType = featureType;

            };

            self.presentChildModal = function(featureType) {

                if (featureType !== 'practice' &&
                    featureType !== 'site') return;

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
                        limit: 4,
                        origin: 'primary',
                        t: Date.now()
                    },
                    false);

                Project.practices(params).$promise.then(function(successResponse) {

                    self.practices = successResponse.features;

                    self.practicesSummary = successResponse.summary;

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

                        console.log("CREATE MAP");

                        $timeout(function() {

                            console.log("MAKING THE MAP");

                            if (!self.mapOptions) {

                                self.mapOptions = self.getMapOptions();

                            }

                            self.createMap(self.mapOptions);

                            if (self.sites && self.sites.length) {
                                console.log("A 1");
                                self.createStaticMapURLs(self.sites, "site", 400, 200);
                                //       self.addMapPreviews(self.sites);

                            }
                            if (self.practices && self.practices.length) {
                                console.log("A 2");
                                self.createStaticMapURLs(self.practices, "practice", 400, 200);
                                //       self.addMapPreviews(self.sites);

                            }

                        }, 50);

                    }

                }, 50);

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

            //
            // Assign project to a scoped variable
            //

            self.loadProject = function() {

                project.$promise.then(function(successResponse) {

                    console.log('self.project', successResponse);

                    var project_ = successResponse;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        self.showElements(false);

                    } else {

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        if (project_.extent) {

                            project_.staticURL = self.buildStaticMapURL(project_.extent);

                        }

                        self.project = project_;

                        self.atlasParams = AtlasDataManager.createURLData(self.project);

                        $rootScope.page.title = 'Project Summary';

                        self.loadMetrics();

                        self.loadSites();

                        self.loadArea();

                        self.loadPartnerships();

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

                    if (featureType === 'practice' ||
                        featureType === 'site') {

                        self.refreshMetricProgress();

                    }

                    if (index !== null &&
                        typeof index === 'number' &&
                        featureType === 'site') {

                        // self.sites.splice(index, 1);

                        self.loadSites();

                        self.cancelDelete();

                        $timeout(closeAlerts, 2000);

                    } else if (index !== null &&
                        typeof index === 'number' &&
                        featureType === 'practice') {

                        // self.practices.splice(index, 1);

                        self.loadPractices();

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

            /* START SITES PANEL */

            self.loadSites = function(params) {

                console.log(
                    'loadSites:params:',
                    params
                );

                params = QueryParamManager.adjustParams(
                    params,
                    {
                        id: self.project.id,
                        limit: 4,
                        t: Date.now()
                    },
                    false);

                Project.sites(params).$promise.then(function(successResponse) {

                    console.log('Project sites --> ', successResponse);

                    self.sites = successResponse.features;

                    console.log("self.sites", self.sites);

                    self.summary = successResponse.summary;

                    self.summary.organizations.unshift({
                        id: 0,
                        name: 'All organizations'
                    });

                    self.loadPractices();

                }, function(errorResponse) {

                    console.log('loadSites.errorResponse', errorResponse);

                    self.loadPractices();

                });

            };

            /* END SITES PANEL */

            //            self.processTags = function(arr) {
            //
            //                arr.forEach(function(tag) {
            //
            //                    if (tag.color &&
            //                        tag.color.length) {
            //
            //                        tag.lightColor = tinycolor(tag.color).lighten(5).toString();
            //
            //                    }
            //
            //                });
            //
            //                self.tags = arr;
            //
            //            };

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

            self.loadArea = function() {

                Project.area({
                    id: self.project.id
                }).$promise.then(function(successResponse) {

                    console.log('Project.area', successResponse);

                    self.area = successResponse.area;

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
                    program: self.project.program_id,
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

            self.refreshMetricProgress = function () {

                var progressPoll = $interval(function() {

                    self.loadMetrics();

                }, 4000);

                $timeout(function () {

                    $interval.cancel(progressPoll);

                }, 20000);

            };

            self.loadMetrics = function() {

                Project.progress({
                    id: self.project.id
                }).$promise.then(function(successResponse) {

                    console.log('Project metrics', successResponse);

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

                var program = self.project.program;

                if (program &&
                    program.centroid) {

                    if (program.hasOwnProperty('centroid')) {

                        self.mapOptions.center = program.centroid.coordinates;

                    }

                }

                return self.mapOptions;

            };

            self.createMap = function(options) {

                console.log("MAP MAP MAP");

                if (!options) return;

                console.log('self.createMap --> Starting...');

                var tgt = document.querySelector('.map');

                console.log(
                    'self.createMap --> tgt',
                    tgt);

                console.log('self.createMap --> options', options);

                self.map = new mapboxgl.Map(options);

                self.map.on('load', function() {

                    console.log("Loading Map");

                    var nav = new mapboxgl.NavigationControl();

                    self.map.addControl(nav, 'top-left');

                    var fullScreen = new mapboxgl.FullscreenControl();

                    self.map.addControl(fullScreen, 'top-left');

                    var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
                    var bbox = turf.bbox(line);
                    self.map.fitBounds(bbox, { duration: 0, padding: 40 });

                    var projectExtent = {
                        'type': 'Feature',
                        'geometry': self.project.extent,
                        'properties': {}
                    };

                    MapManager.addFeature(
                        self.map,
                        self.project.extent,
                        null,
                        false);

                    if (self.layers && self.layers.length) {

                        self.addLayers(self.layers);

                    } else {

                        self.fetchLayers();

                    }


                    /*
                       MapManager.addFeature(
                                  self.map,
                                  {
                                      "geometry": {"coordinates": [], "type": "Polygon"},
                                      "properties": {
                                              "area": 12420.8841916765,
                                              "calculated_extent": 12420.8841916765,
                                              "calculating": false,
                                              "category_id": 787,
                                              "created_on": null,
                                              "creator_id": 35,
                                              "custom_extent": null,
                                              "description": null,
                                              "id": 0,
                                              "last_modified_by_id": 35,
                                              "legacy_self_id": null,
                                              "model_inputs": null,
                                              "modified_on": null,
                                              "name": "Practice added through a site",
                                              "organization": {
                                                  "category_id": null,
                                                  "created_on": "2019-08-06T17:54:50.661715",
                                                  "creator_id": 717,
                                                  "description":null,
                                                  "email": "info@chesapeakecommons.org"
                                              },
                                              "organization_id": 190,
                                              "practice_type": "Custom",
                                              "private": false,
                                              "project": {
                                                  },
                                              "project_id": 0,
                                              "site": {},
                                              "site_id": 13206
                                         },
                                      "type": "Feature"
                                  },
                                  'geometry',
                                  true,
                                  false);
                      */
                    console.log("ADD SITES TO MAP");

                    if (self.sites.length && Array.isArray(self.sites)) {
                        console.log("There are Sites");
                        var siteCollection = {
                            'type': 'FeatureCollection',
                            'features': self.sites
                        };

                        self.sites.forEach(function(feature) {
                            console.log("adding site feature -->", feature);
                            MapManager.addFeature(
                                self.map,
                                feature,
                                'geometry',
                                true,
                                false);

                        });



                    } else {
                        console.log("no sites");
                    }

                    console.log("ADD PRACTICES TO MAP");
                    console.log("SELF.PRACTIES", self.practices);

                    if (self.practices.length && Array.isArray(self.practices)) {
                        console.log("There are Practices");

                        var practiceCollection = {
                            'type': 'FeatureCollection',
                            'features': self.practices
                        };

                        self.practices.forEach(function(feature) {
                            console.log("adding practice feature -->", feature);
                            MapManager.addFeature(

                                self.map,
                                feature,
                                'geometry',
                                true,
                                false,
                                'practice'
                            );

                        });
                    } else {
                        console.log("no practices");
                    }
                });

            };


            self.loadPartnerships = function() {

                Project.partnerships({
                    id: self.project.id
                }).$promise.then(function(successResponse) {

                    self.partnerships = successResponse.features;

                    console.log("self.partnerships", self.partnerships)

                    self.showElements();

                }, function(errorResponse) {

                    console.error('Unable to load project partnerships.');

                    self.showElements();

                });

            };

            //
            // Begin batch import methods
            //

            self.uploadShapefile = function(featureType) {

                console.log(
                    'self.uploadShapefile:featureType',
                    featureType
                );

                console.log(
                    'self.uploadShapefile:fileImport',
                    self.fileImport
                );

                /*Cast the file into an array
                could possibly remove this with reworks
                to the Upload directive
                */

                var tempFileImport = [];

                tempFileImport.push(self.fileImport);

                self.fileImport = tempFileImport;

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

                fileData.append('feature_type', featureType);

                fileData.append('collection', true);

                fileData.append('project_id', self.project.id);

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

                            self.fetchTasks(successResponse.task.id, featureType);

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

                    self.loadProject();

                });

            }

        });