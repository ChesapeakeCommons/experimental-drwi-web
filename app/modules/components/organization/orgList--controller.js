'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationListController',
        function(Project, Account, $location, $log, Notifications, $rootScope,
                 $route, $routeParams, user, User, Organization,
                 SearchService, $timeout, Utility) {

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

            self.loadOrganization = function(organizationId, postAssigment) {

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.parseFeature(successResponse);

                    if (postAssigment) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully added you to ' + self.organizationProfile.name + '.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    }

                    self.status.loading = false;

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.status.loading = false;

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = self.user = userResponse;

                    console.log('userResponse',userResponse);

                    self.permissions = userResponse.permissions;

                    console.log(" self.permissions", self.permissions);

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Organization Profile'
                    };

                    //
                    // Load organization data
                    //

                    self.memberships = $rootScope.user.memberships;

                    self.status.loading = false;

                });


            } else {

                $location.path('/logout');

            }

        });