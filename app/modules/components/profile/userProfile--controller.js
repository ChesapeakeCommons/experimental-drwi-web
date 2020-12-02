'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('UserProfileController',
        function(Account, User, $location, $log, Notifications,
                 $rootScope, $routeParams, $route, user, Image, $timeout) {

            var self = this;

            $rootScope.viewState = {
                'organization': true
            };

            self.status = {
                loading: true
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }
            
            var featureId = $routeParams.id;

            self.getUser = function() {

                User.single({
                    id: featureId
                }).$promise.then(function(successResponse) {

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;
                    
                    if (self.feature.picture) {

                        var picture = self.feature.picture;

                        self.feature.picture = picture.replace("original", "square");

                    }

                    self.status.loading = false;

                }, function(errorResponse) {

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Could not retrieve profile.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.status.loading = false;

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
                        'title': 'Profile'
                    };

                    //
                    // Load user data
                    //
                    if (featureId) {

                        self.getUser(featureId);

                    } else {

                        self.status.loading = false;

                    }

                });


            } else {

                $location.path('/logout');

            }

        });