'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationImageController',
        function(Project, Account, $location, $log, Notifications, $rootScope,
                 $route, $routeParams, user, User, Organization, SearchService,
                 $timeout, Utility, Image) {

            var self = this;

            $rootScope.viewState = {
                'organization': true
            };

            self.status = {
                loading: true,
                processing: false
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            var featureId = $routeParams.id;

            self.loadOrganization = function(organizationId) {

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;

                    self.permissions.write = successResponse.has_owner && self.permissions.write;

                    self.status.loading = false;

                    if (Array.isArray(self.feature.images)) {

                        self.feature.images.sort(function (a, b) {

                            return a.id < b.id;

                        });

                    } else {

                        self.feature.images = [];

                    }

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.status.loading = false;

                });

            };

            self.presentEditDialog = function (feature) {

                self.showEditModal = !self.showEditModal;

                self.targetImage = feature;

            };

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

                console.log('self.deleteFeature', featureType, index);

                var targetCollection;

                var requestConfig = {
                    id: +self.deletionTarget.feature.id
                };

                switch (featureType) {

                    case 'image':

                        targetCollection = Image;

                        requestConfig.target = 'organization:' + self.feature.id;

                        break;

                    default:

                        break;

                }

                Image.delete(requestConfig).$promise.then(function(data) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted ' + featureType + '.',
                        'prompt': 'OK'
                    }];

                    if (featureType === 'image') {

                        self.feature.images.splice(index, 1);

                        self.cancelDelete();

                        self.loadOrganization(featureId);

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
                            'msg': 'Unable to delete image. There are pending tasks affecting this feature.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this image.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this image.',
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

                    $rootScope.user = Account.userObject = self.user = userResponse;

                    self.permissions = {};

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Organization'
                    };

                    //
                    // Load organization data
                    //
                    if (featureId) {

                        self.loadOrganization(featureId);

                    } else {

                        self.status.loading = false;

                    }

                });


            } else {

                $location.path('/logout');

            }

        });