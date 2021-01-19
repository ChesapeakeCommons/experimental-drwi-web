(function() {

    'use strict';

    /**
     * @ngdoc
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .config(function($routeProvider, environment) {

            $routeProvider
                .when('/account', {
                    templateUrl: '/modules/components/account/views/account--view.html?t=' + environment.version,
                    controller: 'AccountController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            return Account.getUser();

                        }
                    }
                })
                .when('/account/settings', {
                    templateUrl: '/modules/components/account/views/accountEdit--view.html?t=' + environment.version,
                    controller: 'AccountSettingsController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            return Account.getUser();

                        }
                    }
                });

        });

}());