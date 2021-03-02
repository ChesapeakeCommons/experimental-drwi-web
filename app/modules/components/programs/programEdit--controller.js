'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProgramEditController',
        function(Account, Image, $location, $log, Program, program, $q,
            $rootScope, $route, $scope, $timeout, $interval, user, Utility) {

            var self = this;

            self.programId = $route.current.params.programId;

            $rootScope.viewState = {
                'program': true
            };

            $rootScope.toolbarState = {
                'edit': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                $location.path(self.program.links.site.html);

            }

            self.confirmDelete = function(obj) {

                console.log('self.confirmDelete', obj);

                self.deletionTarget = self.deletionTarget ? null : obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 50);

            };

            self.loadProgram = function() {

                program.$promise.then(function(successResponse) {

                    console.log('self.program', successResponse);

                    self.program = successResponse;

                    self.permissions = successResponse.permissions;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        return;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    $rootScope.page.title = self.program.name || 'Un-named Program';

                    self.showElements();

                }, function(errorResponse) {

                    self.showElements();

                });

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'dashboards',
                    'geographies',
                    'images',
                    'last_modified_by',
                    'members',
                    'metrics',
                    'metric_types',
                    'organization',
                    'partners',
                    'practices',
                    'practice_types',
                    'program',
                    'reports',
                    'sites',
                    'status',
                    'users'
                ];

                var reservedProperties = [
                    'links',
                    'permissions',
                    '$promise',
                    '$resolved'
                ];

                excludedKeys.forEach(function(key) {

                    if (feature.properties) {

                        delete feature.properties[key];

                    } else {

                        delete feature[key];

                    }

                });

                reservedProperties.forEach(function(key) {

                    delete feature[key];

                });

            };

            self.saveProgram = function() {

                self.status.processing = true;

                self.scrubFeature(self.program);

                if (self.programType) {

                    self.program.properties.category_id = self.programType.id;

                }

                self.program.$update().then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Program changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                }, function(errorResponse) {

                    // Error message

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Program changes could not be saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                });

            };

            self.deleteFeature = function() {

                Program.delete({
                    id: +self.deletionTarget.id
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this program.',
                        'prompt': 'OK'
                    });

                    $timeout(closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this program.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this program.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this program.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

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

            } else {

                $location.path('/logout');

            }

        });