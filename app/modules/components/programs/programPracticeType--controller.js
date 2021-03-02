(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('ProgramPracticeTypeController', [
            'Account',
            '$location',
            '$timeout',
            '$log',
            '$rootScope',
            '$route',
            'Utility',
            'user',
            '$window',
            'Program',
            'Project',
            'program',
            'PracticeType',
            '$anchorScroll',
            function(Account, $location, $timeout, $log, $rootScope,
                     $route, Utility, user, $window, Program,
                     Project, program, PracticeType, $anchorScroll) {

                var self = this;

                self.programId = $route.current.params.programId;

                self.practiceTypeId = $route.current.params.practiceTypeId;

                $rootScope.viewState = {
                    'program': true
                };

                $rootScope.toolbarState = {
                    'viewPracticeTypes': true
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

                self.confirmDelete = function(obj, targetCollection) {

                    console.log('self.confirmDelete', obj, targetCollection);

                    if (self.deletionTarget &&
                        self.deletionTarget.collection === 'program') {

                        self.cancelDelete();

                    } else {

                        self.deletionTarget = {
                            'collection': targetCollection,
                            'feature': obj
                        };

                    }

                };

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.deleteFeature = function(featureType, index) {

                    console.log('self.deleteFeature', featureType, index);

                    var targetCollection;

                    switch (featureType) {

                        case 'project':

                            targetCollection = Project;

                            break;

                        default:

                            targetCollection = Program;

                            break;

                    }

                    targetCollection.delete({
                        id: +self.deletionTarget.feature.id
                    }).$promise.then(function(data) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this ' + featureType + '.',
                            'prompt': 'OK'
                        }];

                        if (index !== null &&
                            typeof index === 'number' &&
                            featureType === 'report') {

                            self.program.readings_custom.splice(index, 1);

                            self.cancelDelete();

                            $timeout(self.closeAlerts, 2000);

                            if (index === 0) {

                                $route.reload();

                            }

                        } else {

                            $timeout(closeRoute, 2000);

                        }

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete this ' + featureType + '. There are pending tasks affecting this feature.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this ' + featureType + '.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this ' + featureType + '.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(self.closeAlerts, 2000);

                    });

                };

                self.loadProgram = function() {

                    program.$promise.then(function(successResponse) {

                        console.log('self.program', successResponse);

                        self.program = successResponse;

                        self.permissions = successResponse.permissions;

                        $rootScope.program = successResponse;

                        $rootScope.page.title = self.program.name ? self.program.name : 'Un-named Program';

                        self.status.loading = false;

                        self.loadPracticeType();

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                        self.showElements();

                    });

                };

                self.loadPracticeType = function() {

                    PracticeType.getSingle({
                        id: self.practiceTypeId,
                        program: self.program.id
                    }).$promise.then(function(successResponse) {

                        console.log('practiceType', successResponse);

                        self.practiceType = successResponse;

                        self.linkedMetrics = successResponse.metrics;

                        self.loadProgramMetrics();

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                        self.showElements();

                    });

                };

                /*START LOAD PROGRAM METRICS
                    this is for search. We want a list of all metrics to add
                    to th practice type. This makes a list object that we need
                    to maintain (ie remove add list items from
                */

                self.loadProgramMetrics = function() {

                    Program.metrics({
                        id: self.program.id,
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

                        console.log('errorResponse', errorResponse);

                        self.showElements();

                    });

                };

                self.syncMetricArrays = function(metricType, action) {

                    if (action === 'add') {

                        self.linkedMetrics.push(metricType);

                    } else {

                        self.linkedMetrics = self.linkedMetrics.filter(function (feature) {

                            return feature.id !== metricType.id;

                        });

                    }

                };

                self.filterBaseMetrics = function(sourceArray) {

                    let linkedIndex = [];

                    self.linkedMetrics.forEach(function (feature) {

                        linkedIndex.push(feature.id);

                    });

                    return sourceArray.filter(function (feature) {

                        return linkedIndex.indexOf(feature.id) < 0;

                    });

                };

                self.jumpToMetricManager = function() {

                    $anchorScroll('idx');

                };

                self.manageMetric = function(metricType, action) {

                    if ((action !== 'add' && action !== 'remove') ||
                        self.status.processing) return;

                    PracticeType.manageMetric({
                        id: self.practiceType.id,
                        metricId: metricType.id,
                        action: action,
                        program: self.program.id
                    }, {}).$promise.then(function(successResponse) {

                        console.log(
                            'self.manageMetric.successResponse',
                            successResponse
                        );

                        metricType.linked = !metricType.linked;

                        if (action === 'add') {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Metric type linked to practice type.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Metric type un-linked from practice type.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(self.closeAlerts, 2000);

                        self.status.processing = false;

                        self.syncMetricArrays(metricType, action);

                    }).catch(function(errorResponse) {

                        console.log(
                            'self.manageMetric.errorResponse',
                            errorResponse
                        );

                        // Do something with the error

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Something went wrong and the changes were not saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                        self.status.processing = false;

                    });

                    self.metricType = undefined;

                };

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {
                            can_edit: false
                        };

                        self.loadProgram();

                    });
                }

            }
        ]);

}());