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
            .when('/projects', {
                templateUrl: '/modules/components/projects/views/projectsList--view.html?t=' + environment.version,
                controller: 'ProjectsController',
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
            .when('/projects/:projectId', {
                templateUrl: '/modules/components/projects/views/projectsSummary--view.html?t=' + environment.version,
                controller: 'ProjectSummaryController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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

                        return Project.getSingle({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/practices', {
                templateUrl: '/modules/components/projects/views/projectPracticeList--view.html?t=' + environment.version,
                controller: 'ProjectPracticeListController',
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
                    project: function(Project, $route) {

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

                        return Project.getSingle({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/sites', {
                templateUrl: '/modules/components/projects/views/projectSiteList--view.html?t=' + environment.version,
                controller: 'ProjectSiteListController',
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
                    project: function(Project, $route) {

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

                        return Project.getSingle({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/edit', {
                templateUrl: '/modules/components/projects/views/projectsEdit--view.html?t=' + environment.version,
                controller: 'ProjectEditController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/partnerships', {
                templateUrl: '/modules/components/projects/views/projectPartnership--view.html?t=' + environment.version,
                controller: 'ProjectPartnershipController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    },
                    partnerships: function(Project, $route) {

                        return Project.partnerships({
                            id: $route.current.params.projectId
                        });

                    }
                }
            })
            .when('/projects/:projectId/users', {
                templateUrl: '/modules/components/projects/views/projectsUsers--view.html?t=' + environment.version,
                controller: 'ProjectUsersController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

                        var exclude = [
                            'centroid',
                            'creator',
                            'dashboards',
                            'extent',
                            'geometry',
                            // 'members',
                            'metric_types',
                            'partners',
                            'practices',
                            'practice_types',
                            'properties',
                            'tags',
                            'targets',
                            'tasks',
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/documents', {
                templateUrl: '/modules/components/projects/views/projectDocument--view.html?t=' + environment.version,
                controller: 'ProjectDocumentController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/images', {
                templateUrl: '/modules/components/projects/views/projectImage--view.html?t=' + environment.version,
                controller: 'ProjectImageController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/tags', {
                templateUrl: '/modules/components/projects/views/projectTag--view.html?t=' + environment.version,
                controller: 'ProjectTagController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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
                            // 'tags',
                            'targets',
                            'tasks',
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            // .when('/projects/:projectId/tags', {
            //     templateUrl: '/modules/shared/tags/views/featureTag--view.html?t=' + environment.version,
            //     controller: 'FeatureTagController',
            //     controllerAs: 'page',
            //     resolve: {
            //         user: function(Account, $rootScope, $document) {

            //             $rootScope.targetPath = document.location.pathname;

            //             if (Account.userObject && !Account.userObject.id) {
            //                 return Account.getUser();
            //             }

            //             return Account.userObject;

            //         },
            //         featureCollection: function(Project, $route) {

            //             return {
            //                 featureId: $route.current.params.projectId,
            //                 name: 'project',
            //                 path: '/projects',
            //                 cls: Project
            //             };

            //         },
            //         feature: function(Project, $route) {

            //             var exclude = [
            //                 'centroid',
            //                 'creator',
            //                 'dashboards',
            //                 'extent',
            //                 'geometry',
            //                 'members',
            //                 'metric_types',
            //                 'partners',
            //                 'practices',
            //                 'practice_types',
            //                 'properties',
            //                 // 'tags',
            //                 'targets',
            //                 'tasks',
            //                 'type',
            //                 'sites'
            //             ].join(',');

            //             return Project.get({
            //                 id: $route.current.params.projectId,
            //                 exclude: exclude
            //             });

            //         },
            //         toolbarUrl: function() {

            //             return '/templates/toolbars/project.html?t=' + environment.version;

            //         },
            //         viewState: function() {

            //             return {
            //                 'project': true
            //             };

            //         }
            //     }
            // })
            .when('/projects/:projectId/grant', {
                templateUrl: '/modules/components/projects/views/projectGrant--view.html?t=' + environment.version,
                controller: 'ProjectGrantController',
                controllerAs: 'page',
                resolve: {
                    user: function(Account, $rootScope, $document) {

                        $rootScope.targetPath = document.location.pathname;

                        if (Account.userObject && !Account.userObject.id) {
                            return Account.getUser();
                        }

                        return Account.userObject;

                    },
                    project: function(Project, $route) {

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
                            'sites'
                        ].join(',');

                        return Project.get({
                            id: $route.current.params.projectId,
                            exclude: exclude
                        });

                    }
                }
            })
            .when('/projects/:projectId/batch-delete', {
                templateUrl: '/modules/components/projects/views/projectsBatchDelete--view.html?t=' + environment.version,
                controller: 'ProjectsBatchDeleteController',
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
                    project: function(Project, $route) {
                        return Project.get({
                            id: $route.current.params.projectId,
                            format: 'geojson'
                        });
                    },

                }
            })
            .when('/projects/:projectId/batch-practice-delete', {
                templateUrl: '/modules/components/projects/views/projectsPracticesBatchDelete--view.html?t=' + environment.version,
                controller: 'ProjectsPracticesBatchDeleteController',
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
                    project: function(Project, $route) {
                        return Project.get({
                            id: $route.current.params.projectId,
                            format: 'geojson'
                        });
                    },

                }
            });

    });