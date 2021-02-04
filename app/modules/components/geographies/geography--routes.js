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
            /*
            .when('/geographies', {
                templateUrl: '/modules/components/geographies/views/geographyList--view.html?t=' + environment.version,
                controller: 'GeographyListController',
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
                    geographies: function(Program, $route, $rootScope, $location) {

                        // $location.search({});

                        return [];

                    }
                }
            })
            */
            /*
            .when('/geographies/collection/new', {
                templateUrl: '/modules/components/geographies/views/geographyCreate--view.html?t=' + environment.version,
                controller: 'GeographyCreateController',
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
                    geographies: function(Program, $route, $rootScope, $location) {

                        $location.search({});

                        return [];

                    }
                }
            })
            */
            .when('/geographies/:geographyId', {
                templateUrl: '/modules/components/geographies/views/geographySummary--view.html?t=' + environment.version,
                controller: 'GeographySummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    // metrics: function(GeographyService, $route) {

                    //     return {};

                    //     // return GeographyService.metrics({
                    //     //     id: $route.current.params.geographyId
                    //     // });

                    // },
                    // outcomes: function(GeographyService, $route) {

                    //     return {};

                    //     // return GeographyService.outcomes({
                    //     //     id: $route.current.params.geographyId
                    //     // });

                    // },
                    geography: function(GeographyService, $route) {

                        var exclude = [
                            'creator',
                            'intersections',
                            'metric_progress',
                            'practices',
                            'simple_geometry',
                            'targets',
                            'tasks'
                        ].join(',');

                        return GeographyService.getSingle({
                            id: $route.current.params.geographyId,
                            exclude: exclude
                        });

                    }
                }
            })
            /*
            .when('/geographies/:geographyId/edit', {
                templateUrl: '/modules/components/geographies/views/geographyEdit--view.html?t=' + environment.version,
                controller: 'GeographyEditController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    geography: function(GeographyService, $route) {

                        return GeographyService.get({
                            id: $route.current.params.geographyId
                        });

                    }
                }
            })
            */
            /*
            .when('/geographies/:geographyId/location', {
                templateUrl: '/modules/components/geographies/views/geographyLocation--view.html?t=' + environment.version,
                controller: 'GeographyLocationController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    geography: function(GeographyService, $route) {

                        return GeographyService.get({
                            id: $route.current.params.geographyId
                        });

                    }
                }
            })
            */
            /*
            .when('/geographies/:geographyId/location', {
                templateUrl: '/modules/components/geographies/views/geographyLocation--view.html?t=' + environment.version,
                controller: 'GeographyLocationController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    geography: function(GeographyService, $route) {

                        return GeographyService.get({
                            id: $route.current.params.geographyId
                        });

                    }
                }
            })
            */
            .when('/geographies/:geographyId/tags', {
                templateUrl: '/modules/shared/tags/views/featureTag--view.html?t=' + environment.version,
                controller: 'FeatureTagController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    featureCollection: function(GeographyService, $route) {

                        return {
                            featureId: $route.current.params.geographyId,
                            name: 'geography',
                            path: '/geographies',
                            cls: GeographyService
                        };

                    },
                    feature: function(GeographyService, $route) {

                        return GeographyService.get({
                            id: $route.current.params.geographyId
                        });

                    },
                    toolbarUrl: function() {

                        return '/templates/toolbars/geography.html?t=' + environment.version;

                    },
                    viewState: function() {

                        return {
                            'geography': true
                        };

                    }
                }
            })

            .when('/geographies/:geographyId/targets', {
                templateUrl: '/modules/components/geographies/views/geographyTarget--view.html?t=' + environment.version,
                controller: 'GeographyTargetController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    geography: function(GeographyService, $route) {

                        return {};

                        // return GeographyService.get({
                        //     id: $route.current.params.geographyId,
                        //     exclude: 'geometry,properties,type'
                        // });

                    }
                }
            });

    });