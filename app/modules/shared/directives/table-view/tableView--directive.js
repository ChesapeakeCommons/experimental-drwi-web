(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('tableView', [
            'environment',
            '$window',
            '$timeout',
            '$location',
            'AnchorScroll',
            'Project',
            function (environment, $window, $timeout, $location, AnchorScroll, Project) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'featureType': '@',
                        'includeMod': '=?',
                        'index': '=?',
                        'permissions': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        console.log(
                            'tableView:attrs:',
                            attrs
                        );

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'table-view/views/',
                            // Template file
                            attrs.featureType + 'Table--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        $window.scrollTo(0, 0);

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        //
                        // Additional scope vars.
                        //

                        scope.tipManager = {};

                        scope.modalManager = {
                            action: undefined
                        };

                        scope.resetTip = function (key, projectId) {

                            var existing = scope.tipManager[key];

                            scope.tipManager = {};

                            if (existing === projectId) return;

                            if (key && projectId) {
                                scope.tipManager[key] = projectId;
                            }

                        };

                        scope.toggleActionModal = function (projectId) {

                            var existing = scope.modalManager.action;

                            scope.modalManager = {};

                            if (existing === projectId) return;

                            if (projectId) {
                                scope.modalManager.action = projectId;
                            }

                        };

                        scope.processIndex = function () {

                        };

                        scope.editProject = function (projectId) {

                            $location.path('/projects/' + projectId + '/edit');

                        };

                        scope.presentDeletionDialog = function (project) {

                            scope.project = project;

                            scope.showDeletionDialog = true;

                            scope.modalManager = {};

                        };

                        scope.presentExportDialog = function (project) {

                            scope.project = project;

                            scope.showExportDialog = true;

                            scope.modalManager = {};

                        };
                        
                        scope.archiveProject = function (project, archived) {

                            archived = archived || false;
                            
                            var data = {
                                archived: archived,
                                private: project.private ? project.private : false
                            };

                            var successMsg,
                                errorMsg;

                            if (archived) {

                                successMsg = 'Project moved to archive.';

                                errorMsg = 'Something went wrong and the project was not archived.';

                            } else {

                                successMsg = 'Project restored from archive.';

                                errorMsg = 'Something went wrong and the project was not restored from the archive.';

                            }

                            Project.update({
                                id: project.id
                            }, data).$promise.then(function(successResponse) {
                                
                                scope.callback();

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': successMsg,
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            }).catch(function(error) {

                                // Do something with the error

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': errorMsg,
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });
                            
                        };

                        scope.$watch('index', function (newVal) {

                            if (newVal) {

                                scope.processIndex();

                            }

                        });

                        scope.$on('globalClick', function (event, target) {

                            console.log(
                                'globalClick:tableView:event:',
                                event
                            );

                            console.log(
                                'globalClick:tableView:target:',
                                target
                            );

                            if (!element[0].contains(target)) {

                                scope.$apply(function () {

                                    console.log(
                                        'globalClick:tableView:event:$apply'
                                    );

                                    if (typeof scope.tipManager.created !== 'undefined' ||
                                        typeof scope.tipManager.modified !== 'undefined') {

                                        console.log(
                                            'globalClick:tableView:event:$apply:closeTip',
                                            scope.tipManager
                                        );

                                        scope.tipManager = {};

                                    }

                                    if (typeof scope.modalManager.action !== 'undefined') {

                                        console.log(
                                            'globalClick:tableView:event:$apply:closeModal',
                                            scope.modalManager
                                        );

                                        scope.modalManager = {
                                            action: undefined
                                        };

                                    }

                                });

                            }

                        });

                    }

                };

            }

        ]);

}());