'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeImageController', function(
        Account, Image, $location, $log, Practice,
        practice, $q, $rootScope, $route, $scope,
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

            $location.path('practices');

        };

        self.processPractice = function(data) {

            self.practice = data;

            if (data.permissions) {

                if (!data.permissions.read &&
                    !data.permissions.write) {

                    self.makePrivate = true;

                }

                self.permissions.can_edit = data.permissions.write;
                self.permissions.can_delete = data.permissions.write;

            }

            delete self.practice.organization;

            self.practiceType = data.category;

            $rootScope.page.title = self.practice.name ? self.practice.name : 'Un-named Practice';

            if (Array.isArray(self.practice.images)) {

                self.practice.images.sort(function (a, b) {

                    return a.id < b.id;

                });

            }

        };

        self.loadPractice = function() {

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
                'sites'
            ].join(',');

            Practice.get({
                id: $route.current.params.practiceId,
                exclude: exclude
            }).$promise.then(function(successResponse) {

                console.log('self.practice', successResponse);

                self.processPractice(successResponse);

                self.showElements();

            }, function(errorResponse) {

                self.showElements();

            });

        };

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

            var requestConfig = {
                id: +self.deletionTarget.feature.id
            };

            switch (featureType) {

                case 'image':

                    targetCollection = Image;

                    requestConfig.target = 'practice:' + self.practice.id;

                    break;

                default:

                    targetCollection = Practice;

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

                    self.practice.images.splice(index, 1);

                    self.cancelDelete();

                    self.loadPractice();

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

                self.loadPractice();

            });

        } else {

            $location.path('/logout');

        }

    });