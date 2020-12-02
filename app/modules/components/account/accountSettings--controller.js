'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('AccountSettingsController',
        function(Account, $location, $log, Notifications, $rootScope, $routeParams,
                 $route, user, User, Image, SearchService, $timeout) {

            var self = this;

            self.image = null;

            $rootScope.viewState = {
                'account': true
            };

            self.status = {
                loading: true,
                processing: false,
                image: {
                    remove: false
                }
            };

            self.alerts = [];

            self.createAlert = false;

            function closeAlerts() {

                self.alerts = [];

            }

            //
            // Assign project to a scoped variable
            //
            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                console.log("feature id not set");

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = self.user = userResponse;

                    console.log("self.user", self.user);

                    self.permissions = {};

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Profile'
                    };

                });

            } else {

                //
                // If there is not Account.userObject and no user object, then the
                // user is not properly authenticated and we should send them, at
                // minimum, back to the projects page, and have them attempt to
                // come back to this page again.
                //
                self.actions.exit();

            }

            self.actions = {

                save: function() {

                    self.status.processing = true;

                    if (self.image) {

                        var fileData = new FormData();

                        fileData.append('image', self.image);

                        Image.upload({

                        }, fileData).$promise.then(function(successResponse) {

                            console.log('successResponse', successResponse);

                            self.user.picture = successResponse.original;

                            self.updateUser();

                        });

                    } else {

                        self.updateUser();

                    }

                },
                removeImage: function () {

                    self.user.picture = null;

                    self.status.image.remove = true;

                    self.updateUser();

                }
            };

            self.updateUser = function(){

                var _user = new User({
                    'id': self.user.id,
                    'first_name': self.user.first_name,
                    'last_name': self.user.last_name,
                    'picture': self.user.picture,
                    'bio': self.user.bio,
                    'title': self.user.title
                });

                _user.$update(function(successResponse) {

                    console.log('successResponse', successResponse);

                    self.user.properties = successResponse.properties;

                    console.log('self.user.properties', self.user.properties )

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Profile updated.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Your profile could not be updated.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                });

            }

        });