'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ExportsController',
        function(Account, $location, $log, Export, Tag,
                 $rootScope, $scope, Site, user, mapbox,
                 $interval, $timeout, Utility, QueryParamManager) {

            var self = this;

            $rootScope.viewState = {
                'export': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Exports',
                actions: []
            };

            self.showModal = {};

            self.status = {
                loading: true
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

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

                Export.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this export.',
                        'prompt': 'OK'
                    }];

                    self.exports.splice(index, 1);

                    self.summary.feature_count--;

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this export.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this export.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this export.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.loadExports = function(params) {

                console.log(
                    'loadExports:params:',
                    params
                );

                params = QueryParamManager.adjustParams(
                    params,
                    {
                        combine: 'true'
                    });

                self.queryParams = QueryParamManager.getParams();

                Export.query(params).$promise.then(function(successResponse) {

                    successResponse.features.forEach(function(feature) {

                        if (feature.extent) {

                            feature.staticURL = Utility.buildStaticMapURL(
                                feature.extent,
                                null,
                                400,
                                200);

                        }

                    });

                    self.exports = successResponse.features;

                    self.summary = successResponse.summary;

                    self.summary.organizations.unshift({
                        id: 0,
                        name: 'All'
                    });

                    self.showElements();

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                    self.showElements();

                });

            };

            self.toggleTable = function () {

                $rootScope.collapseSidebar = !$rootScope.collapseSidebar;

                self.viewTable = !self.viewTable;

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.user = userResponse;

                    self.permissions = {};

                    var programs = Utility.extractUserPrograms($rootScope.user);

                    programs.unshift({
                        id: 0,
                        name: 'All'
                    });

                    self.programs = programs;

                    //
                    // Set default query string params.
                    //

                    var existingParams = QueryParamManager.getParams();

                    QueryParamManager.setParams(
                        existingParams,
                        true);

                    //
                    // Set scoped query param variable.
                    //

                    self.queryParams = QueryParamManager.getParams();

                    //
                    // Export functionality
                    //

                    self.loadExports(self.queryParams);

                });

            } else {

                $location.path('/logout');

            }

        });