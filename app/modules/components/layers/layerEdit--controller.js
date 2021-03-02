'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('LayerEditController',
        function(Account,$location, $log, LayerService, LayerType, layer,
            $q, $rootScope, $route, $scope, $timeout, $interval, user) {

            var self = this;

            $rootScope.viewState = {
                'layer': true
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

            self.loadLayer = function() {

                layer.$promise.then(function(successResponse) {

                    console.log('self.layer', successResponse);

                    self.layer = successResponse;

                    $rootScope.page.title = self.layer.name ? self.layer.name : 'Un-named Layer';

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    self.scrubFeature(self.layer);

                    self.showElements();

                }, function(errorResponse) {

                    // Error message

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to load layer data.',
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

            self.saveLayer = function() {

                console.log('self.saveLayer', self.layer);

                self.status.processing = true;

                self.scrubFeature(self.layer);

                LayerService.update({
                    id: self.layer.id
                }, self.layer).then(function(successResponse) {

                    self.layer = successResponse;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Layer changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                }).catch(function(errorResponse) {

                    // Error message

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Layer changes could not be saved.',
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

                LayerService.delete({
                    id: +self.deletionTarget.id
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this layer.',
                        'prompt': 'OK'
                    });

                    $timeout(closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this layer.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this layer.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this layer.',
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

                LayerType.collection({
                    minimal: 'true',
                    sort: 'name:desc'
                }).$promise.then(function(response) {

                    console.log('LayerType.collection response', response);

                    self.layerGroups = response.features;

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

                    self.loadLayer();

                    self.loadGroups();

                });

            }

        });