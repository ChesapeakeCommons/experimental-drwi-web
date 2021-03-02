'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('FundingSourceListController',
        function(Account, $location, $log, FundingSource,
            fundingSources, $rootScope, $route, $scope, user,
            $interval, $timeout, Utility) {

            var self = this;

            self.programId = $route.current.params.programId;

            $rootScope.viewState = {
                'fundingSource': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Funding Sources'
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

                FundingSource.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this funding source.',
                        'prompt': 'OK'
                    }];

                    self.fundingSources.splice(index, 1);

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this funding source.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this funding source.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this funding source.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.createFundingSource = function() {

                self.fundingSource = new FundingSource({
                    'program_id': self.programId,
                    'agent_id': $rootScope.user.organization_id
                });

                self.fundingSource.$save(function(successResponse) {

                    $location.path('/funding-sources/' + successResponse.id + '/edit');

                }, function(errorResponse) {

                    console.error('Unable to create a new funding source, please try again later.');

                });

            };

            self.buildFilter = function() {

                var params = $location.search(),
                    data = {};

                if (self.selectedProgram &&
                    typeof self.selectedProgram.id !== 'undefined' &&
                    self.selectedProgram.id > 0) {

                    data.program = self.selectedProgram.id;

                    $location.search('program', self.selectedProgram.id);

                } else if (params.program !== null &&
                    typeof params.program !== 'undefined') {

                    data.program = params.program;

                } else {

                    $location.search({});

                }

                return data;

            };

            self.loadFeatures = function() {

                var params = self.buildFilter();

                FundingSource.collection(params).$promise.then(function(successResponse) {

                    console.log('successResponse', successResponse);

                    self.fundingSources = successResponse.features;

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

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.loadFeatures();

                });

            } else {

                $location.path('/logout');

            }

        });