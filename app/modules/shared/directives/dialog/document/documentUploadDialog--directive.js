(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('documentUploadDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            '$timeout',
            '$q',
            'Dashboard',
            'Program',
            'Project',
            'Site',
            'Practice',
            'Report',
            'User',
            'Organization',
            'Media',
            'GenericFile',
            function(environment, $routeParams, $filter, $parse, $location,
                     $timeout, $q, Dashboard, Program, Project, Site, Practice,
                     Report, User, Organization, Media, GenericFile) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'featureType': '@featureType',
                        'fileInput': '@fileInput',
                        'modalDisplay': '=?',
                        'parent': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/document/documentUploadDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        var modelIdx = {
                            'practice': Practice,
                            'project': Project,
                            'report': Report,
                            'site': Site
                        };

                        scope.model = modelIdx[scope.featureType];

                        if (typeof scope.model === 'undefined') {

                            throw new Error('Un-recognized `featureType` parameter.');

                        }

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        scope.mediaManager = Media;

                        scope.mediaManager.documents = [];

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function(refresh) {

                            scope.processing = false;

                            scope.uploadComplete = false;

                            scope.uploadError = null;

                            scope.mediaManager.documents = [];

                            scope.visible = false;

                            scope.modalDisplay = {};

                            if (refresh) scope.callback();

                        };

                        scope.resetFileInput = function(element) {

                            element.value = null;

                            scope.processing = false;

                            scope.uploadComplete = false;

                        };

                        scope.hideTasks = function() {

                            scope.pendingTasks = [];

                            if (typeof scope.taskPoll !== 'undefined') {

                                $interval.cancel(scope.taskPoll);

                            }

                        };

                        scope.uploadDocument = function() {

                            console.log(
                                'documentUploadDialog:uploadDocument:mediaManager.documents:',
                                scope.mediaManager.documents
                            );

                            var input = document.getElementById(scope.fileInput);

                            scope.processing = true;

                            var documentCollection = {
                                documents: []
                            };

                            if (!Array.isArray(scope.parent.documents)) {

                                scope.parent.documents = [];

                            }

                            scope.parent.documents.forEach(function(document) {

                                documentCollection.documents.push({
                                    id: document.id
                                });

                            });

                            if (!scope.mediaManager.documents) {

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Please select a file.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                                return false;

                            }

                            scope.processing = true;

                            scope.progressMessage = 'Uploading…';

                            var savedQueries = scope.mediaManager.preupload(
                                scope.mediaManager.documents,
                                'file',
                                scope.featureType,
                                scope.parent.id,
                                'document');

                            console.log(
                                'ProjectDocumentController:saveDocument:savedQueries:',
                                savedQueries
                            );

                            $q.all(savedQueries).then(function(successResponse) {

                                console.log('Documents::successResponse', successResponse);

                                angular.forEach(successResponse, function(document) {

                                    documentCollection.documents.push({
                                        id: document.id
                                    });

                                });

                                scope.model.update({
                                    id: scope.parent.id
                                }, documentCollection).$promise.then(function(successResponse) {

                                    scope.progressMessage = 'Complete';

                                    scope.uploadComplete = true;

                                    scope.uploadError = null;

                                    $timeout(function () {

                                        scope.closeChildModal(true);

                                    }, 1500);

                                }, function(errorResponse) {

                                    console.log('errorResponse', errorResponse);

                                    scope.uploadError = errorResponse.data;

                                    scope.resetFileInput(input);

                                });

                            }, function(errorResponse) {

                                console.log('errorResponse', errorResponse);

                                scope.uploadError = errorResponse.data;

                                scope.resetFileInput(input);

                            });

                        };

                    }

                };

            }

        ]);

}());