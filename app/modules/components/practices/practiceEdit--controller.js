'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeEditController',
        function(Account, Image, $log, $location, Media, Practice,
                 PracticeType, practice, Project, $q, $rootScope,
                 $route, $scope, $timeout, $interval, site, user, Utility) {

            var self = this;

            $rootScope.toolbarState = {
                'edit': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                if (self.practice.site !== null) {
                    $location.path(self.practice.links.site.html);
                } else {
                    $location.path("/projects/" + self.practice.project.id);
                }

            }

            function railsRedirection(){
                window.location.replace("/practices/"+self.practice.id+"/location");
            }

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 50);

            };

            self.loadSite = function() {

                site.$promise.then(function(successResponse) {

                    console.log('self.site', successResponse);

                    self.site = successResponse;

                    self.loadPractice();

                }, function(errorResponse) {

                    //

                });

            };

            self.loadPractice = function() {

                practice.$promise.then(function(successResponse) {

                    console.log('self.practice', successResponse);

                    self.practice = successResponse;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        return;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    if (successResponse.practice_type) {

                        self.practiceType = successResponse.practice_type;

                    }

                    if (successResponse.site_id){
                        self.site = successResponse.site;
                    }

                    $rootScope.page.title = self.practice.name ? self.practice.name : 'Un-named Practice';

                    self.loadSites();

                    self.processSetup(self.practice.setup);

                    //
                    // Load practice types
                    //

                    PracticeType.collection({
                        program: self.practice.project.program_id,
                        limit: 500,
                        group: 'alphabet',
                        minimal: true,
                        program_only: true
                    }).$promise.then(function(successResponse) {

                        console.log('self.practiceTypes', successResponse);

                        self.practiceTypes = successResponse.features.groups;

                        self.summary = successResponse.summary;

                        self.letters = successResponse.features.letters;

                        self.showElements();

                    }, function(errorResponse) {

                        //

                        self.showElements();

                    });

                }, function(errorResponse) {

                    //

                });

            };

            /*START STATE CALC*/

            self.processSetup = function(setup){

                const next_action = setup.next_action;

                self.states = setup.states;

                self.next_action = next_action;

                console.log("self.states",self.states);

                console.log("self.next_action",self.next_action);

                console.log("self.next_action_lable",self.next_action_lable);

            };

            /*END STATE CALC*/

            self.loadSites = function() {

                console.log('self.loadSites --> Starting...');

                Project.sites({
                    id: self.practice.project.id,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('Project sites --> ', successResponse);

                    var sites = [];

                    successResponse.features.forEach(function(item) {

                        var data = item.properties;

                        if (typeof data.name === 'string' &&
                            data.name.length) {

                            sites.push(data);

                        }

                    });

                    self.sites = sites;

                }, function(errorResponse) {

                    console.log('loadSites.errorResponse', errorResponse);

                });

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

            self.savePractice = function() {

                self.status.processing = true;

                self.scrubFeature(self.practice);

                if (self.practiceType) {

                    self.practice.practice_type_id = self.practiceType.id;

                }

                var invalid = [];

                self.invalidType = false;
                self.invalidName = false;

                if (typeof self.practice.name === 'undefined') {

                    console.log("self.practice.name", self.practice.name);

                    invalid.push("Name");

                    self.invalidName = true;

                }

                if (typeof self.practice.practice_type_id === 'undefined') {

                    console.log("self.practiceType", self.practiceType);

                    invalid.push("Practice Type");

                    self.invalidType = true;

                }

                if (invalid.length > 0) {

                    self.status.processing = false;

                    console.log("invalid",invalid);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'One or more required fields are missing!',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                } else {

                    Practice.update({
                        id: self.practice.id
                    }, self.practice).then(function(successResponse) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practice changes saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        if (self.practice.geometry === null) {
                            $timeout(railsRedirection,3000);
                        }

                        self.showElements();

                    }).catch(function(errorResponse) {

                        // Error message

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practice changes could not be saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        self.showElements();

                    });

                }

            };

            /*END STATE CALC*/

            self.setPracticeType = function($item, $model, $label) {

                console.log('self.practiceType', $item);

                self.practiceType = $item;

                self.practice.practice_type_id = $item.id;

            };

            self.setSite = function($item) {

                console.log('self.site', $item);

                self.site = $item;

                self.practice.site_id = $item.id;

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

                    self.loadPractice();
                });

            } else {

                $location.path('/logout');

            }

        });