'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProgramTagController',
        function(Account, Image, $location, $log, Program, program, $q,
            $rootScope, $route, $scope, $timeout, $interval, user,
            Utility, SearchService) {

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

            self.searchTags = function(value) {

                return SearchService.tag({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService response', response);

                    return response.results.slice(0, 5);

                });

            };

            self.searchGroups = function(value) {

                return SearchService.tagGroup({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService response', response);

                    response.results.forEach(function(result) {

                        result.category = null;

                    });

                    return response.results.slice(0, 5);

                });

            };

            self.loadProgram = function() {

                program.$promise.then(function(successResponse) {

                    console.log('self.program', successResponse);

                    self.program = successResponse;

                    self.permissions = successResponse.permissions;

                    self.tempGroups = successResponse.tag_groups;

                    self.tempTags = successResponse.tags;

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
                    'geometry',
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

            self.addTag = function(item, model, label) {

                self.tempTags.push(item);

                self.tagQuery = null;

                console.log('Updated tags (addition)', self.tempTags);

            };

            self.removeTag = function(id) {

                var _index;

                self.tempTags.forEach(function(item, idx) {

                    if (item.id === id) {

                        _index = idx;

                    }

                });

                console.log('Remove tag at index', _index);

                if (typeof _index === 'number') {

                    self.tempTags.splice(_index, 1);

                }

                console.log('Updated tags (removal)', self.tempTags);

            };

            self.addGroup = function(item, model, label) {

                self.tempGroups.push(item);

                self.groupQuery = null;

                console.log('Updated groups (addition)', self.tempGroups);

            };

            self.removeGroup = function(id) {

                var _index;

                self.tempGroups.forEach(function(item, idx) {

                    if (item.id === id) {

                        _index = idx;

                    }

                });

                console.log('Remove group at index', _index);

                if (typeof _index === 'number') {

                    self.tempGroups.splice(_index, 1);

                }

                console.log('Updated groups (removal)', self.tempGroups);

            };

            self.processRelations = function(list) {

                var _list = [];

                angular.forEach(list, function(item) {

                    var _datum = {};

                    if (item && item.id) {
                        _datum.id = item.id;
                    }

                    _list.push(_datum);

                });

                return _list;

            };

            self.saveFeature = function() {

                self.status.processing = true;

                self.scrubFeature(self.program);

                self.program.tags = self.processRelations(self.tempTags);

                self.program.tag_groups = self.processRelations(self.tempGroups);

                self.program.$update().then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Program changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.tempGroups = successResponse.tag_groups;

                    self.tempTags = successResponse.tags;

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