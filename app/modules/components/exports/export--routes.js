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
            .when('/exports', {
                templateUrl: '/modules/components/exports/views/exportList--view.html?t=' + environment.version,
                controller: 'ExportsController',
                controllerAs: 'page',
                reloadOnSearch: false,
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    }
                }
            })
            .when('/exports/:exportId', {
                templateUrl: '/modules/components/exports/views/exportSummary--view.html?t=' + environment.version,
                controller: 'ExportSummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    export: function(Export, $route) {

                        var exclude = [
                            'centroid',
                            'creator',
                            'dashboards',
                            'geometry',
                            'members',
                            'metric_types',
                            'practices',
                            'practice_types',
                            'properties',
                            'targets',
                            'tasks',
                            'sites'
                        ].join(',');

                        return Export.getSingle({
                            id: $route.current.params.exportId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/exports/:exportId/practices', {
                templateUrl: '/modules/components/exports/views/exportPracticeList--view.html?t=' + environment.version,
                controller: 'ExportPracticeListController',
                controllerAs: 'page',
                reloadOnSearch: false,
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    export: function(Export, $route) {

                        var exclude = [
                            'centroid',
                            'creator',
                            'dashboards',
                            'geometry',
                            'members',
                            'metric_types',
                            'practices',
                            'practice_types',
                            'properties',
                            'targets',
                            'tasks',
                            'sites'
                        ].join(',');

                        return Export.getSingle({
                            id: $route.current.params.exportId,
                            exclude: exclude
                        });

                    }
                }
            });

    });