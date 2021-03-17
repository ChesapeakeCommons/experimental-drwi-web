(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('imageUploadDialog', [
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
            'Image',
            function(environment, $routeParams, $filter, $parse, $location,
                     $timeout, $q, Dashboard, Program, Project, Site, Practice,
                     Report, User, Organization, Media, Image) {
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
                            'dialog/image/imageUploadDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        var modelIdx = {
                            'dashboard': Dashboard,
                            'organization': Organization,
                            'practice': Practice,
                            'program': Program,
                            'project': Project,
                            'report': Report,
                            'site': Site,
                            'user': User
                        };

                        scope.model = modelIdx[scope.featureType];

                        if (typeof scope.model === 'undefined') {

                            throw new Error('Un-recognized `featureType` parameter.');

                        }

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        scope.mediaManager = Media;

                        scope.mediaManager.images = [];

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function(refresh) {

                            scope.processing = false;

                            scope.uploadComplete = false;

                            scope.uploadError = null;

                            scope.mediaManager.images = [];

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

                        scope.uploadImage = function() {

                            console.log(
                                'imageUploadDialog:uploadImage:mediaManager.images:',
                                scope.mediaManager.images
                            );

                            var input = document.getElementById(scope.fileInput);

                            scope.processing = true;

                            var imageCollection = {
                                images: []
                            };

                            if (!Array.isArray(scope.parent.images)) {

                                scope.parent.images = [];

                            }

                            scope.parent.images.forEach(function(image) {

                                imageCollection.images.push({
                                    id: image.id
                                });

                            });

                            if (!scope.mediaManager.images) {

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Please select an image.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                                return false;

                            }

                            scope.processing = true;

                            scope.progressMessage = 'Uploading…';

                            var savedQueries = scope.mediaManager.preupload(
                                scope.mediaManager.images[0],
                                'image',
                                scope.featureType,
                                scope.parent.id);

                            console.log(
                                'imageUploadDialog:saveImage:savedQueries:',
                                savedQueries
                            );

                            $q.all(savedQueries).then(function(successResponse) {

                                console.log(
                                    'imageUploadDialog::successResponse',
                                    successResponse);

                                angular.forEach(successResponse, function(image) {

                                    imageCollection.images.push({
                                        id: image.id
                                    });

                                });

                                scope.model.update({
                                    id: scope.parent.id
                                }, imageCollection).$promise.then(function(successResponse) {

                                    console.log(
                                        'imageUploadDialog:successResponse',
                                        successResponse);

                                    scope.progressMessage = 'Complete';

                                    scope.uploadComplete = true;

                                    scope.uploadError = null;

                                    $timeout(function () {

                                        scope.closeChildModal(true);

                                    }, 1500);

                                }, function(errorResponse) {

                                    console.log(
                                        'imageUploadDialog:errorResponse[1]',
                                        errorResponse);

                                    scope.uploadError = errorResponse.data;

                                    scope.resetFileInput(input);

                                });

                            }, function(errorResponse) {

                                console.log(
                                    'imageUploadDialog:errorResponse[2]',
                                    errorResponse);

                                scope.uploadError = errorResponse.data || {};

                                console.log(
                                    'imageUploadDialog:uploadError[2]',
                                    scope.uploadError);

                                scope.resetFileInput(input);

                            }).catch(function (errorResponse) {

                                console.log(
                                    'imageUploadDialog:errorResponse[3]',
                                    errorResponse);

                            });

                        };

                    }

                };

            }

        ]);

}());