(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:FeatureTagController
     * @description
     * # FeatureTagController
     * Controller of the FieldDoc
     */
    angular.module('FieldDoc')
        .controller('FeatureTagController',
            function(Account, Collaborators, $window, $rootScope, $scope, $route,
                $location, $timeout, user, SearchService, featureCollection,
                feature, Utility, $interval, toolbarUrl, viewState) {

                var self = this;

                self.featureCollection = featureCollection;

                self.toolbarUrl = toolbarUrl;

                $rootScope.page = {};

                $rootScope.viewState = viewState;

                $rootScope.toolbarState = {
                    'editTags': true
                };

                self.status = {
                    loading: true,
                    processing: false
                };

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                    }, 500);

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

                self.searchTags = function(value) {

                    return SearchService.tag({
                        q: value
                    }).$promise.then(function(response) {

                        console.log('SearchService response', response);

                        return response.results.slice(0, 5);

                    });

                };

                self.addTag = function(item, model, label) {

                    // var _datum = {
                    //     id: item.id,
                    //     properties: item
                    // };

                    self.tempTags.push(item);

                    self.tagQuery = null;

                    console.log('Updated tags (addition)', self.tempTags);

                };

                self.removeTag = function(id) {

                    var _index;

                    self.tempTags.forEach(function(item, idx) {

                        if (item.id === id) {

                            _index = idx;

                        }

                    });

                    console.log('Remove tag at index', _index);

                    if (typeof _index === 'number') {

                        self.tempTags.splice(_index, 1);

                    }

                    console.log('Updated tags (removal)', self.tempTags);

                };

                self.processTags = function(list) {

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

                self.scrubFeature = function(feature) {

                    var excludedKeys = [
                        'creator',
                        'dashboards',
                        'geometry',
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
                        'project',
                        'properties',
                        'reports',
                        'targets',
                        'tasks',
                        'site',
                        'sites',
                        'status',
                        'users'
                    ];

                    // var reservedProperties = [
                    //     'links',
                    //     'permissions',
                    //     '$promise',
                    //     '$resolved'
                    // ];

                    excludedKeys.forEach(function(key) {

                        if (feature.properties) {

                            delete feature.properties[key];

                        } else {

                            delete feature[key];

                        }

                    });

                    // reservedProperties.forEach(function(key) {

                    //     delete feature[key];

                    // });

                    return feature;

                };

                self.extractProperties = function(feature) {

                    if (feature.properties) {

                        for (var attr in feature.properties) {

                            feature[attr] = feature.properties[attr];

                        }

                        delete feature.properties;

                    } else {

                        return feature;

                    }

                };

                self.saveFeature = function() {

                    self.status.processing = true;

                    self.scrubFeature(self.feature);

                    self.feature.tags = self.processTags(self.tempTags);

                    // feature.$update().then(function(successResponse) {

                    console.log('self.saveFeature:self.feature', self.feature);

                    self.featureCollection.cls.update({
                        id: self.feature.id
                    }, self.feature).then(function(successResponse) {

                        console.log('saveFeature.successResponse', successResponse);

                        self.feature = successResponse;

                        self.extractProperties(self.feature);

                        console.log('self.feature', self.feature);

                        if (self.feature.tags.length) {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Tags added to ' + self.featureCollection.name + '.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'All tags removed from ' + self.featureCollection.name + '.',
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
                            'msg': 'Tag changes not saved.',
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
                        // feature.$promise.then(function(successResponse) {

                        self.featureCollection.cls.get({
                            id: self.featureCollection.featureId
                        }).$promise.then(function(successResponse) {

                            console.log('GET.successResponse', successResponse);

                            self.feature = successResponse;

                            self.extractProperties(self.feature);

                            console.log('self.feature', self.feature);

                            if (!successResponse.permissions.read &&
                                !successResponse.permissions.write) {

                                self.makePrivate = true;

                            } else {

                                self.permissions.can_edit = successResponse.permissions.write;
                                self.permissions.can_delete = successResponse.permissions.write;

                                $rootScope.page.title = self.feature.name;

                                self.tempTags = self.feature.tags;

                                console.log('tempTags', self.tempTags);

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