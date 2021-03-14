(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('MembershipConfirmationController', [
            'Account',
            '$location',
            '$timeout',
            '$log',
            '$rootScope',
            '$route',
            '$window',
            'membership',
            function(Account, $location, $timeout, $log, $rootScope,
                $route, $window, membership) {

                var self = this;

                $rootScope.viewState = {
                    'membershipConfirmation': true
                };

                $rootScope.page = {};

                self.status = {
                    loading: true
                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                membership.$promise.then(function(successResponse) {

                    self.membership = successResponse;

                }).catch(function(errorResponse) {

                    $location.path('/');

                });

            }

        ]);

}());