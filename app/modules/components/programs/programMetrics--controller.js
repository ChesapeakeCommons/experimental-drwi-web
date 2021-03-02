(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('ProgramMetricsController', [
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
            'program',
            function(Account, $location, $timeout, $log, $rootScope,
                $route, Utility, user, $window, Program, program) {

                var self = this;

                self.programId = $route.current.params.programId;

                $rootScope.viewState = {
                    'program': true
                };

                $rootScope.toolbarState = {
                    'viewMetricTypes': true
                };

                $rootScope.page = {};

                self.map = undefined;

                self.status = {
                    loading: true
                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

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

                            $timeout(closeAlerts, 2000);

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

                        $timeout(closeAlerts, 2000);

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

                        self.loadMetricTypes();

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                        self.showElements();

                    });

                };

                self.loadMetricTypes = function() {

                    Program.metrics({
                        id: self.program.id,
                        group: 'alphabet',
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

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        self.loadProgram();

                    });
                }

            }
        ]);

}());