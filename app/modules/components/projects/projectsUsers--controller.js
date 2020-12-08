(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:ProjectUsersController
     * @description
     * # ProjectUsersController
     * Controller of the FieldDoc
     */
    angular.module('FieldDoc')
        .controller('ProjectUsersController',
            function(Account, Collaborators, $window, $rootScope, $scope, $route,
                     $location, $timeout, project, user, SearchService, Project,
                     Utility, $interval) {

                var self = this;

                $rootScope.page = {};

                $rootScope.viewState = {
                    'project': true
                };

                $rootScope.toolbarState = {
                    'users': true
                };

                self.status = {
                    loading: true,
                    processing: false
                };

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                    }, 500);

                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    $location.path('/projects');

                }

                self.confirmDelete = function(obj) {

                    self.deletionTarget = self.deletionTarget ? null : obj;

                };

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.searchUsers = function(value) {

                    return SearchService.user({
                        q: value,
                        scope: 'user'
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        response.results.forEach(function(result) {

                            result.category = null;

                        });

                        return response.results.slice(0, 5);

                    });

                };

                self.addOwner = function(item, model, label) {

                    console.log("member item",item);
                    var member = {
                        "user": item,
                        "user_id" : item.id,
                    }

                    //   var member = item;
                    //    member.user = item;
                    //    member.user_id = item.id;

                    self.tempOwners.push(member);

                    self.ownerQuery = null;

                    console.log('Updated owners (addition)', self.tempOwners);

                };

                self.removeOwner = function(index) {
                    self.tempOwners.splice(index, 1);
                    /*    var _index;

                        self.tempOwners.forEach(function(item, idx) {

                            if (item.id === id) {

                                _index = idx;

                            }

                        });

                        console.log('Remove owner at index', _index);

                        if (typeof _index === 'number') {

                            self.tempOwners.splice(_index, 1);

                        }
    */
                    console.log('Updated owners (removal)', self.tempOwners);

                };

                self.processOwners = function(list) {

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

                self.scrubFeature = function(feature) {

                    var excludedKeys = [
                        'creator',
                        'extent',
                        'geometry',
                        'images',
                        'last_modified_by',
                        'organization',
                        'program',
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

                self.saveProject = function() {

                    self.status.processing = true;

                    self.scrubFeature(self.project);

                    //   self.project.members = self.processOwners(self.tempOwners);

                    var exclude = [
                        'centroid',
                        'creator',
                        'dashboards',
                        'extent',
                        'geometry',
                        // 'members',
                        'metric_types',
                        'partners',
                        'practices',
                        'practice_types',
                        'properties',
                        'tags',
                        'targets',
                        'tasks',
                        'type',
                        'sites'
                    ].join(',');

                    Project.post_members({
                        id: $route.current.params.projectId
                        // exclude: exclude
                    }, self.project).then(function(successResponse) {

                        self.project = successResponse;

                        $rootScope.page.title = self.project.name;

                        console.log(" self.project.members", self.project.members);

                        self.tempOwners = self.project.members;

                        if (self.project.members.length) {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Collaborators added to project.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'All collaborators removed from project.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(closeAlerts, 2000);

                        self.status.processing = false;

                    }).then(function(error) {

                        self.status.processing = false;

                    });

                };

                self.deleteFeature = function() {

                    var targetId;

                    if (self.project) {

                        targetId = self.project.id;

                    } else {

                        targetId = self.project.id;

                    }

                    Project.delete({
                        id: +targetId
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
                                'msg': 'Unable to delete “' + self.project.name + '”. There are pending tasks affecting this project.',
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

                self.loadMembers = function () {

                    Project.members({
                        id: $route.current.params.projectId
                    }).$promise.then(function(successResponse) {

                        console.log('self.project', successResponse);

                        self.project = successResponse;

                        self.permissions = successResponse.permissions;

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = self.project.name;

                        self.members = self.project.members;

                        console.log('tempOwners', self.tempOwners);

                        self.showElements();

                    }, function(errorResponse) {

                        console.error('Unable to load request project');

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

                        self.loadMembers();


                    });

                } else {

                    $location.path('/logout');

                }

            });

}());