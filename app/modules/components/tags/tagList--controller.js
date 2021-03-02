'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('TagListController',
        function(Account, $location, $log, Tag, TagGroup,
            tags, $rootScope, $route, $scope, user,
            $interval, $timeout, Utility, $window) {

            var self = this;

            $rootScope.viewState = {
                'tag': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Tags'
            };

            self.status = {
                loading: true
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                }, 50);

            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            self.confirmDelete = function(obj) {

                self.deletionTarget = obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.deleteFeature = function(obj, group, index) {

                console.log('self.deleteFeature', obj, group, index);

                Tag.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this tag.',
                        'prompt': 'OK'
                    }];

                    // self.tags.features[group].splice(index, 1);

                    group.tags.splice(index, 1);

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this tag.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this tag.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this tag.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

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

            self.createTag = function() {

                self.tag = new Tag({
                    'creator_id': $rootScope.user.id
                });

                self.tag.$save(function(successResponse) {

                    $location.path('/tags/' + successResponse.id + '/edit');

                }, function(errorResponse) {

                    console.error('Unable to create a new tag, please try again later.');

                });

            };

            self.editGroup = function(obj) {

                self.editMode = true;

                self.displayModal = true;

                self.targetGroup = obj;

                $window.scrollTo(0, 0);

            };

            self.saveGroup = function() {

                self.scrubFeature(self.targetGroup);

                TagGroup.update({
                    id: self.targetGroup.id
                }, self.targetGroup).$promise.then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Category changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.displayModal = false;

                    self.editMode = false;

                    $window.scrollTo(0, 0);

                    self.loadTags();

                }).catch(function(error) {

                    // Do something with the error

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong and the changes could not be saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.status.processing = false;

                    self.displayModal = false;

                    self.editMode = false;

                    $window.scrollTo(0, 0);

                });

            };

            self.loadTags = function() {

                Tag.collection({
                    group: true
                }).$promise.then(function(successResponse) {

                    console.log('successResponse', successResponse);

                    self.tags = successResponse;

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

                    console.log('$rootScope.user', userResponse);

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.loadTags();

                });

            } else {

                $location.path('/logout');

            }

        });