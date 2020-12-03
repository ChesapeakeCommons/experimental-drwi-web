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
            .when('/maps/:mapId', {
                templateUrl: '/modules/components/map/views/mapSummary--view.html?t=' + environment.version,
                controller: 'MapSummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    map: function(Map, $route) {

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
                            'type',
                            'sites'
                        ].join(',');

                        return Map.get({
                            id: $route.current.params.mapId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/maps/:mapId/edit', {
                templateUrl: '/modules/components/map/views/mapEdit--view.html?t=' + environment.version,
                controller: 'MapEditController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    map: function(Map, $route) {

                        var exclude = [
                            'centroid',
                            'creator',
                            'dashboards',
                            'extent',
                            'geometry',
                            'members',
                            'metric_types',
                            // 'partners',
                            'practices',
                            'practice_types',
                            'properties',
                            'tags',
                            'targets',
                            'tasks',
                            'type',
                            'sites'
                        ].join(',');

                        return Map.get({
                            id: $route.current.params.mapId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/maps/:mapId/images', {
                templateUrl: '/modules/components/map/views/mapImage--view.html?t=' + environment.version,
                controller: 'MapImageController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    map: function(Map, $route) {

                        var exclude = [
                            'centroid',
                            'creator',
                            'dashboards',
                            'extent',
                            'geometry',
                            'members',
                            'metric_progress',
                            'metric_types',
                            // 'partners',
                            'practices',
                            'practice_types',
                            'properties',
                            'tags',
                            'targets',
                            'tasks',
                            'type',
                            'sites'
                        ].join(',');

                        return Map.get({
                            id: $route.current.params.mapId,
                            exclude: exclude
                        });

                    }
                }
            });

    });