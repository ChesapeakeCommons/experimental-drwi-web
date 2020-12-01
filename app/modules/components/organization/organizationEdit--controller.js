'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationEditViewController',
        function(Account, $location, $log, Notifications, $rootScope,
                 $route, $routeParams, user, User, Organization, Image,
                 SearchService, $timeout) {

            var self = this;
            
            self.featureId = $routeParams.id;

            self.image = null;

            $rootScope.viewState = {
                'organization': true
            };

            self.status = {
                loading: true,
                processing: false,
                image: {
                    remove: false
                }
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            self.saveOrganization = function() {

                self.status.processing = true;

                self.scrubFeature(self.feature);

                if (self.image) {

                    var fileData = new FormData();

                    fileData.append('image', self.image);

                    Image.upload({}, fileData).$promise.then(function(successResponse) {

                        console.log('successResponse', successResponse);

                        self.feature.picture = successResponse.original;
                        
                        console.log(
                            'self.feature.picture: ',
                            self.feature.picture
                        );

                        self.update();

                    });

                } else {
                    
                    self.update();
                    
                }
                
            };

            self.removeImage = function() {

                self.feature.picture = null;
                
                self.status.image.remove = true;

                self.update();
                
            };

            self.update = function(){

                self.scrubFeature(self.feature);

                Organization.update({
                    id: self.featureId
                }, self.feature).then(function(successResponse) {

                    self.status.processing = false;
                    
                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Organization profile updated.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                }, function(errorResponse) {

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Unable to update organization profile.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                });

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'dashboards',
                    'geometry',
                    'last_modified_by',
                    'tags',
                    'tasks',
                    'user',
                    'projects',
                    'members'
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

            self.loadOrganization = function(organizationId, postAssigment) {

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.feature', successResponse);

                    self.feature = successResponse.properties ?  successResponse.properties : successResponse;

                    self.permissions = successResponse.permissions;

                    self.status.loading = false;

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.status.loading = false;

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = self.user = userResponse;

                    self.permissions = {};

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Edit Organization'
                    };

                    //
                    // Load organization data
                    //

                    self.loadOrganization(self.featureId);

                });


            } else {

                $location.path('/logout');

            }

        });