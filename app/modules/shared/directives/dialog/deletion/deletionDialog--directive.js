(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('deletionDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Export',
            'Project',
            'Site',
            'Practice',
            'Report',
            'MetricType',
            'PracticeType',
            'SearchService',
            '$timeout',
            function(environment, $routeParams, $filter, $parse, $location, Export,
                     Project, Site, Practice, Report, MetricType, PracticeType,
                     SearchService, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'feature': '=?',
                        'featureType': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/deletion/deletionDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        var modelIdx = {
                            'export': Export,
                            'metric-type': MetricType,
                            'practice': Practice,
                            'practice-type': PracticeType,
                            'project': Project,
                            'report': Report,
                            'site': Site
                        };

                        scope.model = modelIdx[scope.featureType];

                        if (typeof scope.model === 'undefined') {

                            throw new Error('Un-recognized `featureType` parameter.');

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        function closeRoute() {

                            var path;

                            switch(scope.featureType) {

                                case 'practice':

                                    path = '/projects/' + scope.feature.project_id;

                                    $location.path('/projects');

                            }

                            $location.path('/projects');

                        }

                        scope.closeChildModal = function(refresh) {

                            scope.processing = false;

                            scope.deletionError = null;

                            scope.visible = false;

                            if (scope.resetType) scope.type = undefined;

                            if (refresh && scope.callback) scope.callback();

                        };

                        scope.deleteFeature = function() {

                            var targetId;

                            if (scope.feature.properties) {

                                targetId = scope.feature.properties.id;

                            } else {

                                targetId = scope.feature.id;

                            }

                            scope.model.delete({
                                id: +targetId
                            }).$promise.then(function(data) {

                                scope.alerts.push({
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Successfully deleted this ' + scope.featureType + '.',
                                    'prompt': 'OK'
                                });

                                scope.closeChildModal(true);

                                $timeout(closeAlerts, 2000);

                                // $timeout(closeRoute, 2000);

                            }).catch(function(errorResponse) {

                                console.log(
                                    'scope.deleteFeature.errorResponse',
                                    errorResponse);

                                if (errorResponse.status === 409) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Unable to delete “' + scope.feature.name + '”. There are pending tasks affecting this ' + scope.label + '.',
                                        'prompt': 'OK'
                                    }];

                                } else if (errorResponse.status === 403) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'You don’t have permission to delete this ' + scope.label + '.',
                                        'prompt': 'OK'
                                    }];

                                } else {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Something went wrong while attempting to delete this ' + scope.label + '.',
                                        'prompt': 'OK'
                                    }];

                                }

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.$watch('featureType', function (newVal) {

                            if (typeof newVal === 'string') {

                                scope.label = newVal.replace(/_/g, ' ').replace(/-/g, ' ');

                            }

                        });

                        // scope.$on('globalClick', function (event, target) {
                        //
                        //     console.log(
                        //         'globalClick:deletionDialog:event:',
                        //         event
                        //     );
                        //
                        //     console.log(
                        //         'globalClick:deletionDialog:target:',
                        //         target
                        //     );
                        //
                        //     if (scope.visible &&
                        //         !target.classList.contains('delete-trigger') &&
                        //         !element[0].contains(target)) {
                        //
                        //         scope.$apply(function () {
                        //
                        //             console.log(
                        //                 'globalClick:deletionDialog:event:$apply'
                        //             );
                        //
                        //             scope.visible = false;
                        //
                        //         });
                        //
                        //     }
                        //
                        // });

                    }

                };

            }

        ]);

}());