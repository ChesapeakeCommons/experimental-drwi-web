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
                .when('/organizations/:id/edit', {
                    templateUrl: '/modules/components/organization/views/orgEdit--view.html?t=' + environment.version,
                    controller: 'OrganizationEditViewController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account) {
                            return Account.getUser();
                        }
                    }
                })
                .when('/organizations', {
                    templateUrl: '/modules/components/organization/views/orgList--view.html?t=' + environment.version,
                    controller: 'OrganizationListController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account) {
                            return Account.getUser();
                        }
                    }
                })
                .when('/organizations/:id', {
                    templateUrl: '/modules/components/organization/views/orgProfile--view.html?t=' + environment.version,
                    controller: 'OrganizationProfileController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account) {
                            return Account.getUser();
                        }
                    }
                })
                .when('/organizations/:id/images', {
                    templateUrl: '/modules/components/organization/views/orgImage--view.html?t=' + environment.version,
                    controller: 'OrganizationImageController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account) {
                            return Account.getUser();
                        }
                    }
                });

        });

}());