'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationImageController',
        function(Project, Account, $location, $log, Notifications, $rootScope,
                 $route, $routeParams, user, User, Organization, SearchService, $timeout, Utility) {

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