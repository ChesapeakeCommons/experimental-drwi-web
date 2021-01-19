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
                .when('/profile/:id', {
                    templateUrl: '/modules/components/profile/views/userProfile--view.html?t=' + environment.version,
                    controller: 'UserProfileController',
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