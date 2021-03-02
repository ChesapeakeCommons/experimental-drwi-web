(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:CountySummaryController
     * @description
     */
    angular.module('FieldDoc')
        .controller('CountySummaryController',
            function(Account, $location, $window, $timeout, $rootScope, $scope, $route,
                user, Utility, metrics, outcomes, county, mapbox, County, $interval) {

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

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                    }, 50);

                };

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

                self.loadCounty = function() {

                    county.$promise.then(function(successResponse) {

                        console.log('self.county', successResponse);

                        self.county = successResponse;

                        $rootScope.page.title = self.county.properties.name;

                        //
                        // If a valid county geometry is present, add it to the map
                        // and track the object in `self.savedObjects`.
                        //

                        if (self.county.geometry !== null &&
                            typeof self.county.geometry !== 'undefined') {

                            leafletData.getMap('county--map').then(function(map) {

                                self.countyExtent = new L.FeatureGroup();

                                self.setGeoJsonLayer(self.county.geometry, self.countyExtent);

                                self.map.bounds = Utility.transformBounds(self.county.properties.extent);

                            });

                            self.map.geojson = {
                                data: self.county.geometry
                            };

                        }

                        self.showElements();

                    });

                };

                self.loadMetrics = function() {

                    metrics.$promise.then(function(successResponse) {

                        console.log('Project metrics', successResponse);

                        successResponse.features.forEach(function(metric) {

                            var _percentComplete = +((metric.installation / metric.planning) * 100).toFixed(0);

                            metric.percentComplete = _percentComplete;

                        });

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

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        self.loadCounty();

                    });

                }

            });

})();