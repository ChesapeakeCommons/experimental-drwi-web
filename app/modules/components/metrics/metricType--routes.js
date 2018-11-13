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
            .when('/programs/:programId/metric-types', {
                templateUrl: '/modules/components/metrics/views/metricTypeList--view.html?t=' + environment.version,
                controller: 'MetricTypeListController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    metricTypes: function(Program, $route) {

                        return Program.metricTypes({
                            id: $route.current.params.programId
                        });

                    }
                }
            })
            .when('/metric-types/:metricId', {
                templateUrl: '/modules/components/metrics/views/metricTypeSummary--view.html?t=' + environment.version,
                controller: 'MetricSummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    metrics: function(MetricType, $route) {
                        return MetricType.metrics({
                            id: $route.current.params.metricId
                        });
                    },
                    outcomes: function(MetricType, $route) {
                        return MetricType.outcomes({
                            id: $route.current.params.metricId
                        });
                    },
                    metric: function(MetricType, $route) {
                        return MetricType.get({
                            id: $route.current.params.metricId
                        });
                    }
                }
            })
            .when('/metric-types/:metricId/edit', {
                templateUrl: '/modules/components/metrics/views/metricTypeEdit--view.html?t=' + environment.version,
                controller: 'MetricTypeEditController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    metric: function(MetricType, $route) {

                        return MetricType.get({
                            id: $route.current.params.metricId
                        });
                        
                    }
                }
            });

    });