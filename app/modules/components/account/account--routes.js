(function() {

    'use strict';

    /**
     * @ngdoc
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .config(function($routeProvider, commonscloud) {

            $routeProvider
                .when('/account', {
                    templateUrl: '/modules/components/account/views/accountEdit--view.html',
                    controller: 'AccountEditViewController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account) {
                            return Account.getUser();
                        },
                        snapshots: function(Snapshot) {
                            return Snapshot.query();
                        }
                    }
                });

        });

}());