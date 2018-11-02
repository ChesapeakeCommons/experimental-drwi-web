'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationEditViewController',
        function(Account, $location, $log, Notifications, $rootScope,
            $route, user, User, Organization, SearchService, $timeout) {

            var self = this;

            $rootScope.viewState = {
                'organization': true
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            //
            // Assign project to a scoped variable
            //
            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = self.user = userResponse;

                    self.permissions = {
                        isLoggedIn: Account.hasToken(),
                        role: $rootScope.user.properties.roles[0].properties.name,
                        account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null
                    };

                    //
                    // Setup page meta data
                    //
                    $rootScope.page = {
                        'title': 'Edit Organization'
                    };

                    //
                    // Load organization data
                    //

                    if (self.user.properties.organization) {

                        self.loadOrganization(self.user.properties.organization_id);

                    }

                });


            } else {
                //
                // If there is not Account.userObject and no user object, then the
                // user is not properly authenticated and we should send them, at
                // minimum, back to the projects page, and have them attempt to
                // come back to this page again.
                //
                $location.path('/account/login');

            }

            //
            //
            //
            self.status = {
                'processing': false
            };

            self.saveOrganization = function() {

                self.status.processing = true;

                Organization.update({
                    id: self.organization.id
                }, self.organization).$promise.then(function(successResponse) {

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully updated your organization profile.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                    self.parseFeature(successResponse);

                }, function(errorResponse) {

                    self.status.processing = false;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Unable to update your organization profile.',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                });

            };

            self.parseFeature = function(data) {

                self.organization = data.properties;

                delete self.organization.creator;
                delete self.organization.last_modified_by;
                delete self.organization.project;
                delete self.organization.snapshots;

                console.log('self.organization', self.organization);

            };

            self.loadOrganization = function(organizationId, postAssigment) {

                Organization.get({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.parseFeature(successResponse);

                    if (postAssigment) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully added you to ' + self.organization.name + '.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    }

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                });

            };

            self.updateRelation = function(organizationId) {

                var _user = new User({
                    'id': self.user.id,
                    'first_name': self.user.properties.first_name,
                    'last_name': self.user.properties.last_name,
                    'organization_id': organizationId
                });

                _user.$update(function(successResponse) {

                    self.status.processing = false;

                    $rootScope.user = Account.userObject = self.user = successResponse;

                    if (self.user.properties.organization) {

                        self.loadOrganization(self.user.properties.organization_id, true);

                    }

                }, function(errorResponse) {

                    self.status.processing = false;

                });

            };

            self.assignOrganization = function() {

                console.log('self.organizationSelection', self.organizationSelection);

                self.status.processing = true;

                if (typeof self.organizationSelection === 'string') {

                    var _organization = new Organization({
                        'name': self.organizationSelection
                    });

                    _organization.$save(function(successResponse) {

                        self.parseFeature(successResponse);

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully created ' + self.organization.name + '.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        self.updateRelation(self.organization.id);

                    }, function(errorResponse) {

                        self.status.processing = false;

                    });

                } else {

                    self.updateRelation(self.organizationSelection.id);

                }

            };

            self.searchOrganizations = function(value) {

                return SearchService.organizations({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService.organizations response', response);

                    response.results.forEach(function(result) {

                        result.category = null;

                    });

                    return response.results.slice(0, 5);

                });

            };

        });