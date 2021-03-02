'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeTypeSummaryController', [
        'Account',
        '$location',
        '$log',
        'PracticeType',
        'Program',
        'practiceType',
        '$rootScope',
        '$route',
        '$scope',
        '$timeout',
        'user',
        '$anchorScroll',
        function(Account, $location, $log, PracticeType, Program, practiceType,
            $rootScope, $route, $scope, $timeout, user, $anchorScroll) {

            var self = this;

            console.log(
                $location.path()
            );

            $location.url($location.path());

            self.programId = $route.current.params.programId;

            $rootScope.toolbarState = {
                'summary': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            self.alerts = [];

            self.closeAlerts = function() {

                self.alerts = [];

            };

            function closeRoute() {

                $location.path(self.program.links.site.html);

            }

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 50);

            };

            self.confirmDelete = function(obj) {

                console.log('self.confirmDelete', obj);

                self.deletionTarget = self.deletionTarget ? null : obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.deleteFeature = function() {

                PracticeType.delete({
                    id: +self.deletionTarget.id
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this practice type.',
                        'prompt': 'OK'
                    });

                    $timeout(closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this practice type.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this practice type.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this practice type.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.loadPracticeType = function() {

                practiceType.$promise.then(function(successResponse) {

                    console.log('self.practiceType', successResponse);

                    // self.practiceType = successResponse;

                    self.practiceType = successResponse;

                    self.linkedMetrics = successResponse.metrics;

                    self.permissions = successResponse.permissions;

                    $rootScope.page.title = self.practiceType.name ? self.practiceType.name : 'Un-named Practice Type';

                    self.loadProgramMetrics();

                }, function(errorResponse) {

                    console.log('self.practiceType', errorResponse);

                    self.showElements();

                });

            };

            self.loadProgramMetrics = function() {

                Program.metrics({
                    id: self.practiceType.program.id,
                    group: 'alphabet',
                    mapping: 'ptype:' + self.practiceType.id,
                    program_only: 'true',
                    sort: 'name'
                }).$promise.then(function(successResponse) {

                    console.log(
                        'self.loadProgramMetrics.successResponse',
                        successResponse);

                    self.metricTypes = successResponse.features.groups;

                    self.letters = successResponse.features.letters;

                    self.summary = successResponse.summary;

                    self.showElements();

                }, function(errorResponse) {

                    console.log(
                        'self.loadProgramMetrics.errorResponse',
                        errorResponse);

                    self.showElements();

                });

            };

            self.jumpToMetricManager = function() {

                $anchorScroll('idx');

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.loadPracticeType();

                });

            }

        }]);