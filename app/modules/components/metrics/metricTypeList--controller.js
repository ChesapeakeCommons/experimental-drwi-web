'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('MetricTypeListController',
        function(Account, $location, $log, MetricType,
            metricTypes, $rootScope, $route, $scope, user,
            $interval, $timeout, Utility) {

            var self = this;

            self.programId = $route.current.params.programId;

            $rootScope.viewState = {
                'metricType': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Metric Types'
            };

            self.showModal = {
                program: false
            };

            self.filters = {
                program: undefined
            };

            self.numericFilters = [
                'program'
            ];

            self.status = {
                loading: true
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.loadingFeatures = false;

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

                MetricType.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this metric.',
                        'prompt': 'OK'
                    }];

                    self.metrics.splice(index, 1);

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this metric.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this metric.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this metric.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.createMetricType = function() {

                self.metricType = new MetricType({
                    // 'program_id': self.programId,
                    'organization_id': $rootScope.user.organization_id
                });

                self.metricType.$save(function(successResponse) {

                    $location.path('/metric-types/' + successResponse.id + '/edit');

                }, function(errorResponse) {

                    console.error('Unable to create a new metric type, please try again later.');

                });

            };

            self.buildFilter = function() {

                console.log(
                    'self.buildFilter --> Starting...');

                var data = {
                    combine: 'true'
                };

                for (var key in self.filters) {

                    if (self.filters.hasOwnProperty(key)) {

                        if (self.numericFilters.indexOf(key) >= 0) {

                            var filterVal = +self.filters[key];

                            if (Number.isInteger(filterVal) &&
                                filterVal > 0) {

                                data[key] = filterVal;

                            }

                        } else {

                            data[key] = self.filters[key];

                        }

                    }

                }

                $location.search(data);

                return data;

            };

            self.loadFeatures = function(params) {

                self.status.loadingFeatures = true;

                MetricType.collection(params).$promise.then(function(successResponse) {

                    console.log('successResponse', successResponse);

                    self.summary = successResponse.summary;

                    self.metrics = successResponse.features;

                    self.showElements();

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                    self.showElements();

                });

            };

            // 
            // Observe internal route changes. Note that `reloadOnSearch`
            // must be set to `false`.
            // 
            // See: https://stackoverflow.com/questions/15093916
            // 

            self.inspectSearchParams = function(forceFilter) {

                var params = $location.search();

                console.log(
                    'self.inspectSearchParams --> params',
                    params);

                var keys = Object.keys(params);

                console.log(
                    'self.inspectSearchParams --> keys',
                    keys);

                if (!keys.length || forceFilter) {

                    params = self.buildFilter();

                    console.log(
                        'self.inspectSearchParams --> params(2)',
                        params);

                }

                for (var key in params) {

                    if (self.filters.hasOwnProperty(key)) {

                        if (self.numericFilters.indexOf(key) >= 0) {

                            var filterVal = +params[key];

                            console.log(
                                'self.inspectSearchParams --> filterVal',
                                filterVal);

                            if (Number.isInteger(filterVal)) {

                                self.filters[key] = filterVal;

                            }

                        } else {

                            self.filters[key] = params[key];

                        }

                    }

                }

                self.loadFeatures(params);

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    var programs = Utility.extractUserPrograms($rootScope.user);

                    programs.unshift({
                        id: 0,
                        name: 'All programs'
                    });

                    self.programs = programs;

                    self.filters.program = self.programs[0].id;

                    self.inspectSearchParams();

                });

            } else {

                $location.path('/logout');

            }

        });