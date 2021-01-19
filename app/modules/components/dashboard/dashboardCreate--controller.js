'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('DashboardCreateController',
        function(Account, $location, $log, Dashboard, $rootScope, $route, user) {

        var self = this;

        $rootScope.viewState = {
            'dashboard': true
        };

        $rootScope.page = {};

        self.dashboard = {};

        //
        // Verify Account information for proper UI element display
        //
        if (Account.userObject && user) {

            user.$promise.then(function(userResponse) {

                $rootScope.user = Account.userObject = userResponse;

                self.permissions = {};

                //
                // Setup page meta data
                //
                $rootScope.page = {
                    'title': 'Create Dashboard'
                };

            });

        }

        self.saveDashboard = function() {

            var newFeature = new Dashboard(self.dashboard)

            newFeature.$save().then(function(response) {

                $location.path('/dashboards/' + response.id + '/edit');

            }).then(function(error) {

                console.log('Unable to create dashboard.');

            });

        };

    });