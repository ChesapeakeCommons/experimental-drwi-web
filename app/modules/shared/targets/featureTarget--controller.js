(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:FeatureTargetController
     * @description
     * # FeatureTargetController
     * Controller of the FieldDoc
     */
    angular.module('FieldDoc')
        .controller('FeatureTargetController',
            function(Account, Target, $window, $rootScope, $scope, $route,
                $location, $timeout, user, SearchService, featureCollection,
                feature, Utility, $interval) {

                var self = this;

                self.featureCollection = featureCollection;

                $rootScope.page = {};

                $rootScope.viewState = {
                    'feature': true
                };

                $rootScope.toolbarState = {
                    'editTargets': true
                };

                self.status = {
                    loading: true,
                    processing: false
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

                function closeRoute() {

                    $location.path(self.featureCollection.path);

                }

                self.confirmDelete = function(obj) {

                    self.deletionTarget = self.deletionTarget ? null : obj;

                };

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.searchTargets = function(value) {

                    return SearchService.target({
                        q: value
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        return response.results.slice(0, 5);

                    });

                };

                self.addTarget = function(item, model, label) {

                    var _datum = {
                        id: item.id,
                        properties: item
                    };

                    self.tempTargets.push(_datum);

                    self.targetQuery = null;

                    console.log('Updated targets (addition)', self.tempTargets);

                };

                self.removeTarget = function(id) {

                    var _index;

                    self.tempTargets.forEach(function(item, idx) {

                        if (item.id === id) {

                            _index = idx;

                        }

                    });

                    console.log('Remove target at index', _index);

                    if (typeof _index === 'number') {

                        self.tempTargets.splice(_index, 1);

                    }

                    console.log('Updated targets (removal)', self.tempTargets);

                };

                self.processTargets = function(list) {

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

                self.scrubFeature = function() {

                    var excludedKeys = [
                        'creator',
                        'dashboards',
                        'geographies',
                        'last_modified_by',
                        'members',
                        'metrics',
                        'metric_types',
                        'organization',
                        'partners',
                        'practices',
                        'practice_types',
                        'program',
                        'reports',
                        'sites',
                        'status',
                        'users'
                    ];

                    var reservedProperties = [
                        'links',
                        'permissions',
                        '$promise',
                        '$resolved'
                    ];

                    excludedKeys.forEach(function(key) {

                        delete feature.properties[key];

                    });

                    reservedProperties.forEach(function(key) {

                        delete feature[key];

                    });

                };

                self.saveFeature = function() {

                    self.status.processing = true;

                    self.scrubFeature();

                    feature.properties.targets = self.processTargets(self.tempTargets);

                    var data = feature.properties;

                    data.geometry = self.feature.geometry;

                    // feature.$update().then(function(successResponse) {

                    self.featureCollection.cls.update({
                        id: self.feature.id
                    }, data).$promise.then(function(successResponse) {

                        console.log('saveFeature.successResponse', successResponse);

                        self.feature = successResponse.properties;

                        if (self.feature.targets.length) {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Targets added to ' + self.featureCollection.name + '.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'All targets removed from ' + self.featureCollection.name + '.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(closeAlerts, 2000);

                        self.status.processing = false;

                    }).catch(function(errorResponse) {

                        console.log('saveFeature.errorResponse', errorResponse);

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Target changes not saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        self.status.processing = false;

                    });

                };

                self.deleteFeature = function() {

                    var targetId = self.feature.id;

                    self.featureCollection.cls.delete({
                        id: +targetId
                    }).$promise.then(function(data) {

                        self.alerts.push({
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this ' + self.featureCollection.name + '.',
                            'prompt': 'OK'
                        });

                        $timeout(closeRoute, 2000);

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + self.feature.name + '”. There are pending tasks affecting this ' + self.featureCollection.name + '.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this ' + self.featureCollection.name + '.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this ' + self.featureCollection.name + '.',
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

                        //
                        // Assign feature to a scoped variable
                        //
                        feature.$promise.then(function(successResponse) {

                            console.log('self.feature', successResponse);

                            self.feature = successResponse.properties || successResponse;

                            if (!successResponse.permissions.read &&
                                !successResponse.permissions.write) {

                                self.makePrivate = true;

                            } else {

                                self.permissions.can_edit = successResponse.permissions.write;
                                self.permissions.can_delete = successResponse.permissions.write;

                                $rootScope.page.title = self.feature.name;

                                self.tempTargets = self.feature.targets;

                                console.log('tempTargets', self.tempTargets);

                            }

                            self.showElements();

                        }, function(errorResponse) {

                            console.error('Unable to load request feature');

                            self.showElements();

                        });

                    });

                } else {

                    $location.path('/login');

                }

            });

}());