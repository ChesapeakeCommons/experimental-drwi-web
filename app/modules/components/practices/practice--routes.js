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
            .when('/practices/:practiceId', {
                templateUrl: '/modules/components/practices/views/summary--view.html?t=' + environment.version,
                controller: 'CustomSummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    practice: function(Practice, $route) {
                        return Practice.getSingle({
                            id: $route.current.params.practiceId
                        });
                    }
                }
            })
            .when('/reports/:reportId', {
                redirectTo: '/reports/:reportId/edit'
            })
            .when('/reports/:reportId/edit', {
                templateUrl: '/modules/components/practices/views/edit--view.html?t=' + environment.version,
                controller: 'ReportEditController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    report: function(Report, $route) {
                        return Report.get({
                            id: $route.current.params.reportId
                        });
                    },
                    report_metrics: function(Report, $route) {
                        return Report.metrics({
                            id: $route.current.params.reportId
                        });
                    }
                }
            })
            .when('/practices/:practiceId/edit', {
                templateUrl: '/modules/components/practices/views/practiceEdit--view.html?t=' + environment.version,
                controller: 'PracticeEditController',
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
                    site: function(Practice, $route) {

                        return Practice.site({
                            id: $route.current.params.practiceId
                        });

                    },
                    practice: function(Practice, $route) {

                        return Practice.get({
                            id: $route.current.params.practiceId
                        });

                    }
                }
            })
            .when('/practices/:practiceId/location', {
                templateUrl: '/modules/components/practices/views/practiceLocation--view.html?t=' + environment.version,
                controller: 'PracticeLocationController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    site: function(Practice, $route) {
                        return Practice.site({
                            id: $route.current.params.practiceId
                        });
                    },
                    practice: function(Practice, $route) {
                        return Practice.get({
                            id: $route.current.params.practiceId
                        //    format: 'geojson'
                        });
                    }
                }
            })
            .when('/practices/:practiceId/images', {
                templateUrl: '/modules/components/practices/views/practiceImage--view.html?t=' + environment.version,
                controller: 'PracticeImageController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    site: function(Practice, $route) {
                        return Practice.site({
                            id: $route.current.params.practiceId
                        });
                    },
                    practice: function(Practice, $route) {
                        return Practice.get({
                            id: $route.current.params.practiceId
                        });
                    }
                }
            })
            .when('/practices/:practiceId/partnerships', {
                templateUrl: '/modules/components/practices/views/practicePartnership--view.html?t=' + environment.version,
                controller: 'PracticePartnershipController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    practice: function(Practice, $route) {

                        var exclude = [
                            'centroid',
                            'creator',
                            'dashboards',
                            'extent',
                            'geometry',
                            'members',
                            'metric_types',
                            'practices',
                            'practice_types',
                            'properties',
                            'tags',
                            'targets',
                            'tasks',
                            'sites'
                        ].join(',');

                        return Practice.get({
                            id: $route.current.params.practiceId,
                            exclude: exclude
                        });

                    },
                    partnerships: function(Practice, $route) {

                        return Practice.partnerships({
                            id: $route.current.params.practiceId
                        });

                    }
                }
            })
            .when('/practices/:practiceId/tags', {
                templateUrl: '/modules/components/practices/views/practiceTag--view.html?t=' + environment.version,
                controller: 'PracticeTagController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    practice: function(Practice, $route) {

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

                        return Practice.get({
                            id: $route.current.params.practiceId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/practices/:practiceId/model-data', {
                templateUrl: '/modules/components/practices/views/practiceModelData--view.html?t=' + environment.version,
                controller: 'PracticeModelDataController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    practice: function(Practice, $route) {
                        return Practice.get({
                            'id': $route.current.params.practiceId
                        });
                    }
                }
            })
            .when('/practices/:practiceId/legacy-data', {
                templateUrl: '/modules/components/practices/views/practiceLegacyData--view.html?t=' + environment.version,
                controller: 'PracticeLegacyDataController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    practice: function(Practice, $route) {
                        return Practice.get({
                            'id': $route.current.params.practiceId
                        });
                    }
                }
            })
            .when('/practices/:practiceId/targets', {
                templateUrl: '/modules/components/practices/views/practiceTarget--view.html?t=' + environment.version,
                controller: 'PracticeTargetController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    }
                }
            });

    });