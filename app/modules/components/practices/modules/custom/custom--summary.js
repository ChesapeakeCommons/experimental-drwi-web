(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('CustomSummaryController', [
            'Account',
            '$location',
            '$timeout',
            '$log',
            'PracticeCustom',
            '$rootScope',
            '$route',
            '$scope',
            'Utility',
            'user',
            'Project',
            'Site',
            '$window',
            'Map',
            'mapbox',
            'leafletData',
            'leafletBoundsHelpers',
            'Practice',
            'metrics',
            'outcomes',
            'practice',
            function(Account, $location, $timeout, $log, PracticeCustom, $rootScope,
                $route, $scope, Utility, user, Project, Site, $window, Map, mapbox,
                leafletData, leafletBoundsHelpers, Practice, metrics, outcomes, practice) {

                var self = this,
                    practiceId = $route.current.params.practiceId;

                $rootScope.toolbarState = {
                    'dashboard': true
                };

                $rootScope.page = {};

                self.map = Map;

                self.status = {
                    loading: true
                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    var parentPath = '/sites/' + self.data.site.id;

                    $location.path(parentPath);

                }

                self.confirmDelete = function(obj, targetCollection) {

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

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.deleteFeature = function(featureType, index) {

                    console.log('self.deleteFeature', featureType, index);

                    var targetCollection;

                    switch (featureType) {

                        case 'report':

                            targetCollection = PracticeCustom;

                            break;

                        default:

                            targetCollection = Practice;

                            break;

                    }

                    targetCollection.delete({
                        id: +self.deletionTarget.feature.id
                    }).$promise.then(function(data) {

                        self.alerts.push({
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this ' + featureType + '.',
                            'prompt': 'OK'
                        });

                        if (index !== null &&
                            typeof index === 'number' &&
                            featureType === 'report') {

                            self.practice.properties.readings_custom.splice(index, 1);

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

                self.loadPractice = function() {

                    practice.$promise.then(function(successResponse) {

                        console.log('self.practice', successResponse);

                        self.practice = successResponse;

                        $rootScope.page.title = self.practice.properties.name ? self.practice.properties.name : 'Un-named Practice';

                        //
                        // Determine if the actions should be shown or hidden depending on
                        // whether of not this practice has planning data
                        //
                        if (self.practice.properties.has_planning_data) {

                            $rootScope.page.hideActions = false;

                        } else {

                            $rootScope.page.hideActions = true;

                        }

                        if (self.practice.geometry !== null &&
                            typeof self.practice.geometry !== 'undefined') {

                            leafletData.getMap('practice--map').then(function(map) {

                                self.practiceExtent = new L.FeatureGroup();

                                self.setGeoJsonLayer(self.practice.geometry, self.practiceExtent);

                                map.fitBounds(self.practiceExtent.getBounds(), {
                                    // padding: [20, 20],
                                    maxZoom: 18
                                });
                            });

                            self.map.geojson = {
                                data: self.practice.geometry
                            };

                        }

                        self.status.loading = false;

                    }, function(errorResponse) {



                    });

                };

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {
                            isLoggedIn: Account.hasToken(),
                            role: $rootScope.user.properties.roles[
                                0].properties.name,
                            account: ($rootScope.account &&
                                    $rootScope.account.length) ?
                                $rootScope.account[0] : null,
                            can_edit: true
                        };

                        self.loadPractice();

                        self.loadMetrics();

                        self.loadOutcomes();

                    });
                }

                self.addReading = function(measurementPeriod) {

                    var newReading = new PracticeCustom({
                        'measurement_period': 'Planning',
                        'report_date': new Date(),
                        'practice_id': practiceId,
                        'organization_id': self.practice.properties.organization_id
                    });

                    newReading.$save().then(function(successResponse) {

                        $location.path('/practices/' + practiceId +
                            '/' + successResponse.id + '/edit');

                    }, function(errorResponse) {

                        console.error('ERROR: ', errorResponse);

                    });

                };

                self.loadMetrics = function() {

                    metrics.$promise.then(function(successResponse) {

                        console.log('Project metrics', successResponse);

                        self.metrics = successResponse.features;

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                };

                self.loadOutcomes = function() {

                    outcomes.$promise.then(function(successResponse) {

                        console.log('Project outcomes', successResponse);

                        self.outcomes = successResponse;

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                };

            }
        ]);

}());