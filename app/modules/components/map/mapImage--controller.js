'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('MapImageController', function(
        Account, Image, $location, $log, MapInterface,
        $q, $rootScope, $route, $scope, $routeParams,
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

            self.feature = data;
            
            self.permissions = data.permissions;

            $rootScope.page.title = self.feature.name ? self.feature.name : 'Un-titled Map';

            if (Array.isArray(self.feature.images)) {

                self.feature.images.sort(function (a, b) {

                    return a.id < b.id;

                });

            }

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

                    requestConfig.target = 'map:' + self.feature.id;

                    break;

                default:

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

                    self.feature.images.splice(index, 1);

                    self.cancelDelete();

                    self.loadMapInterface();

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

        self.loadMap = function () {

            MapInterface.get({
                id: $route.current.params.id
            }).$promise.then(function(successResponse) {

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