'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProgramListController',
        function(Account, $location, $log, Program,
            programs, $rootScope, $scope, user,
            $interval, $timeout, Utility, $route) {

            var self = this;

            self.programId = $route.current.params.programId;

            $rootScope.viewState = {
                'program': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Programs'
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

            self.deleteFeature = function(obj, index) {

                Program.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this program.',
                        'prompt': 'OK'
                    }];

                    self.programs.splice(index, 1);

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this program.',
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

            self.createProgram = function() {

                $location.path('/programs/collection/new');

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    programs.$promise.then(function(successResponse) {

                        console.log('successResponse', successResponse);

                        self.programs = successResponse.features;

                        self.showElements();

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                        self.showElements();

                    });

                });

            } else {

                $location.path('/logout');

            }

        });