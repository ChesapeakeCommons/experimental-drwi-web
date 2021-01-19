'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('AccountController',
        function(Account, User, $location, $log, Notifications,
                 $rootScope, $routeParams, $route, user, Image, $timeout) {

            var self = this;

            $rootScope.viewState = {
                'account': true
            };

            self.status = {
                loading: true
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            self.getAccessLogs = function() {

                User.securityLog().$promise.then(function(successResponse) {

                    self.feature = successResponse;

                    self.logs = successResponse.features;

                    self.status.processing = false;

                }, function(errorResponse) {

                    self.status.processing = false;

                    $timeout(closeAlerts, 2000);

                    self.status.loading = false;

                });

            };

            self.getUser = function() {

                User.me().$promise.then(function(successResponse) {

                    self.feature = successResponse;

                    if (Array.isArray(self.feature.images)) {

                        self.feature.picture = self.feature.images[0].square;

                    } else if (self.feature.picture) {

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

                    self.getUser();

                    self.getAccessLogs();

                });


            } else {

                $location.path('/logout');

            }

        });