(function() {

    'use strict';

    /**
     * @ngdoc controller
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('SecurityController',
            function(Account, $location, Security, ipCookie, Notifications, $route, $rootScope, $timeout) {

                var self = this;

                self.cookieOptions = {
                    'path': '/',
                    'expires': 7
                };

                function closeAlerts() {

                    $rootScope.alerts = null;

                }

                //
                // Before showing the user the login page,
                //
                if (ipCookie('FIELDSTACKIO_SESSION')) {

                    var targetPath = $rootScope.targetPath;

                    $rootScope.targetPath = null;

                    if (targetPath &&
                        targetPath.lastIndexOf('/dashboard', 0) === 0) {

                        $location.path(targetPath);

                    } else {

                        if ($rootScope.isAdmin) {

                            $location.path('/programs');

                        } else {

                            $location.path('/projects');

                        }

                    }

                }

                self.showError = function() {

                    console.log('showError', Date.now());

                    self.login.processing = false;

                    $rootScope.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'The email or password you provided was incorrect.',
                        'prompt': 'OK'
                    }];

                    console.log('$rootScope.alerts', $rootScope.alerts);

                    $timeout(closeAlerts, 2000);

                };

                self.login = {
                    processing: false,
                    submit: function(firstTime) {

                        self.login.processing = true;

                        var credentials = new Security({
                            email: self.login.email,
                            password: self.login.password,
                        });

                        credentials.$save().then(function(successResponse) {

                            console.log('credentials.save.successResponse', successResponse);

                            //
                            // Make sure our cookies for the Session are being set properly
                            //
                            ipCookie.remove('FIELDSTACKIO_SESSION');
                            ipCookie('FIELDSTACKIO_SESSION', successResponse.access_token, self.cookieOptions);

                            //
                            // Make sure we also set the User ID Cookie, so we need to wait to
                            // redirect until we're really sure the cookie is set
                            //
                            Account.setUserId().$promise.then(function() {

                                Account.getUser().$promise.then(function(userResponse) {

                                    Account.userObject = userResponse;

                                    $rootScope.user = Account.userObject;
                                    $rootScope.isLoggedIn = Account.hasToken();
                                    $rootScope.isAdmin = Account.hasRole('admin');

                                    if ($rootScope.targetPath &&
                                        typeof $rootScope.targetPath === 'string') {

                                        var targetPath = $rootScope.targetPath;

                                        $rootScope.targetPath = null;

                                        $location.path(targetPath);

                                    } else {

                                        if ($rootScope.isAdmin) {

                                            $location.path('/programs');

                                        } else {

                                            $location.path('/projects');

                                        }

                                    }

                                });

                            });

                        }).catch(function(errorResponse) {

                            console.log('credentials.save.errorResponse', errorResponse);

                            self.showError();

                        });
                    }
                };
            });

}());