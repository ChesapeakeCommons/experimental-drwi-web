'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProjectEditController',
        function(Account, $location, $log, Project, project,
            $rootScope, FilterStore, $route, user, SearchService, $timeout,
            Utility, $interval) {

            var self = this;

            $rootScope.viewState = {
                'project': true
            };

            $rootScope.toolbarState = {
                'edit': true
            };

            $rootScope.page = {};

            /* START Status Vars*/

            self.status = {
                loading: true,
                processing: true
            };

            self.project_status = [
                'draft',
                'active',
                'complete'

            ];

            /* END Status Vars*/


            /*START Date Vars*/

            //
            // Setup all of our basic date information so that we can use it
            // throughout the page
            //
            self.today = new Date();
            self.date = new Date();

            self.days = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ];

            self.months = [{
                    'shortName': 'Jan',
                    'name': 'January',
                    'numeric': '01'
                 },
                {
                    'shortName': 'Feb',
                    'name': 'February',
                    'numeric': '02'
                },
                {
                    'shortName': 'Mar',
                    'name': 'March',
                    'numeric': '03'
                },
                {
                    'shortName': 'Apr',
                    'name': 'April',
                    'numeric': '04'
                },
                {
                    'shortName': 'May',
                    'name': 'May',
                    'numeric': '05'
                },
                {
                    'shortName': 'Jun',
                    'name': 'June',
                    'numeric': '06'
                },
                {
                    'shortName': 'Jul',
                    'name': 'July',
                    'numeric': '07'
                },
                {
                    'shortName': 'Aug',
                    'name': 'August',
                    'numeric': '08'
                },
                {
                    'shortName': 'Sep',
                    'name': 'September',
                    'numeric': '09'
                },
                {
                    'shortName': 'Oct',
                    'name': 'October',
                    'numeric': '10'
                },
                {
                    'shortName': 'Nov',
                    'name': 'November',
                    'numeric': '11'
                },
                {
                    'shortName': 'Dec',
                    'name': 'December',
                    'numeric': '12'
                }
            ];



            function parseISOLike(s) {
                var b = s.split(/\D/);
                return new Date(b[0], b[1] - 1, b[2]);
            }

            /*END Date Vars*/

            self.showModal = {
                status: false
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 1000);

            };

            self.alerts = [];

            self.closeAlerts = function() {

                self.alerts = [];

            };

            self.closeRoute = function() {

                $location.path('/projects');

            };

            self.confirmDelete = function(obj) {

                self.deletionTarget = self.deletionTarget ? null : obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.searchPrograms = function(value) {

                return SearchService.program({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService.program response', response);

                    response.results.forEach(function(result) {

                        result.category = null;

                    });

                    return response.results.slice(0, 5);

                });

            };

            self.searchOrganizations = function(value) {

                return SearchService.organization({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService.organization response', response);

                    response.results.forEach(function(result) {

                        result.category = null;

                    });

                    return response.results.slice(0, 5);

                });

            };

            self.addRelation = function(item, model, label, collection, queryAttr) {

                var _datum = {
                    id: item.id,
                    properties: item
                };

                collection.push(_datum);

                queryAttr = null;

                console.log('Updated ' + collection + ' (addition)', collection);

            };

            self.removeRelation = function(id, collection) {

                var _index;

                collection.forEach(function(item, idx) {

                    if (item.id === id) {

                        _index = idx;

                    }

                });

                console.log('Remove item at index', _index);

                if (typeof _index === 'number') {

                    collection.splice(_index, 1);

                }

                console.log('Updated ' + collection + ' (removal)', collection);

            };

            self.processRelations = function(list) {

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

            self.processFeature = function(data) {

                self.project = data;

                if (self.project.program) {

                    self.program = self.project.program;

                }

                self.tempPartners = self.project.partners;

                self.status.processing = false;

                console.log("self.project", self.project);

            };

            self.setProgram = function(item, model, label) {

                self.project.program_id = item.id;

            };

            self.unsetProgram = function() {

                self.project.program_id = null;

                self.program = null;

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'extent',
                    'geometry',
                    'last_modified_by',
                    'organization',
                    'program',
                    'tags',
                    'tasks'
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

            self.saveProject = function() {

                self.status.processing = true;

                self.scrubFeature(self.project);


                if(self.date != undefined) {
                    if (self.date.month !== null &&
                        typeof self.date.date !== null &&
                        self.date.year !== null
                    ) {

                        self.months.forEach(function(m){

                           if(m.name === self.date.month){
                               self.date.month = m;
                           }

                        });
                        console.log("CCC",self.date.month);


                            self.project.completed_on = self.date.year + '-' + self.date.month.numeric + '-' + self.date.date;


                    } else {
                        self.project.completed_on = null;

                    }
                }



                self.project.partners = self.processRelations(self.tempPartners);

           //     self.project.workflow_state = "Draft";

                var exclude = [
                    'centroid',
                    'creator',
                    'dashboards',
                    'extent',
                    'geometry',
                    'members',
                    'metric_types',
                    // 'partners',
                    'practices',
                    'practice_types',
                    'properties',
                    'tags',
                    'targets',
                    'tasks',
                    'type',
                    'sites'
                ].join(',');

                console.log("self.project --> submit", self.project);

                Project.update({
                    id: $route.current.params.projectId,
                    exclude: exclude
                }, self.project).then(function(successResponse) {

                    self.processFeature(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Project changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                }).catch(function(error) {

                    // Do something with the error

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong and the changes could not be saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                });

            };

            self.deleteFeature = function() {

                var targetId;

                if (self.project) {

                    targetId = self.project.id;

                } else {

                    targetId = self.project.id;

                }

                Project.delete({
                    id: +targetId
                }).$promise.then(function(data) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this project.',
                        'prompt': 'OK'
                    });

                    $timeout(self.closeRoute, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + self.project.name + '”. There are pending tasks affecting this project.',
                            'prompt': 'OK'
                        }];

                    } else if (errorResponse.status === 403) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'You don’t have permission to delete this project.',
                            'prompt': 'OK'
                        }];

                    } else {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong while attempting to delete this project.',
                            'prompt': 'OK'
                        }];

                    }

                    $timeout(self.closeAlerts, 2000);

                });

            };

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {
                        isLoggedIn: Account.hasToken(),
                        role: $rootScope.user.properties.roles[0],
                        account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null,
                        can_edit: false,
                        can_delete: false
                    };
                    self.user = $rootScope.user;
                    console.log("self.user =",self.user);
                    //
                    // Assign project to a scoped variable
                    //
                    project.$promise.then(function(successResponse) {

                        if (!successResponse.permissions.read &&
                            !successResponse.permissions.write) {

                            self.makePrivate = true;

                        } else {

                            self.processFeature(successResponse);

                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

                            if (self.project.completed_on) {

                                self.project.completed_on = parseISOLike(self.project.completed_on);


                                self.date = {
                                    month: self.months[self.project.completed_on.getMonth()],
                                    date: self.project.completed_on.getDate(),
                                    day: self.days[self.project.completed_on.getDay()],
                                    year: self.project.completed_on.getFullYear()
                                };
                            }




                            console.log("!!!!!! self.date",self.date);

                            $rootScope.page.title = 'Edit Project';

                        }

                        self.showElements();

                    }, function(errorResponse) {

                        $log.error('Unable to load request project');

                        self.showElements();

                    });

                });

            } else {

                $location.path('/logout');

            }

        });