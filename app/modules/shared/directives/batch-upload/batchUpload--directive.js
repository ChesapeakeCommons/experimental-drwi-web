(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('batchUpload', [
            'environment',
            '$window',
            '$rootScope',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Practice',
            '$timeout',
            function (environment, $window, $rootScope, $routeParams, $filter,
                      $parse, $location, Practice, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'featureType': '=?',
                        'model': '=?',
                        'formAction': '&',
                        'uploadError': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'batch-upload/batchUpload--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //

                        scope.showTips = false;

                        scope.closeChildModal = function(refresh) {

                            scope.processing = false;

                            scope.uploadComplete = false;

                            scope.uploadError = null;

                            scope.visible = false;

                            if (scope.resetType) scope.type = undefined;

                            // if (refresh) scope.callback();

                        };

                        scope.setFiles = function(files) {

                            scope.model = files[0];

                        };

                        scope.uploadFile = function() {

                            scope.formAction({
                                _featureType: scope.featureType
                            });

                        };

                        scope.$watch('model', function (newVal) {

                            console.log(
                                'batchUpload:model:',
                                newVal
                            );

                        });

                    }

                };

            }

        ]);

}());