(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('practiceToolbar', [
            'environment',
            '$window',
            '$rootScope',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Practice',
            '$timeout',
            'AtlasDataManager',
            function (environment, $window, $rootScope, $routeParams, $filter,
                      $parse, $location, Practice, $timeout, AtlasDataManager) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'loadFeature': '&',
                        'modalDisplay': '=?',
                        'practice': '=?',
                        'showChildModal': '=?',
                        'showDocumentModal': '=?',
                        'showEditModal': '=?',
                        'showImageModal': '=?',
                        'targetDocument': '=?',
                        'targetImage': '=?',
                        'toolbarState': '@'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'toolbar/practice/practiceToolbar--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //

                        scope.nextAction = scope.practice.setup.next_action;

                        scope.states = scope.practice.setup.states;

                        scope.showPrompt = true;

                        //
                        // Generic helper functions.
                        //

                        function closeRoute() {

                            if (scope.practice.site !== null){

                                $location.path(scope.practice.links.site.html);

                            } else {

                                $location.path('/projects/' + scope.practice.project.id);

                            }

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.loadFeature = function() {

                            scope.loadFeature({});

                        };

                        //
                        // Generic print functionality.
                        //

                        scope.print = function() {

                            $window.print();

                        };

                        //
                        // Handling for export modal.
                        //

                        scope.toggleExportModal = function() {

                            scope.modalDisplay = {
                                export: true
                            };

                        };

                        //
                        // Handling for document modal.
                        //

                        scope.toggleDocumentModal = function() {

                            scope.modalDisplay = {
                                uploadDocument: true
                            };

                        };

                        //
                        // Handling for image modal.
                        //

                        scope.toggleImageModal = function() {

                            scope.modalDisplay = {
                                uploadImage: true
                            };

                        };

                        //
                        // Handling for report creation modal.
                        //

                        scope.presentChildModal = function() {

                            scope.modalDisplay = {
                                showChildModal: true
                            };

                            scope.type = 'report';

                        };

                        //
                        // Feature deletion.
                        //

                        scope.confirmDelete = function () {

                            scope.showDeletionDialog = !scope.showDeletionDialog;

                        };

                        scope.cancelDelete = function() {

                            scope.showDeletionDialog = false;

                        };

                        scope.deleteFeature = function () {

                            Practice.delete({
                                id: +scope.practice.id
                            }).$promise.then(function (data) {

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Successfully deleted this practice.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeRoute, 2000);

                            }).catch(function (errorResponse) {

                                console.log('scope.deleteFeature.errorResponse', errorResponse);

                                if (errorResponse.status === 409) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'There are pending tasks affecting this feature.',
                                        'prompt': 'OK'
                                    }];

                                } else if (errorResponse.status === 403) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'You don’t have permission to delete this practice.',
                                        'prompt': 'OK'
                                    }];

                                } else {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Something went wrong while attempting to delete this practice.',
                                        'prompt': 'OK'
                                    }];

                                }

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        //
                        // Close prompt
                        //

                        scope.closePrompt = function(){

                            scope.showPrompt = false;

                        }

                        //
                        // Feature copy.
                        //

                        scope.confirmCopy = function() {

                            scope.showCopyDialog = !scope.showCopyDialog;

                        };

                        scope.cancelCopy = function() {

                            scope.showCopyDialog = false;

                        };

                        scope.copyFeature = function() {

                            Practice.copy({
                                id: +scope.practice.id
                            }).$promise.then(function(data) {

                                scope.alerts.push({
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Successfully copied this practice.',
                                    'prompt': 'OK'
                                });

                                scope.cancelCopy();

                                $timeout(closeAlerts, 2000);
                                
                            }).catch(function(errorResponse) {

                                console.log('scope.copyFeature.errorResponse', errorResponse);

                                if (errorResponse.status === 409) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'There are pending tasks affecting this practice.',
                                        'prompt': 'OK'
                                    }];

                                } else if (errorResponse.status === 403) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'You don’t have permission to copy this practice.',
                                        'prompt': 'OK'
                                    }];

                                } else {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Something went wrong while attempting to copy this practice.',
                                        'prompt': 'OK'
                                    }];

                                }

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.$watch('practice', function (newVal) {

                            if (newVal) {

                                scope.atlasParams = AtlasDataManager.createURLData(newVal);

                            }

                        });

                    }

                };

            }

        ]);

}());