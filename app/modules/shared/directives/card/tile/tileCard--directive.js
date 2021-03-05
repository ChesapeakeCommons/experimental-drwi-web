(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('tileCard', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Project',
            'Site',
            'Practice',
            '$timeout',
            function(environment, $routeParams, $filter, $parse,
                     $location, Project, Site, Practice, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'collection': '=?',
                        'feature': '=?',
                        'permissions': '=?',
                        'summary': '=?',
                        'type': '@'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'card/tile/tileCard--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        var modelIdx = {
                            'practice': Practice,
                            'project': Project,
                            'site': Site
                        };

                        scope.model = modelIdx[scope.type];

                        if (typeof scope.model === 'undefined') {

                            throw new Error('Un-recognized `type` parameter.');

                        }

                        scope.defaultStaticUrl = [
                            'https://api.mapbox.com/',
                            'styles/v1/mapbox/streets-v10/',
                            'static/-98.5795,39.828175,6/',
                            '400x200@2x?',
                            'access_token=pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                        ].join('');

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function() {

                            scope.visible = false;

                            if (scope.resetType && scope.type !== 'project') scope.type = undefined;

                        };

                        scope.confirmDelete = function(obj) {

                            scope.deletionTarget = obj;

                        };

                        scope.cancelDelete = function() {

                            scope.deletionTarget = null;

                        };

                        scope.deleteFeature = function(obj, index) {

                            scope.model.delete({
                                id: obj.id
                            }).$promise.then(function(data) {

                                scope.deletionTarget = null;

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Successfully deleted this ' + scope.type + '.',
                                    'prompt': 'OK'
                                }];

                                scope.collection.splice(index, 1);

                                scope.summary.feature_count--;

                                $timeout(closeAlerts, 2000);

                            }).catch(function(errorResponse) {

                                console.log(
                                    'scope.deleteFeature.errorResponse',
                                    errorResponse
                                );

                                if (errorResponse.status === 409) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this ' + scope.type + '.',
                                        'prompt': 'OK'
                                    }];

                                } else if (errorResponse.status === 403) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'You don’t have permission to delete this ' + scope.type + '.',
                                        'prompt': 'OK'
                                    }];

                                } else {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Something went wrong while attempting to delete this ' + scope.type + '.',
                                        'prompt': 'OK'
                                    }];

                                }

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.$watch('collection', function (newVal) {

                            console.log(
                                'tileCard:collection:',
                                newVal
                            );

                        });

                        scope.$watch('feature', function (newVal) {

                            if (newVal) {

                                scope.staticURL = newVal.staticURL;

                                if (newVal.hasOwnProperty('properties')) {

                                    for (var key in newVal.properties) {

                                        if (newVal.properties.hasOwnProperty(key)) {

                                            newVal[key] = newVal.properties[key];

                                        }

                                    }

                                }

                            }

                        });

                        scope.$watch('type', function (newVal) {

                            if (typeof newVal === 'string') {

                                scope.label = newVal.replace(/_/g, ' ');

                                scope.collectionLabel = newVal + 's';

                            }

                        });

                    }

                };

            }

        ]);

}());