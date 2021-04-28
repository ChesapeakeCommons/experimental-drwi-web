'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeTypeEditController', [
        'Account',
        '$location',
        '$log',
        'PracticeType',
        'practiceType',
        '$q',
        '$rootScope',
        '$route',
        '$timeout',
        '$interval',
        'user',
        'Utility',
        function(Account, $location, $log, PracticeType, practiceType,
                 $q, $rootScope, $route, $timeout, $interval, user, Utility) {

        var self = this;

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

            $location.path('/programs/' + self.programId + '/practice-types');

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

        self.parseFeature = function(data) {

            if (data.program &&
                typeof data.program !== 'undefined') {

                self.programId = data.program_id;

            }

            return data;

        };

        self.loadPracticeType = function() {

            practiceType.$promise.then(function(successResponse) {

                console.log('self.practiceType', successResponse);

                self.practiceType = self.parseFeature(successResponse);

                self.permissions = successResponse.permissions;

                if (!successResponse.permissions.read &&
                    !successResponse.permissions.write) {

                    self.makePrivate = true;

                    return;

                }

                $rootScope.page.title = self.practiceType.name ? self.practiceType.name : 'Un-named Practice Type';

                self.showElements();

            }, function(errorResponse) {

                self.showElements();

            });

        };

        self.scrubFeature = function(feature) {

            var excludedKeys = [
                'creator',
                'extent',
                'geometry',
                'last_modified_by',
                'model',
                'organization',
                'program',
                'projects',
                'tags',
                'tasks',
                'unit'
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

        self.savePracticeType = function() {

            self.status.processing = true;

            self.scrubFeature(self.practiceType);

            PracticeType.update({
                id: self.practiceType.id
            }, self.practiceType).then(function(successResponse) {

                self.practiceType = self.parseFeature(successResponse);

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Practice type changes saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            }).catch(function(errorResponse) {

                // Error message

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Practice type changes could not be saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            });

        };

        self.deleteFeature = function() {

            PracticeType.delete({
                id: +self.deletionTarget.id
            }).$promise.then(function(data) {

                self.alerts.push({
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Successfully deleted this practice type.',
                    'prompt': 'OK'
                });

                $timeout(closeRoute, 2000);

            }).catch(function(errorResponse) {

                console.log('self.deleteFeature.errorResponse', errorResponse);

                if (errorResponse.status === 409) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete “' + self.deletionTarget.name + '”. There are pending tasks affecting this practice type.',
                        'prompt': 'OK'
                    }];

                } else if (errorResponse.status === 403) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'You don’t have permission to delete this practice type.',
                        'prompt': 'OK'
                    }];

                } else {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong while attempting to delete this practice type.',
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

                self.loadPracticeType();

            });

        } else {

            $location.path('/logout');

        }

    }]);