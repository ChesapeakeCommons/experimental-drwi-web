(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('imageEditDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            '$timeout',
            'Media',
            'Image',
            function(environment, $routeParams, $filter, $parse, $location,
                     $timeout, Media, Image) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'feature': '=?',
                        'parent': '=?',
                        'parentType': '@',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/image/imageEditDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function (refresh) {

                            scope.processing = false;

                            scope.uploadComplete = false;

                            scope.uploadError = null;

                            scope.visible = false;

                            if (refresh) scope.callback();

                        };

                        scope.saveImage = function () {

                            var requestConfig = {
                                id: scope.feature.id,
                                target: scope.parentType + ':' + scope.parent.id
                            };

                            scope.progressMessage = 'Saving…';

                            scope.processing = true;

                            Image.update(
                                requestConfig,
                                scope.feature
                            ).$promise.then(function (successResponse) {

                                scope.progressMessage = 'Complete';

                                scope.uploadComplete = true;

                                scope.uploadError = null;

                                $timeout(function () {

                                    scope.closeChildModal(true);

                                }, 1500);

                            }, function (errorResponse) {

                                console.log('errorResponse', errorResponse);

                                scope.uploadError = errorResponse.data;

                                scope.progressMessage = undefined;

                                scope.processing = false;

                            });

                        };

                    }

                };

            }

        ]);

}());