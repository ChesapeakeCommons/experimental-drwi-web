'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('MapListController',
        function(Account, $location, $log, MapInterface, Tag,
                 $rootScope, $scope, Site, User, user, mapbox,
                 $interval, $timeout, Utility, QueryParamManager,
                 AtlasDataManager) {

            var self = this;

            $rootScope.viewState = {
                'map': true
            };

            //
            // Setup basic page variables
            //
            $rootScope.page = {
                title: 'Maps',
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

                }, 250);

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

                MapInterface.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this map.',
                        'prompt': 'OK'
                    }];

                    self.maps.splice(index, 1);

                    self.summary.feature_count--;

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this map.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this map.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this map.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(closeAlerts, 2000);

                });

            };

            self.loadMaps = function(params) {

                console.log(
                    'loadMaps:params:',
                    params
                );

                params = QueryParamManager.adjustParams(params);

                self.queryParams = QueryParamManager.getParams();

                MapInterface.query(params).$promise.then(function(successResponse) {

                    successResponse.features.forEach(function (feature) {

                        var filterString = AtlasDataManager.createFilterString(
                            feature
                        );

                        console.log(
                            'loadMaps:filterString',
                            filterString
                        );

                        feature.atlasParams = AtlasDataManager.createURLData(
                            null,
                            true,
                            {
                                filterString: filterString,
                                style: feature.style
                            }
                        );

                    });

                    self.maps = successResponse.features;

                    self.summary = successResponse.summary;

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

            self.loadFilterOptions = function () {

                User.atlasFilters().$promise.then(function(successResponse) {

                    self.filterOptions = successResponse;

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.user = userResponse;

                    self.permissions = {};

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

                    self.loadMaps();

                    self.loadFilterOptions();

                });

            } else {

                $location.path('/logout');

            }

        });