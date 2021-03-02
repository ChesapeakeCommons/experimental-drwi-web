(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteEditController
     * @description
     * # SiteEditController
     * Controller of the FieldDoc
     */
    angular.module('FieldDoc')
        .controller('SiteEditController',
            function(Account, environment, $http, $location, mapbox,
                Notifications, Site, site, $rootScope, $route, $scope,
                $timeout, $interval, user, Shapefile, Utility) {

                var self = this;

                $rootScope.toolbarState = {
                    'edit': true
                };

                $rootScope.page = {};

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

                self.scrubFeature = function(feature) {

                    var excludedKeys = [
                        'allocations',
                        'creator',
                        'dashboards',
                        'geographies',
                        'geometry',
                        'images',
                        'last_modified_by',
                        'members',
                        'metrics',
                        'metric_types',
                        'organization',
                        'partners',
                        'partnerships',
                        'practices',
                        'practice_types',
                        'program',
                        'project',
                        'reports',
                        'sites',
                        'status',
                        'tags',
                        'tasks',
                        'users'
                    ];

                    var reservedProperties = [
                        'links',
                        'map_options',
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

                self.saveSite = function() {

                    self.status.processing = true;

                    self.scrubFeature(self.site);

                    Site.update({
                        id: self.site.id
                    }, self.site).then(function(successResponse) {

                        self.site = successResponse;

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Site changes saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    }).catch(function(errorResponse) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong and the changes could not be saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    });

                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                    self.status.processing = false;

                }

                function closeRoute() {

                    $location.path(self.site.links.project.html);

                }

                self.confirmDelete = function(obj) {

                    console.log('self.confirmDelete', obj);

                    self.deletionTarget = self.deletionTarget ? null : obj;

                };

                self.cancelDelete = function() {

                    self.deletionTarget = null;

                };

                self.deleteFeature = function() {

                    Site.delete({
                        id: +self.deletionTarget.id
                    }).$promise.then(function(data) {

                        self.alerts.push({
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this site.',
                            'prompt': 'OK'
                        });

                        $timeout(closeRoute, 2000);

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this site.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this site.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this site.',
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

                        site.$promise.then(function(successResponse) {

                            console.log('self.site', successResponse);

                            self.site = successResponse;

                            if (successResponse.permissions.read &&
                                successResponse.permissions.write) {

                                self.makePrivate = false;

                            } else {

                                self.makePrivate = true;

                            }

                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

                            $rootScope.page.title = self.site.name;

                            self.showElements();

                        }, function(errorResponse) {

                            self.showElements();

                        });

                    });

                } else {

                    $location.path('/logout');

                }

            });

}());