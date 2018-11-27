'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('TagEditController', function(Account, $location, $log,
        Tag, SearchService, tag, $q, $rootScope, $route, $timeout, $interval,
        user, Utility) {

        var self = this;

        $rootScope.viewState = {
            'tag': true
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

            $location.path('/tags');

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

            }, 1000);

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

        self.loadTag = function() {

            tag.$promise.then(function(successResponse) {

                console.log('self.tag', successResponse);

                self.tag = successResponse;

                if (!successResponse.permissions.read &&
                    !successResponse.permissions.write) {

                    self.makePrivate = true;

                    return;

                }

                self.permissions.can_edit = successResponse.permissions.write;
                self.permissions.can_delete = successResponse.permissions.write;

                $rootScope.page.title = self.tag.properties.name ? self.tag.properties.name : 'Un-named Tag';

                self.scrubFeature();

                self.showElements();

            }, function(errorResponse) {

                self.showElements();

            });

        };

        self.scrubFeature = function() {

            delete self.tag.geometry;
            delete self.tag.properties.creator;
            delete self.tag.properties.last_modified_by;

        };

        self.saveTag = function() {

            console.log('self.saveTag', self.tag);

            self.status.processing = true;

            self.scrubFeature();

            if (typeof self.tag.properties.group !== 'string' &&
                self.tag.properties.group.name) {

                self.tag.properties.group = self.tag.properties.group.name;

            }

            self.tag.$update().then(function(successResponse) {

                self.tag = successResponse;

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Tag changes saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            }, function(errorResponse) {

                // Error message

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Tag changes could not be saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            });

        };

        self.deleteFeature = function() {

            Tag.delete({
                id: +self.deletionTarget.id
            }).$promise.then(function(data) {

                self.alerts.push({
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Successfully deleted this tag.',
                    'prompt': 'OK'
                });

                $timeout(closeRoute, 2000);

            }).catch(function(errorResponse) {

                console.log('self.deleteFeature.errorResponse', errorResponse);

                if (errorResponse.status === 409) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this tag.',
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

                self.loadTag();

            });

        } else {

            $location.path('/login');

        }

    });