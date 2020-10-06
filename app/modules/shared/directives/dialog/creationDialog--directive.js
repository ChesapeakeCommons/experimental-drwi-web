(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('creationDialog', [
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Project',
            'Site',
            'Practice',
            'Report',
            'MetricType',
            'PracticeType',
            'SearchService',
            '$timeout',
            function($routeParams, $filter, $parse, $location, Project,
                     Site, Practice, Report, MetricType, PracticeType,
                     SearchService, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'organization': '=?',
                        'parent': '=?',
                        'resetType': '=?',
                        'site': '=?',
                        'type': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return 'modules/shared/directives/dialog/creationDialog--view.html';

                    },
                    link: function(scope, element, attrs) {

                        if (scope.resetType === 'undefined') {

                            scope.resetType = true;

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function() {

                            scope.visible = false;

                            if (scope.resetType) scope.type = undefined;

                        };

                        scope.createChild = function(name) {

                            if (scope.type !== 'metric' &&
                                scope.type !== 'report' &&
                                scope.type !== 'practice' &&
                                scope.type !== 'practice_type' &&
                                scope.type !== 'site' &&
                                scope.type !== 'project') return;

                            if (!name || typeof name === 'undefined') return;

                            var newFeature;

                            var data;

                            if (scope.type === 'practice' ||
                                scope.type === 'site') {

                                data = {
                                    'name': name,
                                    'project_id': scope.parent,
                                    'organization_id': scope.organization
                                };

                                if (scope.type === 'site') {

                                    newFeature = new Site(data);

                                } else {

                                    if (scope.site) {

                                        data.site_id = scope.site;
                                    }

                                    newFeature = new Practice(data);

                                }

                            } else if (scope.type === 'project') {

                                data = {
                                    'name': name,
                                    'program_id': scope.program_id,
                                    'organization_id': scope.organization
                                };

                                newFeature = new Project(data);

                            } else if (scope.type === 'metric') {

                                data = {
                                    'name': name,
                                    'program_id': scope.parent,
                                    'organization_id': scope.organization
                                };

                                newFeature = new MetricType(data);

                            } else if (scope.type === 'practice_type') {

                                data = {
                                    'name': name,
                                    'program_id': scope.parent,
                                    'organization_id': scope.organization
                                };

                                newFeature = new PracticeType(data);

                            } else {

                                data = {
                                    'measurement_period': name,
                                    'name': name,
                                    'report_date': new Date(),
                                    'practice_id': scope.parent,
                                    'organization_id': scope.organization
                                };

                                newFeature = new Report(data);

                            }

                            newFeature.$save(function(successResponse) {

                                var nextPath = [
                                    '/',
                                    scope.type.replace(/_/g, '-'),
                                    's/',
                                    successResponse.id,
                                    '/edit'
                                ].join('');

                                if (scope.type === 'report') {

                                    Report.prepare({
                                        id: +successResponse.id
                                    }, {}).$promise.then(function(successResponse) {

                                        $location.path(nextPath);

                                    }).catch(function(error) {

                                        scope.alerts = [{
                                            'type': 'error',
                                            'flag': 'Error!',
                                            'msg': 'Something went wrong while attempting to create this ' + scope.type + '.',
                                            'prompt': 'OK'
                                        }];

                                        $timeout(closeAlerts, 2000);

                                    });

                                } else {

                                    $location.path(nextPath);

                                }

                            }, function(errorResponse) {

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Something went wrong while attempting to create this ' + scope.type + '.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.searchPrograms = function(value) {

                            return SearchService.program({
                                q: value
                            }).$promise.then(function(response) {

                                console.log('SearchService.program response', response);

                                response.results.forEach(function(result) {

                                    result.category = null;

                                });

                                return response.results.slice(0, 3);

                            });

                        };

                        scope.setProgram = function(item, model, label) {

                            scope.program_id = item.id;

                        };

                    }

                };

            }

        ]);

}());