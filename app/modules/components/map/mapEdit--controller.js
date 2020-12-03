'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('MapEditController',
        function(Account, $location, $log, Map, map,
                 $rootScope, FilterStore, $route, user,
                 SearchService, $timeout, Utility, $interval) {

            var self = this;

            $rootScope.viewState = {
                'map': true
            };

            $rootScope.toolbarState = {
                'edit': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            self.showModal = {
                status: false
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 500);

            };

            self.alerts = [];

            self.closeAlerts = function() {

                self.alerts = [];

            };

            self.closeRoute = function() {

                $location.path('/maps');

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'extent',
                    'geometry',
                    'images',
                    'last_modified_by',
                    'organization',
                    'program',
                    'tags',
                    'tasks'
                ];

                var reservedProperties = [
                    'links',
                    'permissions',
                    '$promise',
                    '$resolved'
                ];

                excludedKeys.forEach(function(key) {

                    if (feature.properties) {

                        delete feature.properties[key];

                    } else {

                        delete feature[key];

                    }

                });

                reservedProperties.forEach(function(key) {

                    delete feature[key];

                });

            };

            self.saveMap = function() {

                self.status.processing = true;

                self.scrubFeature(self.map);

                var exclude = [
                    'centroid',
                    'creator',
                    'dashboards',
                    'extent',
                    'geometry',
                    'members',
                    'metric_types',
                    // 'partners',
                    'practices',
                    'practice_types',
                    'properties',
                    'tags',
                    'targets',
                    'tasks',
                    'type',
                    'sites'
                ].join(',');

                console.log("self.map --> submit", self.map);

                Map.update({
                    id: $route.current.params.mapId,
                    exclude: exclude
                }, self.map).then(function(successResponse) {

                    self.processFeature(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Map changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                }).catch(function(error) {

                    // Do something with the error

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong and the changes could not be saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

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

                    map.$promise.then(function(successResponse) {

                        self.feature = successResponse;

                        self.permissions = successResponse.permissions;

                        self.showElements();

                    }, function(errorResponse) {

                        console.log('Unable to load map data.');

                        self.showElements();

                    });

                });

            } else {

                $location.path('/logout');

            }

        });