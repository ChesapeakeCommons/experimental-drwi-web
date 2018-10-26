(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteSummaryCtrl
     * @description
     */
    angular.module('FieldDoc')
        .controller('SiteSummaryCtrl',
            function(Account, $location, $window, $timeout, Practice, project,
                $rootScope, $scope, $route, summary, nodes, user, Utility,
                Map, mapbox, leafletData, leafletBoundsHelpers, Site, Project, practices) {

                var self = this;

                $rootScope.toolbarState = {
                    'dashboard': true
                };

                $rootScope.page = {};

                self.map = Map;

                self.status = {
                    'loading': true
                };

                self.actions = {
                    print: function() {

                        $window.print();

                    },
                    saveToPdf: function() {

                        $scope.$emit('saveToPdf');

                    }
                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    // var parentPath = self.links.project.split('org')[1];

                    var parentPath = '/projects/' + self.data.project.id;

                    $location.path(parentPath);

                }

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

                    var targetCollection;

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

                    targetCollection.delete({
                        id: +self.deletionTarget.feature.properties.id
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

                //draw tools
                function addNonGroupLayers(sourceLayer, targetGroup) {
                    if (sourceLayer instanceof L.LayerGroup) {
                        sourceLayer.eachLayer(function(layer) {
                            addNonGroupLayers(layer, targetGroup);
                        });
                    } else {
                        targetGroup.addLayer(sourceLayer);
                    }
                }

                self.setGeoJsonLayer = function(data, layerGroup, clearLayers) {

                    if (clearLayers) {

                        layerGroup.clearLayers();

                    }

                    var featureGeometry = L.geoJson(data, {});

                    addNonGroupLayers(featureGeometry, layerGroup);

                };

                self.cleanName = function(string_) {
                    return Utility.machineName(string_);
                };

                summary.$promise.then(function(successResponse) {

                    console.log('self.summary', successResponse);

                    self.data = successResponse;

                    self.project = successResponse.project;

                    console.log('self.project', self.project);

                    self.site = successResponse.site;
                    // self.practices = successResponse.practices;

                    //
                    // Add rollups to the page scope
                    //
                    self.rollups = successResponse.rollups;

                    //
                    // Set the default tab to 'All'
                    //
                    self.rollups.active = 'all';

                    self.status.loading = false;

                    //
                    // Load spatial nodes
                    //

                    nodes.$promise.then(function(successResponse) {

                        console.log('self.nodes', successResponse);

                        self.nodes = successResponse;

                    }, function(errorResponse) {

                    });

                    //
                    // Load spatial nodes
                    //

                    practices.$promise.then(function(successResponse) {

                        console.log('self.practices', successResponse);

                        successResponse.features.forEach(function(feature) {

                            if (feature.geometry) {

                                var styledFeature = {
                                    "type": "Feature",
                                    "geometry": feature.geometry.geometries[0],
                                    "properties": {
                                        "marker-size": "small",
                                        "marker-color": "#00FFFFFF",
                                        "stroke": "#00555555",
                                        "stroke-opacity": 0,
                                        "stroke-width": 0,
                                        "fill": "#00555555",
                                        "fill-opacity": 0
                                    }
                                }

                                feature.geometry = styledFeature;

                                // 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/static/geojson({{ practice.geometry }})/auto/400x200@2x?access_token=pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'

                                var staticURL = 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/static/geojson(' + encodeURIComponent(JSON.stringify(styledFeature)) + ')/auto/400x200@2x?access_token=pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw';

                                feature.staticURL = staticURL;

                            }

                        });

                        self.practices = successResponse.features;

                    }, function(errorResponse) {

                    });

                    //
                    // Verify Account information for proper UI element display
                    //
                    if (Account.userObject && user) {
                        user.$promise.then(function(userResponse) {
                            $rootScope.user = Account.userObject = userResponse;

                            // self.project = project;

                            self.permissions = {
                                isLoggedIn: Account.hasToken(),
                                role: $rootScope.user.properties.roles[0].properties.name,
                                account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null,
                                can_edit: Account.canEdit(self.project)
                            };

                            $rootScope.page.title = self.site.properties.name;

                        });
                        //
                        // If a valid site geometry is present, add it to the map
                        // and track the object in `self.savedObjects`.
                        //

                        if (self.site.geometry !== null &&
                            typeof self.site.geometry !== 'undefined') {

                            leafletData.getMap('site--map').then(function(map) {

                                self.siteExtent = new L.FeatureGroup();

                                self.setGeoJsonLayer(self.site.geometry, self.siteExtent);

                                map.fitBounds(self.siteExtent.getBounds(), {
                                    // padding: [20, 20],
                                    maxZoom: 18
                                });
                            });
                            self.map.geojson = {
                                data: self.site.geometry
                            };
                        }
                    }

                }, function(errorResponse) {

                });

                self.createPractice = function() {

                    self.practice = new Practice({
                        'practice_type': 'Custom',
                        'site_id': self.site.id,
                        'project_id': self.site.properties.project.id,
                        'organization_id': self.site.properties.project.properties.organization_id
                    });

                    self.practice.$save(function(successResponse) {

                        $location.path('/practices/' + successResponse.id + '/edit');

                    }, function(errorResponse) {

                        console.error('Unable to create your practice, please try again later');

                    });

                };


            });

})();