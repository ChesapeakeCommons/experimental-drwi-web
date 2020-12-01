'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('DashboardGeographyController',
        function($scope, Account, $location, $log, Dashboard, dashboard,
            $rootScope, $route, user, FilterStore, $timeout, SearchService,
            GeographyService, $window) {

            var self = this;

            $rootScope.viewState = {
                'dashboard': true
            };

            $rootScope.toolbarState = {
                'editGeographies': true
            };

            $rootScope.page = {};

            self.searchScope = {
                target: 'geography'
            };

            self.status = {
                processing: true
            };

            self.alerts = [];

            self.closeAlerts = function() {

                self.alerts = [];

            };

            self.closeRoute = function() {

                $location.path('/dashboards');

            };

            self.confirmDelete = function(obj) {

                self.deletionTarget = self.deletionTarget ? null : obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.loadDashboard = function() {

                //
                // Assign dashboard to a scoped variable
                //
                Dashboard.get({
                    id: $route.current.params.dashboardId
                }).$promise.then(function(successResponse) {

                    self.processDashboard(successResponse);

                }).catch(function(errorResponse) {

                    console.log('Unable to load dashboard');

                    self.status.processing = false;

                });

            };

            self.search = function(value) {

                if (self.searchScope.target === 'geography') {

                    return SearchService.geography({
                        q: value
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        response.results.forEach(function(result) {

                            result.category = null;

                        });

                        return response.results.slice(0, 5);

                    });

                } else {

                    return SearchService.program({
                        q: value
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        response.results.forEach(function(result) {

                            result.category = null;

                        });

                        return response.results.slice(0, 5);

                    });

                }

            };

            self.directQuery = function(item, model, label) {

                if (self.searchScope.target === 'program') {

                    self.loadFeatures(item.id);

                } else {

                    self.addGeography(item);

                }

            };

            self.clearAll = function() {

                self.tempGeographies = [];

            };

            self.addGeography = function(item) {

                var _datum = {
                    id: item.id,
                    properties: item
                };

                self.tempGeographies.push(_datum);

                self.geographyQuery = null;

                console.log('Updated geographies (addition)', self.tempGeographies);

            };

            self.removeGeography = function(id) {

                var _index;

                self.tempGeographies.forEach(function(item, idx) {

                    if (item.id === id) {

                        _index = idx;

                    }

                });

                console.log('Remove geography at index', _index);

                if (typeof _index === 'number') {

                    self.tempGeographies.splice(_index, 1);

                }

                console.log('Updated geographies (removal)', self.tempGeographies);

            };

            self.processGeographies = function(list) {

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

            self.loadFeatures = function(programId) {

                var params = {
                    program: programId,
                    exclude_geometry: true,
                    scope: 'all'
                };

                GeographyService.collection(params).$promise.then(function(successResponse) {

                    console.log('successResponse', successResponse);

                    successResponse.features.forEach(function(feature) {

                        self.addGeography(feature);

                    });

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                    self.showElements();

                });

            };

            self.processDashboard = function(data) {

                self.dashboardObject = data.properties || data;

                self.tempGeographies = self.dashboardObject.geographies;

                self.status.processing = false;

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'geometry',
                    'images',
                    'metrics',
                    'last_modified_by',
                    'organizations',
                    'organization',
                    'practices',
                    'programs',
                    'projects',
                    'tags'
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

            self.saveDashboard = function() {

                self.status.processing = true;

                self.scrubFeature(self.dashboardObject);

                self.dashboardObject.geographies = self.processGeographies(self.tempGeographies);

                console.log('self.saveDashboard.dashboardObject', self.dashboardObject);

                console.log('self.saveDashboard.Dashboard', Dashboard);

                Dashboard.update({
                    id: +self.dashboardObject.id
                }, self.dashboardObject).then(function(successResponse) {

                    self.processDashboard(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Dashboard changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    $window.scrollTo(0, 0);

                }).catch(function(error) {

                    console.log('saveDashboard.error', error);

                    // Do something with the error

                    self.status.processing = false;

                });

            };

            self.deleteFeature = function() {

                var targetId;

                if (self.dashboardObject.properties) {

                    targetId = self.dashboardObject.properties.id;

                } else {

                    targetId = self.dashboardObject.id;

                }

                Dashboard.delete({
                    id: +targetId
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this dashboard.',
                        'prompt': 'OK'
                    });

                    $timeout(self.closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.dashboardObject.properties.name + '”. There are pending tasks affecting this dashboard.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this dashboard.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this dashboard.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.loadDashboard();

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Edit dashboard geographies'
                    };

                });

            } else {

                $location.path('/logout');

            }

        });