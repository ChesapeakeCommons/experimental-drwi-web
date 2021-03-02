'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('DashboardListController',
        function(Account, $location, $log, Notifications, $rootScope,
            $route, user, User, dashboards, $interval, $timeout, Dashboard) {

            var self = this;

            $rootScope.viewState = {
                'dashboard': true
            };

            self.status = {
                loading: true
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                }, 50);

            };

            self.confirmDelete = function(obj) {

                self.deletionTarget = obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.deleteFeature = function(obj, index) {

                Dashboard.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this dashboard.',
                        'prompt': 'OK'
                    }];

                    $timeout(function() {

                        self.alerts = [];

                    }, 2000);

                    self.dashboards.splice(index, 1);

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
                        'title': 'Dashboards'
                    };

                    //
                    // Load dashboard data
                    //

                    self.actions.dashboards();

                });


            } else {

                $location.path('/logout');

            }

            self.createDashboard = function() {

                $location.path('/dashboards/collection/new');

            };

            self.actions = {
                dashboards: function() {

                    dashboards.$promise.then(function(dashboardResponse) {

                        self.dashboards = dashboardResponse.features;

                        self.showElements();

                    });

                }
            };

        });