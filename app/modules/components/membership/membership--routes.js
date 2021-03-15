'use strict';

/**
 * @ngdoc overview
 * @name FieldDoc
 * @description
 * # FieldDoc
 *
 * Main module of the application.
 */
angular.module('FieldDoc')
    .config(function($routeProvider, environment) {

        $routeProvider
            .when('/membership-confirmation/:targetType/:id', {
                templateUrl: '/modules/components/membership/views/membershipConfirmation--view.html?t=' + environment.version,
                controller: 'MembershipConfirmationController',
                controllerAs: 'page',
                resolve: {
                    membership: function(Membership, $route) {

                        return Membership.getConfirmed({
                            id: $route.current.params.id,
                            targetType: $route.current.params.targetType
                        });

                    }
                }
            });

    });