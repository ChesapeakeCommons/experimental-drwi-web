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
                $location, $timeout, project, user, members, SearchService, Project,
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

                    }, 1000);

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
                        q: value
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        response.results.forEach(function(result) {

                            result.category = null;

                        });

                        return response.results.slice(0, 5);

                    });

                };

                self.addOwner = function(item, model, label) {

                    var _datum = {
                        id: item.id,
                        properties: item
                    };

                    self.tempOwners.push(_datum);

                    self.ownerQuery = null;

                    console.log('Updated owners (addition)', self.tempOwners);

                };

                self.removeOwner = function(id) {

                    var _index;

                    self.tempOwners.forEach(function(item, idx) {

                        if (item.id === id) {

                            _index = idx;

                        }

                    });

                    console.log('Remove owner at index', _index);

                    if (typeof _index === 'number') {

                        self.tempOwners.splice(_index, 1);

                    }

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

                self.scrubProject = function() {

                    delete self.project.properties.geographies;
                    delete self.project.properties.practices;
                    delete self.project.properties.programs;
                    delete self.project.properties.sites;
                    delete self.project.properties.tags;

                };

                self.saveProject = function() {

                    self.status.processing = true;

                    self.scrubProject();

                    self.project.properties.members = self.processOwners(self.tempOwners);

                    self.project.$update().then(function(response) {

                        if (self.project.properties.members.length) {

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

                    if (self.project.properties) {

                        targetId = self.project.properties.id;

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
                                'msg': 'Unable to delete “' + self.project.properties.name + '”. There are pending tasks affecting this project.',
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
                            isLoggedIn: Account.hasToken(),
                            role: $rootScope.user.properties.roles[0],
                            account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null,
                            can_edit: false
                        };

                        //
                        // Assign project to a scoped variable
                        //
                        project.$promise.then(function(successResponse) {

                            console.log('self.project', successResponse);

                            self.project = successResponse;

                            if (!successResponse.permissions.read &&
                                !successResponse.permissions.write) {

                                self.makePrivate = true;

                            } else {

                                self.permissions.can_edit = successResponse.permissions.write;
                                self.permissions.can_delete = successResponse.permissions.write;

                                $rootScope.page.title = self.project.properties.name;

                                self.tempOwners = self.project.properties.members;

                                console.log('tempOwners', self.tempOwners);

                                self.project.users_edit = false;

                            }

                            self.showElements();

                        }, function(errorResponse) {

                            console.error('Unable to load request project');

                            self.showElements();

                        });

                    });

                } else {

                    $location.path('/login');

                }

            });

}());