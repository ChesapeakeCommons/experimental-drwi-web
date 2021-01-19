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
    .config([
        '$routeProvider',
        'environment',
        function($routeProvider, environment) {

            $routeProvider
                .when('/sites/:siteId', {
                    templateUrl: '/modules/components/sites/views/sites--summary.html?t=' + environment.version,
                    controller: 'SiteSummaryController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            if (Account.userObject && !Account.userObject.id) {
                                return Account.getUser();
                            }

                            return Account.userObject;

                        },
                        practices: function(Site, $route) {
                            return Site.practices({
                                id: $route.current.params.siteId
                            });
                        },
                        site: function(Site, $route) {
                            return Site.getSingle({
                                id: $route.current.params.siteId
                            });
                        }
                    }
                })
                .when('/sites/:siteId/practices', {
                    templateUrl: '/modules/components/sites/views/sitePracticeList--view.html?t=' + environment.version,
                    controller: 'SitePracticeListController',
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
                        practices: function(Site, $route) {
                            return Site.practices({
                                id: $route.current.params.siteId
                            });
                        },
                        site: function(Site, $route) {
                            return Site.getSingle({
                                id: $route.current.params.siteId
                            });
                        }
                    }
                })
                .when('/sites/:siteId/geographies', {
                    templateUrl: '/modules/components/sites/views/siteGeography--view.html?t=' + environment.version,
                    controller: 'SiteGeographyController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            if (Account.userObject && !Account.userObject.id) {
                                return Account.getUser();
                            }

                            return Account.userObject;

                        },
                        nodes: function(Site, $route) {
                            return Site.nodes({
                                id: $route.current.params.siteId
                            });
                        },
                        site: function(Site, $route) {
                            return Site.get({
                                id: $route.current.params.siteId
                            });
                        }
                    }
                })
                .when('/sites/:siteId/edit', {
                    templateUrl: '/modules/components/sites/views/sites--edit.html?t=' + environment.version,
                    controller: 'SiteEditController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            if (Account.userObject && !Account.userObject.id) {
                                return Account.getUser();
                            }

                            return Account.userObject;

                        },
                        site: function(Site, $route) {
                            return Site.get({
                                id: $route.current.params.siteId
                            });
                        }
                    }
                })
                .when('/sites/:siteId/location', {
                    templateUrl: '/modules/components/sites/views/siteLocation--view.html?t=' + environment.version,
                    controller: 'SiteLocationController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            if (Account.userObject && !Account.userObject.id) {
                                return Account.getUser();
                            }

                            return Account.userObject;

                        },
                        site: function(Site, $route) {
                            return Site.get({
                                id: $route.current.params.siteId,
                                format: 'geojson'
                            });
                        }
                    }
                })
                .when('/sites/:siteId/images', {
                    templateUrl: '/modules/components/sites/views/siteImage--view.html?t=' + environment.version,
                    controller: 'SiteImageController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            if (Account.userObject && !Account.userObject.id) {
                                return Account.getUser();
                            }

                            return Account.userObject;

                        },
                        site: function(Site, $route) {
                            return Site.get({
                                id: $route.current.params.siteId
                            });
                        }
                    }
                })
                .when('/sites/:siteId/tags', {
                    templateUrl: '/modules/components/sites/views/siteTag--view.html?t=' + environment.version,
                    controller: 'SiteTagController',
                    controllerAs: 'page',
                    resolve: {
                        user: function(Account, $rootScope, $document) {

                            $rootScope.targetPath = document.location.pathname;

                            if (Account.userObject && !Account.userObject.id) {
                                return Account.getUser();
                            }

                            return Account.userObject;

                        },
                        site: function(Site, $route) {

                            var exclude = [
                                'centroid',
                                'creator',
                                'dashboards',
                                'extent',
                                'geometry',
                                'last_modified_by',
                                'members',
                                'metric_types',
                                'partnerships',
                                'practices',
                                'practice_types',
                                'properties',
                                'targets',
                                'tasks',
                                'sites'
                            ].join(',');

                            return Site.get({
                                id: $route.current.params.siteId,
                                exclude: exclude
                            });

                        }
                    }
                })
                .when('/sites/:siteId/batch-delete', {
                    templateUrl: '/modules/components/sites/views/siteBatchDelete--view.html?t=' + environment.version,
                    controller: 'SiteBatchDeleteController',
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
                        site: function(Site, $route) {
                            return Site.get({
                                id: $route.current.params.siteId,
                                format: 'geojson'
                            });
                        }
                    }
                });

        }
    ]);