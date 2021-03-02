'use strict';

/**
 * @ngdoc function
 * @name FieldDoc.controller:MapInterfaceviewController
 * @description
 * # MapInterfaceviewController
 * Controller of the FieldDoc
 */
angular.module('FieldDoc')
    .controller('MapSummaryController',
        function(Account, Notifications, $rootScope, MapInterface, $routeParams,
                 $scope, $location, mapbox, Site, user, $window, $timeout,
                 Utility, $interval) {

            var self = this;

            $rootScope.viewState = {
                'map': true
            };

            $rootScope.toolbarState = {
                'dashboard': true
            };

            $rootScope.page = {};

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                $location.path('/maps');

            }

            self.status = {
                loading: true
            };

            self.presentChildModal = function(featureType) {

                if (featureType !== 'practice' &&
                    featureType !== 'site') return;

                self.showChildModal = true;

                self.childType = featureType;

            };

            self.showElements = function(createMapInterface) {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 50);

            };

            //
            // Assign map to a scoped variable
            //

            self.loadMapInterface = function() {

                map.$promise.then(function(successResponse) {

                    console.log('self.map', successResponse);

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;

                    self.showElements(false);

                }).catch(function(errorResponse) {

                    console.log('loadMapInterface.errorResponse', errorResponse);

                    self.showElements(false);

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

                MapInterface.progress({
                    id: self.map.id
                }).$promise.then(function(successResponse) {

                    console.log('MapInterface metrics', successResponse);

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

            self.reloadPage = function() {
                $location.reload();
            };

            self.loadMap = function () {

                var params = {};

                if ($routeParams.id) {

                    params.id = +$routeParams.id;

                } else {

                    params = $location.search();

                }

                MapInterface.query(
                    params
                ).$promise.then(function(successResponse) {

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;

                    self.showElements();

                }, function(errorResponse) {

                    console.log('Unable to load map data.');

                    self.showElements();

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.user = $rootScope.user;

                    //
                    // Assign map to a scoped variable
                    //

                    self.loadMap();

                });

            } else {

                $location.path('/logout');

            }

        });