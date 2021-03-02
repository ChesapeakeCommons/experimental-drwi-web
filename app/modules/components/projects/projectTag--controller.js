'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProjectTagController',
        function(Account, Image, $location, $log, Project, project, $q,
            $rootScope, $route, $scope, $timeout, $interval, user,
            Utility, SearchService, $window) {

            var self = this;

            self.projectId = $route.current.params.projectId;

            $rootScope.viewState = {
                'project': true
            };

            $rootScope.toolbarState = {
                'editTags': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            // 
            // Initialize container for storing grouped
            // tag selections.
            // 

            self.groupTags = {};

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                $location.path(self.project.links.site.html);

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

                var exclude = [];

                angular.forEach(self.tempTags, function(tag) {

                    exclude.push(tag.id);

                });

                return SearchService.tag({
                    q: value,
                    exclude: exclude.join(',')
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

            self.loadProject = function() {

                project.$promise.then(function(successResponse) {

                    console.log('self.project', successResponse);

                    self.project = successResponse;

                    // self.tempTags = successResponse.tags;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        return;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    $rootScope.page.title = self.project.name || 'Un-named Project';

                    self.showElements();

                }, function(errorResponse) {

                    self.showElements();

                });

            };

            self.setGroupSelection = function(group) {

                angular.forEach(group.tags, function(tag) {

                    if (tag.selected) {

                        self.groupTags[group.id] = tag; 

                    }

                });

            };

            self.loadGroups = function() {

                Project.tagGroups({
                    id: self.projectId
                }).$promise.then(function(successResponse) {

                    console.log('self.groups.successResponse', successResponse);

                    self.groups = successResponse.features.grouped;

                    self.ungrouped = successResponse.features.ungrouped;

                    angular.forEach(self.groups, function(group) {

                        self.setGroupSelection(group);

                    });

                }, function(errorResponse) {

                    self.showElements();

                });

            };

            self.loadTags = function() {

                Project.tags({
                    id: self.projectId
                }).$promise.then(function(successResponse) {

                    console.log('self.groups.successResponse', successResponse);

                    self.tempTags = successResponse.features;

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
                    'partnerships',
                    'practices',
                    'practice_types',
                    'program',
                    'reports',
                    'sites',
                    'status',
                    'tasks',
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

                var existingMatch = false;

                angular.forEach(self.tempTags, function(tag) {

                    console.log('tagCheck', tag, item);

                    if (tag.id === item.id) {

                        self.tagQuery = null;

                        existingMatch = true;

                    }

                });

                if (existingMatch) return;

                self.ungrouped.push(item);

                self.tempTags.push(item);

                self.tagQuery = null;

                console.log('Updated tags (addition)', self.tempTags);

            };

            self.removeTag = function(tag) {

                var _index;

                self.ungrouped.forEach(function(item, idx) {

                    if (item.id === tag.id) {

                        _index = idx;

                    }

                });

                console.log('Remove tag at index', _index, tag);

                if (typeof _index === 'number') {

                    self.ungrouped.splice(_index, 1);

                    var tags = [];

                    angular.forEach(self.tempTags, function(_tag) {

                        if (_tag.id !== tag.id) {

                            tags.push(_tag);

                        }

                    });

                    self.tempTags = tags;

                }

                console.log('Updated tags (removal)', self.tempTags);

            };

            self.manageGroup = function(group, tag) {

                console.log('Manage group', group, tag);

                console.log('self.manageGroup --> self.tempTags', self.tempTags);

                var _index;

                // 
                // Determine if a tag from the target group is
                // already present in `self.tempTags`.
                // 

                angular.forEach(self.tempTags, function(item, idx) {

                    console.log('Seeking tag match', item, tag);

                    if (item.group && item.group.id === group.id) {

                        console.log('Match found in group', item, group);

                        _index = idx;

                    }

                });

                // 
                // If a match was found, remove it from `self.tempTags`.
                // 

                if (typeof _index === 'number') {

                    self.tempTags.splice(_index, 1);

                }

                // 
                // Add target tag to `self.tempTags`.
                // 

                self.tempTags.push(tag);

                console.log('self.tempTags.groupManaged', self.tempTags);

            };

            self.processRelations = function(list, checkSelected) {

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

            self.processGroups = function(list) {

                var _list = [];

                console.log('self.groups', self.groups);

                angular.forEach(self.groups, function(item) {

                    var selection = self.processRelations(item.tags, true);

                    _list.push.apply(_list, selection);

                });

                console.log('processGroups._list', _list);

                return _list;

            };

            self.saveFeature = function() {

                self.status.processing = true;

                var data = {
                    tags: self.processRelations(self.tempTags)
                };

                console.log('self.saveFeature.data', data);

                Project.update({
                    id: self.project.id
                }, data).$promise.then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Project changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    $window.scrollTo(0, 0);

                    self.loadTags();

                    self.showElements();

                }, function(errorResponse) {

                    // Error message

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Project changes could not be saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.showElements();

                });

            };

            self.deleteFeature = function() {

                Project.delete({
                    id: +self.deletionTarget.id
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this project.',
                        'prompt': 'OK'
                    });

                    $timeout(closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this project.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this project.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this project.',
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

                    self.loadProject();

                    self.loadGroups();

                    self.loadTags();

                });

            } else {

                $location.path('/logout');

            }

        });