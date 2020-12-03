'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('MapImageController', function(
        Account, Image, $location, $log, Map,
        map, $q, $rootScope, $route, $scope,
        $timeout, $interval, user) {

        var self = this;

        $rootScope.toolbarState = {
            'editImages': true
        };

        $rootScope.page = {};

        self.status = {
            loading: true,
            processing: false
        };

        self.showElements = function(delay) {

            var ms = delay || 1000;

            $timeout(function() {

                self.status.loading = false;

                self.status.processing = false;

            }, ms);

        };

        self.alerts = [];

        self.closeAlerts = function() {

            self.alerts = [];

        };

        self.closeRoute = function () {

            $location.path('maps');

        };

        self.processMap = function(data) {

            self.map = data;

            if (data.permissions) {

                if (!data.permissions.read &&
                    !data.permissions.write) {

                    self.makePrivate = true;

                }

                self.permissions.can_edit = data.permissions.write;
                self.permissions.can_delete = data.permissions.write;

            }

            delete self.map.organization;

            self.mapType = data.category;

            $rootScope.page.title = self.map.name ? self.map.name : 'Un-named Map';

            if (Array.isArray(self.map.images)) {

                self.map.images.sort(function (a, b) {

                    return a.id < b.id;

                });

            }

        };

        self.loadMap = function() {

            var exclude = [
                'centroid',
                'creator',
                'dashboards',
                'extent',
                'geometry',
                'members',
                'metric_progress',
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

            Map.get({
                id: $route.current.params.mapId,
                exclude: exclude
            }).$promise.then(function(successResponse) {

                console.log('self.map', successResponse);

                self.processMap(successResponse);

                self.showElements();

            }, function(errorResponse) {

                self.showElements();

            });

        };

        self.confirmDelete = function(obj, targetCollection) {

            console.log('self.confirmDelete', obj, targetCollection);

            if (self.deletionTarget &&
                self.deletionTarget.collection === 'map') {

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

            var requestConfig = {
                id: +self.deletionTarget.feature.id
            };

            switch (featureType) {

                case 'image':

                    targetCollection = Image;

                    requestConfig.target = 'map:' + self.map.id;

                    break;

                default:

                    targetCollection = Map;

                    break;

            }

            targetCollection.delete(requestConfig).$promise.then(function(data) {

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Successfully deleted ' + featureType + '.',
                    'prompt': 'OK'
                }];

                if (featureType === 'image') {

                    self.map.images.splice(index, 1);

                    self.cancelDelete();

                    self.loadMap();

                    $timeout(self.closeAlerts, 1500);

                } else {

                    $timeout(self.closeRoute, 1500);

                }

            }).catch(function(errorResponse) {

                console.log('self.deleteFeature.errorResponse', errorResponse);

                if (errorResponse.status === 409) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete ' + featureType + '. There are pending tasks affecting this feature.',
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

                $timeout(self.closeAlerts, 2000);

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

                self.loadMap();

            });

        } else {

            $location.path('/logout');

        }

    });