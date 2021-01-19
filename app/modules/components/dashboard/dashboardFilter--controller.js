'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('DashboardFilterController',
        function($scope, Account, $location, $log, Dashboard, $rootScope,
            $route, user, $timeout, SearchService, Utility) {

            var self = this;

            $rootScope.viewState = {
                'dashboard': true
            };

            $rootScope.toolbarState = {
                'editFilters': true
            };

            $rootScope.page = {};

            self.status = {
                processing: true
            };

            self.modes = {
                filter: false,
                list: false
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

                var exclude = [
                    'creator',
                    'geographies',
                    'geometry',
                    'last_modified_by',
                    'metrics',
                ].join(',');

                //
                // Assign dashboard to a scoped variable
                //
                Dashboard.get({
                    id: $route.current.params.dashboardId,
                    exclude: exclude
                }).$promise.then(function(successResponse) {

                    self.processDashboard(successResponse);

                }).catch(function(errorResponse) {

                    console.log('Unable to load dashboard');

                    self.status.processing = false;

                });

            };

            self.loadProjects = function() {

                //
                // Assign dashboard to a scoped variable
                //
                Dashboard.availableProjects({
                    id: $route.current.params.dashboardId
                }).$promise.then(function(successResponse) {

                    self.projects = successResponse.features;

                    if (self.dashboardObject.select_all) {

                        self.markSelected();

                    }

                    if (self.modes.filter) {

                        self.projects.forEach(function(item) {

                            item.selected = false;

                        });

                    }

                }).catch(function(errorResponse) {

                    console.log('Unable to load dashboard projects.');

                });

            };

            self.processFilters = function(arr) {

                self.filters = Utility.groupByCategory(arr);

                console.log('self.processFilters', self.filters);

            };

            self.loadFilters = function() {

                //
                // Assign dashboard to a scoped variable
                //
                Dashboard.filters({
                    id: $route.current.params.dashboardId
                }).$promise.then(function(successResponse) {

                    self.processFilters(successResponse.features);

                }).catch(function(errorResponse) {

                    console.log('Unable to load dashboard filters.');

                });

            };

            self.setMode = function(value) {

                if (value === 0) {

                    self.modes.list = true;

                    self.modes.filter = false;

                    self.dashboardObject.user_only = true;

                } else {

                    self.modes.list = false;

                    self.modes.filter = true;

                    self.dashboardObject.user_only = false;

                    self.dashboardObject.projects = [];

                }

            };

            self.markSelected = function() {

                self.projects.forEach(function(feature) {

                    if (self.dashboardObject.select_all) {

                        feature.selected = true;

                    } else {

                        feature.selected = false;

                    }

                });

            };

            self.addFilter = function(item, model, label) {

                console.log('self.addFilter', self.filters, item, model, label);

                var match = false;

                if (self.filters.categories[item.category] &&
                    Array.isArray(self.filters.categories[item.category].collection)) {

                    self.filters.categories[item.category].collection.forEach(function(datum) {

                        if (datum.id === item.id &&
                            datum.category === item.category) {

                            match = true;

                        }

                    });

                    if (!match) {

                        self.filters.categories[item.category].collection.push(item);

                    }

                } else {

                    self.filters.categories[item.category] = {
                        'name': item.category,
                        'collection': [
                            item
                        ]
                    }

                }

                self.query = undefined;

            };

            self.clearFilter = function(obj, index) {

                self.filters.categories[obj.category].collection.splice(index, 1);

            };

            self.clearAllFilters = function(reload) {

                //
                // Remove all stored filter objects
                //

                self.filters = Utility.groupByCategory([]);

                console.log('self.clearAllFilters', self.filters);

            };

            self.updateCollection = function(obj, collection) {

                if (typeof self.dashboardObject[collection] === 'undefined') {

                    collection = 'tags';

                }

                self.dashboardObject[collection].push({
                    id: obj.id
                });

            };

            self.transformRelation = function(obj, category) {

                switch (category) {

                    case 'organization':

                        self.updateCollection(obj, 'organizations');

                        break;

                    case 'practice type':

                        self.updateCollection(obj, 'practices');

                        break;

                    case 'program':

                        self.updateCollection(obj, 'programs');

                        break;

                    case 'tag':

                        self.updateCollection(obj, 'tags');

                        break;

                    default:

                        self.updateCollection(obj, category);

                        break;

                }

            };

            self.parseKey = function(obj, pluralize) {

                var keyMap = {
                    plural: {
                        'organization': 'organizations',
                        'practice': 'practices',
                        'program': 'programs',
                        'tag': 'tags'
                    },
                    single: {
                        'organizations': 'organization',
                        'practices': 'practice',
                        'programs': 'program',
                        'tags': 'tag'
                    }
                };

                if (pluralize) {

                    return keyMap.plural[obj];

                }

                console.log('keyMap.single', obj, keyMap.single[obj]);

                return keyMap.single[obj];

            };

            self.search = function(value) {

                return SearchService.get({
                    q: value,
                    scope: 'dashboard'
                }).$promise.then(function(response) {

                    console.log('SearchService response', response);

                    return response.results.slice(0, 5);

                });

            };

            self.processDashboard = function(data) {

                //
                // Reset filters
                //

                self.clearAllFilters();

                self.dashboardObject = data.properties || data;

                console.log('self.processDashboard.dashboardObject', self.dashboardObject);

                if (self.dashboardObject.user_only) {

                    self.setMode(0);

                } else {

                    self.setMode(1);

                }

                self.status.processing = false;

                self.loadProjects();

                self.loadFilters();

            };

            self.processProjects = function(arr) {

                var selectedProjects = [];

                arr.forEach(function(item) {

                    if (item.selected) {

                        selectedProjects.push({
                            id: item.id
                        });

                    }

                });

                return selectedProjects;

            };

            self.processCollection = function(arr) {

                arr.forEach(function(filter) {

                    console.log('self.processCollection', filter, filter.category);

                    self.transformRelation(filter, filter.category);

                });

            };

            self.processRelations = function(obj) {

                angular.forEach(obj, function(value, key) {

                    console.log('self.processRelations', value, key);

                    self.processCollection(value.collection);

                });

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'geographies',
                    'images',
                    'last_modified_by',
                    'metrics'
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

            self.clearFilterCollections = function() {

                var filterCollections = [
                    'organizations',
                    'practices',
                    'programs',
                    'tags'
                ];

                filterCollections.forEach(function(collection) {

                    self.dashboardObject[collection] = [];

                });

            };

            self.saveDashboard = function() {

                self.status.processing = true;

                self.scrubFeature(self.dashboardObject);

                if (self.dashboardObject.user_only) {

                    self.dashboardObject.projects = self.processProjects(self.projects);

                    self.clearFilterCollections();

                } else {

                    self.clearFilterCollections();

                    self.dashboardObject.user_only = false;

                    self.dashboardObject.select_all = false;

                    self.dashboardObject.projects = [];

                    self.processRelations(self.filters.categories);

                }

                console.log('self.saveDashboard.dashboardObject', self.dashboardObject);

                var exclude = [
                    'creator',
                    'geographies',
                    'geometry',
                    'last_modified_by',
                    'metrics',
                ].join(',');

                Dashboard.update({
                    id: +self.dashboardObject.id,
                    exclude: exclude
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

                    self.query = null;

                }).catch(function(error) {

                    console.log('saveDashboard.error', error);

                    // Do something with the error

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong while attempting to update this dashboard.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    self.query = null;

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
                        'title': 'Edit dashboard filters'
                    };

                });

            } else {

                $location.path('/logout');

            }

        });