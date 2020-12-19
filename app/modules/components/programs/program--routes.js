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
            .when('/programs', {
                templateUrl: '/modules/components/programs/views/programList--view.html?t=' + environment.version,
                controller: 'ProgramListController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    programs: function(Program, $route) {

                        return Program.collection({});

                    }
                }
            })
            .when('/programs/:programId', {
                templateUrl: '/modules/components/programs/views/programSummary--view.html?t=' + environment.version,
                controller: 'ProgramSummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $route, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        // $rootScope.programContext = $route.current.params.programId;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    // metrics: function(Program, $route) {
                    //     return Program.metrics({
                    //         id: $route.current.params.programId
                    //     });
                    // },
                    // outcomes: function(Program, $route) {
                    //     return Program.outcomes({
                    //         id: $route.current.params.programId
                    //     });
                    // },
                    program: function(Program, $route) {
                        return Program.getSingle({
                            id: $route.current.params.programId
                        });
                    }
                }
            })
            .when('/programs/:programId/edit', {
                templateUrl: '/modules/components/programs/views/programEdit--view.html?t=' + environment.version,
                controller: 'ProgramEditController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $route, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        // $rootScope.programContext = $route.current.params.programId;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    program: function(Program, $route) {
                        return Program.get({
                            id: $route.current.params.programId
                        });
                    }
                }
            })
            .when('/programs/:programId/tags', {
                templateUrl: '/modules/components/programs/views/programTag--view.html?t=' + environment.version,
                controller: 'ProgramTagController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $route, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        // $rootScope.programContext = $route.current.params.programId;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    program: function(Program, $route) {
                        return Program.get({
                            id: $route.current.params.programId
                        });
                    }
                }
            })
            .when('/programs/:programId/metrics', {
                templateUrl: '/modules/components/programs/views/programMetrics--view.html?t=' + environment.version,
                controller: 'ProgramMetricsController',
                controllerAs: 'page',
                reloadOnSearch: false,
                resolve: {
                    user: function(Account, $route, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    program: function(Program, $route) {
                        return Program.get({
                            id: $route.current.params.programId
                        });
                    }
                }
            })
            .when('/programs/:programId/practice-types', {
                templateUrl: '/modules/components/programs/views/programPracticeTypeList--view.html?t=' + environment.version,
                controller: 'ProgramPracticeTypeListController',
                controllerAs: 'page',
                reloadOnSearch: false,
                resolve: {
                    user: function(Account, $route, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    program: function(Program, $route) {
                        return Program.get({
                            id: $route.current.params.programId
                        });
                    }
                }
            })
            .when('/programs/:programId/practice-type/:practiceTypeId', {
                templateUrl: '/modules/components/programs/views/programPracticeType--view.html?t=' + environment.version,
                controller: 'ProgramPracticeTypeController',
                controllerAs: 'page',
                reloadOnSearch: false,
                resolve: {
                    user: function(Account, $route, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        // $rootScope.programContext = $route.current.params.programId;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    program: function(Program, $route) {
                        return Program.get({
                            id: $route.current.params.programId
                        });
                    }
                }
            })

            ;
            // .when('/programs/:programId/tags', {
            //     templateUrl: '/modules/shared/tags/views/featureTag--view.html?t=' + environment.version,
            //     controller: 'FeatureTagController',
            //     controllerAs: 'page',
            //     resolve: {
            //         user: function(Account, $route, $rootScope, $document) {

            //             $rootScope.targetPath = document.location.pathname;

            //             // $rootScope.programContext = $route.current.params.programId;

            //             if (Account.userObject && !Account.userObject.id) {
            //                 return Account.getUser();
            //             }

            //             return Account.userObject;

            //         },
            //         featureCollection: function(Program, $route) {

            //             return {
            //                 featureId: $route.current.params.programId,
            //                 name: 'program',
            //                 path: '/programs',
            //                 cls: Program
            //             }

            //         },
            //         feature: function(Program, $route) {

            //             return Program.get({
            //                 id: $route.current.params.programId
            //             });

            //         },
            //         toolbarUrl: function() {

            //             return '/templates/toolbars/program.html?t=' + environment.version;

            //         },
            //         viewState: function() {

            //             return {
            //                 'program': true
            //             };

            //         }
            //     }
            // });

    });