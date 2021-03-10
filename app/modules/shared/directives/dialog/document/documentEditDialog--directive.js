(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('documentEditDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            '$timeout',
            'Media',
            'GenericFile',
            function(environment, $routeParams, $filter, $parse, $location,
                     $timeout, Media, GenericFile) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'feature': '=?',
                        'modalDisplay': '=?',
                        'parent': '=?',
                        'parentType': '@',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/document/documentEditDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        if (!angular.isDefined(scope.modalDisplay)) {

                            scope.modalDisplay = {};

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function (refresh) {

                            scope.processing = false;

                            scope.uploadComplete = false;

                            scope.uploadError = null;

                            scope.visible = false;

                            scope.modalDisplay = {};

                            if (refresh) scope.callback();

                        };

                        scope.saveDocument = function () {

                            var requestConfig = {
                                id: scope.feature.id,
                                target: scope.parentType + ':' + scope.parent.id
                            };

                            scope.progressMessage = 'Saving…';

                            scope.processing = true;

                            GenericFile.update(
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