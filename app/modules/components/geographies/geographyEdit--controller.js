'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('GeographyEditController',
        function(Account,$location, $log, GeographyService, GeographyType, geography,
            $q, $rootScope, $route, $scope, $timeout, $interval, user) {

            var self = this;

            $rootScope.viewState = {
                'geography': true
            };

            $rootScope.toolbarState = {
                'edit': true
            };

            self.status = {
                loading: true,
                processing: true
            };

            $rootScope.page = {};

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                $location.path('/geographies');

            }

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 50);

            };

            self.loadGeography = function() {

                geography.$promise.then(function(successResponse) {

                    console.log('self.geography', successResponse);

                    self.geography = successResponse;

                    $rootScope.page.title = self.geography.name ? self.geography.name : 'Un-named Geography';

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    self.scrubFeature(self.geography);

                    self.showElements();

                }, function(errorResponse) {

                    // Error message

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to load geography data.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                });

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'extent',
                    'geometry',
                    'last_modified_by',
                    'organization',
                    'tags',
                    'tasks'
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

            self.saveGeography = function() {

                console.log('self.saveGeography', self.geography);

                self.status.processing = true;

                self.scrubFeature(self.geography);

                GeographyService.update({
                    id: self.geography.id
                }, self.geography).then(function(successResponse) {

                    self.geography = successResponse;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Geography changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                }).catch(function(errorResponse) {

                    // Error message

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Geography changes could not be saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                });

            };

            self.confirmDelete = function(obj) {

                console.log('self.confirmDelete', obj);

                self.deletionTarget = self.deletionTarget ? null : obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.deleteFeature = function() {

                GeographyService.delete({
                    id: +self.deletionTarget.id
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this geography.',
                        'prompt': 'OK'
                    });

                    $timeout(closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this geography.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this geography.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this geography.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.extractPrograms = function(user) {

                var _programs = [];

                user.programs.forEach(function(program) {

                    _programs.push(program.properties);

                });

                return _programs;

            };

            self.loadGroups = function(value) {

                GeographyType.collection({
                    minimal: 'true',
                    sort: 'name:desc'
                }).$promise.then(function(response) {

                    console.log('GeographyType.collection response', response);

                    self.geographyGroups = response.features;

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

                    self.programs = self.extractPrograms($rootScope.user);

                    self.loadGeography();

                    self.loadGroups();

                });

            }

        });