'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OnboardingOrganizationController',
        function(Account, $location, $log, Notifications, $rootScope,
            $route, user, User, Organization, SearchService, $timeout) {

            var self = this;

            $rootScope.viewState = {
                'organization': true
            };

            self.status = {
                loading: false,
                processing: false
            };

            self.alerts = [];

            self.createAlert = false;

            function closeAlerts() {

                self.alerts = [];

            }

            self.updateRelation = function(organization) {

                var _user = new User({
                    'id': self.user.id,
                    'first_name': self.user.first_name,
                    'last_name': self.user.last_name,
                    'organization_id': organization.id
                });

                _user.$update(function(successResponse) {

                    console.log('Onboarding update user', successResponse);

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully added you to ' + organization.name + '.',
                        'prompt': 'OK'
                    }];

                    $timeout(function() {

                        Account.getUser().$promise.then(function(userResponse) {

                            Account.userObject = userResponse;

                            $location.path('/');

                        });

                    }, 2000);

                }, function(errorResponse) {

                    self.status.processing = false;

                });

            };

            self.assignOrganization = function() {

                console.log("ASSIGN")
                console.log('self.organizationSelection', self.organizationSelection);

      //          self.status.processing = true;

                if (typeof self.organizationSelection === 'string') {
                    console.log("STRING");
                    console.log(self.organizationSelection);

                     self.createAlert = true;
                  //  var _organization = new Organization({
                 //       'name': self.organizationSelection
                 //   });

           //         _organization.$save(function(successResponse) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Select an organization to join.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                //        self.updateRelation(successResponse.properties);

            //        }, function(errorResponse) {

            //            self.status.processing = false;

             //       });

                } else {
                    console.log("NOT STRING");
                    self.updateRelation(self.organizationSelection);

                }

            };

            self.searchOrganizations = function(value) {

                 self.createAlert = false;

                return SearchService.organization({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService.organization response', response);

                    response.results.forEach(function(result) {

                        result.category = null;

                    });

                    return response.results.slice(0, 5);

                });

            };

            //
            // Assign project to a scoped variable
            //
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
                        'title': 'Join an organization'
                    };

                });


            } else {

                $location.path('/logout');

            }

        });