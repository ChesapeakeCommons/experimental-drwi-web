'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('SnapshotListCtrl',
        function(Account, $location, $log, Notifications, $rootScope,
            $route, user, User, snapshots, $interval, $timeout) {

            var self = this;

            $rootScope.viewState = {
                'snapshot': true
            };

            self.loading = true;

            self.fillMeter = $interval(function() {

                var tempValue = (self.progressValue || 10) * 0.2;

                if (!self.progressValue) {

                    self.progressValue = tempValue;

                } else if ((100 - tempValue) > self.progressValue) {

                    self.progressValue += tempValue;

                }

                console.log('progressValue', self.progressValue);

            }, 100);

            self.showElements = function() {

                $interval.cancel(self.fillMeter);

                self.progressValue = 100;

                $timeout(function() {

                    self.loading = false;

                }, 1000);

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

                    self.permissions = {
                        isLoggedIn: Account.hasToken(),
                        role: $rootScope.user.properties.roles[0].properties.name,
                        account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null
                    };

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Snapshots'
                    };

                    //
                    // Load snapshot data
                    //

                    self.actions.snapshots();

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

            self.createSnapshot = function() {

                $location.path('/snapshots/collection/new');

            };

            //
            //
            //
            self.status = {
                'saving': false
            };

            self.actions = {
                organizations: function() {

                    var _organizations = [];

                    angular.forEach(self.user.properties.organizations, function(_organization, _index) {
                        if (_organization.id) {
                            _organizations.push({
                                'id': _organization.id
                            });
                        } else {
                            _organizations.push({
                                'name': _organization.properties.name
                            });
                        }
                    });

                    return _organizations;
                },
                save: function() {

                    self.status.saving = true;

                    var _organizations = self.actions.organizations();

                    var _user = new User({
                        'id': self.user.id,
                        'first_name': self.user.properties.first_name,
                        'last_name': self.user.properties.last_name,
                        'organizations': _organizations
                    });

                    _user.$update(function(successResponse) {

                        self.status.saving = false;

                        $rootScope.notifications.success('Great!', 'Your account changes were saved');

                        $location.path('/account/');

                    }, function(errorResponse) {
                        self.status.saving = false;
                    });
                },
                snapshots: function() {

                    snapshots.$promise.then(function(snapshotResponse) {

                        self.snapshots = snapshotResponse.features;

                        self.showElements();

                    });

                },
                exit: function() {
                    $location.path('/projects');
                }
            };

        });