'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationProfileController',
        function(Project, Account, $location, $log, Notifications, $rootScope,
                 $route, $routeParams, user, User, Organization, SearchService, $timeout, Utility) {

            var self = this;

            $rootScope.viewState = {
                'organization': true
            };

            self.status = {
                loading: true,
                processing: false
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            var featureId = $routeParams.id;

            self.loadOrganization = function(organizationId) {

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;

                    self.permissions.write = successResponse.has_owner && self.permissions.write;

                    self.status.loading = false;

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.status.loading = false;

                });

            };

            self.loadOrganizationProjects = function(organizationId, postAssigment) {

                Organization.projects({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.loadOrganizationProjects - >', successResponse);

                    successResponse.features.forEach(function(feature) {

                        if (feature.extent) {

                            feature.staticURL = Utility.buildStaticMapURL(feature.extent);

                        }

                    });

                    self.organizationProjects = successResponse.features;

                    console.log('self.organizationProjects - >', self.organizationProjects);

                    self.projects = successResponse.features;

                    console.log('self.projects', self.projects);

                    self.projectCount = successResponse.count;

                    if (postAssigment) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully added you to ' + self.feature.name + '.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    }

                    self.status.loading = false;

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.status.loading = false;

                });

            };

            self.parseMembers = function(members){
                console.log('members', members);
                var i = 0;
                for (var m in members) {
                    if(  self.organizationMembers[i].picture != null){
                        var picture =   self.members[i].picture;
                        console.log(self.members[i].picture);
                        self.members[i].picture = picture.replace("original", "square");
                        console.log(self.members[i].picture);

                    }
                    i++;
                }
            };

            self.loadOrganizationMembers = function(organizationId) {

                Organization.members({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organizationMembers', successResponse);

                    self.organizationMembers = successResponse.features;

                    self.members = successResponse.features;

                    self.parseMembers(self.members);

                    self.memberCount = successResponse.count;

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
                        'title': 'Organization'
                    };

                    //
                    // Load organization data
                    //
                    if (featureId) {

                        self.loadOrganization(featureId);

                        self.loadOrganizationMembers(featureId);

                    } else {

                        self.status.loading = false;

                    }

                });


            } else {

                $location.path('/logout');

            }

        });