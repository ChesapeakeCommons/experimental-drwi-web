(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('ProgramSummaryController', [
            'Account',
            '$location',
            '$timeout',
            '$log',
            '$rootScope',
            '$route',
            'Utility',
            'user',
            '$window',
            'mapbox',
            'Program',
            'Project',
            'program',
            'LayerService',
            'AtlasDataManager',
            function(Account, $location, $timeout, $log, $rootScope,
                $route, Utility, user, $window, mapbox, Program,
                Project, program, LayerService, AtlasDataManager) {

                var self = this;

                self.programId = $route.current.params.programId;

                $rootScope.viewState = {
                    'program': true
                };

                $rootScope.toolbarState = {
                    'dashboard': true
                };

                $rootScope.page = {};

                self.map = undefined;

                self.status = {
                    loading: true
                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    $location.path(self.program.links.site.html);

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

                        }, 50);

                    }, 50);

                };

                self.confirmDelete = function(obj, targetCollection) {

                    console.log('self.confirmDelete', obj, targetCollection);

                    if (self.deletionTarget &&
                        self.deletionTarget.collection === 'program') {

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

                    var targetCollection;

                    switch (featureType) {

                        case 'project':

                            targetCollection = Project;

                            break;

                        default:

                            targetCollection = Program;

                            break;

                    }

                    targetCollection.delete({
                        id: +self.deletionTarget.feature.id
                    }).$promise.then(function(data) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this ' + featureType + '.',
                            'prompt': 'OK'
                        }];

                        if (index !== null &&
                            typeof index === 'number' &&
                            featureType === 'report') {

                            self.program.readings_custom.splice(index, 1);

                            self.cancelDelete();

                            $timeout(closeAlerts, 2000);

                            if (index === 0) {

                                $route.reload();

                            }

                        } else {

                            $timeout(closeRoute, 2000);

                        }

                    }).catch(function(errorResponse) {

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

                self.popupTemplate = function(feature) {

                    return '<div class=\"project--popup\">' +
                        '<div class=\"title--group\">' +
                        '<div class=\"marker--title border--right\">' + feature.properties.name + '</div>' +
                        '<a href=\"projects/' + feature.properties.id + '\">' +
                        '<i class=\"material-icons\">keyboard_arrow_right</i>' +
                        '</a>' +
                        '</div>' +
                        '</div>';

                };

                self.processLocations = function(map, features) {

                    console.log(
                        'self.processLocations --> features',
                        features);

                    features.forEach(function(feature, index) {

                        if (feature.geometry &&
                            feature.geometry.coordinates) {

                            var tpl = self.popupTemplate(feature);

                            var popup = new mapboxgl.Popup()
                                .setLngLat(feature.geometry.coordinates)
                                .setHTML(tpl);

                            var markerEl = document.createElement('div');

                            markerEl.className = 'project--marker';

                            new mapboxgl.Marker(markerEl)
                                .setLngLat(feature.geometry.coordinates)
                                .setPopup(popup)
                                .addTo(map);

                        }

                    });

                };

                self.loadProgram = function() {

                    program.$promise.then(function(successResponse) {

                        console.log('self.program', successResponse);

                        self.program = successResponse;

                        self.atlasParams = AtlasDataManager.createURLData(self.program);

                        self.permissions = successResponse.permissions;

                        $rootScope.program = successResponse;

                        $rootScope.page.title = self.program.name ? self.program.name : 'Un-named Program';

                        self.status.loading = false;

                        self.loadMetrics();

                        self.loadProjects();

                        self.loadTags();

                    }, function(errorResponse) {



                    });

                };

                self.loadTags = function() {

                    Program.tags({
                        id: self.program.id
                    }).$promise.then(function(successResponse) {

                        console.log('Program.tags', successResponse);

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

                self.loadMetrics = function() {

                    Program.progress({
                        id: self.program.id
                    }).$promise.then(function(successResponse) {

                        console.log('Program metrics', successResponse);

                        Utility.processMetrics(successResponse.features);

                        if (successResponse.hasOwnProperty('timestamp')) {

                            if (successResponse.timestamp.toString().length === 10) {

                                successResponse.timestamp = successResponse.timestamp * 1000;

                            }

                            self.progressTimestamp = successResponse.timestamp;

                        }

                        self.metrics = successResponse.features;

                        self.metrics.forEach(function(metric) {

                            Utility.calcProgress(metric, true);

                        });

                        self.metrics = Utility.groupByModel(successResponse.features);

                        console.log('self.metrics', self.metrics);

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                };

                self.loadProjects = function() {

                    Program.pointLayer({
                        id: self.program.id
                    }).$promise.then(function(successResponse) {

                        console.log('Program projects', successResponse);

                        self.featureCollection = {
                            'type': 'FeatureCollection',
                            'features': successResponse.features
                        };

                        // self.processLocations(successResponse.features);

                        self.showElements();

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                        self.showElements();

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
                        program: self.program.id,
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

                self.populateMap = function(map, feature, attribute) {

                    console.log('self.populateMap --> feature', feature);

                    var geojson = attribute ? feature[attribute] : feature;

                    if (geojson !== null &&
                        typeof geojson !== 'undefined') {

                        var bounds = turf.bbox(geojson);

                        map.fitBounds(bounds, {
                            padding: 40
                        });

                        self.processLocations(map, geojson.features);

                    }

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

                    if (self.program &&
                        self.program.centroid) {

                        if (self.program.hasOwnProperty('centroid')) {

                            self.mapOptions.center = self.program.centroid.coordinates;

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

                        self.populateMap(self.map, self.featureCollection);

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

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {
                            can_edit: false
                        };

                        self.loadProgram();

                    });
                }

            }
        ]);

}());