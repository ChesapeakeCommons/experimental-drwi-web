'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProjectGrantController',
        function(Account, $location, $log, Project, project, Organization,
            $rootScope, $route, user, SearchService, $timeout,
            Utility, $interval) {

            var self = this;

            $rootScope.viewState = {
                'project': true
            };

            $rootScope.toolbarState = {
                'grant': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 500);

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

            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {
                        can_edit: false,
                        can_delete: false
                    };

                    console.log("user -->",  $rootScope.user);

                    self.loadOrganization(Account.userObject.organization_id);


                });

            } else {

                $location.path('/logout');

            }


            /*Load Organization*/

            self.loadOrganization = function(organizationId, postAssigment) {

                console.log("Load Organization");

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;

                    self.availablePrograms = self.feature.programs;

                 //   self.summary.program_count = self.feature.programs.length;

                    if (postAssigment) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully added you to ' + self.feature.name + '.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                    }

                    self.loadProject();

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.loadProject();

                //    self.status.loading = false;

                });

            };


            self.loadProject = function(){

                //
                // Assign project to a scoped variable
                //
                project.$promise.then(function(successResponse) {

                    console.log("self.project-->",successResponse);

                    self.project = successResponse;

                    self.projectPrograms = self.project.programs;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                    } else {

                        self.processFeature(successResponse);

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = 'Edit Project';

                    }

                    console.log("available programs -->", self.availablePrograms);

                    /*So, we're going to use some temporary controller array of objects
                    * (self.availableProgram and self.projectsProgram to track what programs
                    * are available on the organization level vs what programs have been added to project.
                    * we do this by looping over the organization programs, then checking that program
                    * exists under the project. We add the attribute 'active' as false first, then update
                    * to true if it exists.
                    * */

                    let i = 0;
                    self.availablePrograms.forEach(function(availProgram){
                        self.availablePrograms[i].active = false;
                        self.projectPrograms.forEach(function(projProgram){
                            if(availProgram.program.id == projProgram.id){
                                self.availablePrograms[i].active = true;
                                self.availablePrograms[i].is_organization_program = true;
                            }

                        });
                        i = i+1;
                    });

                    /*The below logic should not need to be used, as a program must be added to a
                    * project on creation. However, it represents a stop-gap for now if 1)
                    * a program does not exist, and 2) if all programs are removed from
                    * the project. This will set the default program to an active program in
                    * our temporary array of program objects. Yay!
                    * */

                    if(self.projectPrograms.length == 0){
                        i = 0;
                        self.availablePrograms.forEach(function(availProgram){
                            if(availProgram.main == true){
                                self.availablePrograms[i].active = true;
                                self.availablePrograms[i].is_organization_program = true;
                            }
                        i = i+1;
                        });

                    }

                    console.log("available programs updated-->", self.availablePrograms);

                    /*Because programs being associated with organization is new feature as of this
                    * comment (2.4.2021) we can assume there will be a mismatch between the
                    * organization programs and those (one actually) currently associated with existing projects.
                    * The below logic is meant to handle this condition.
                    * */

                    if(self.projectPrograms.length != 0){
                     //   i = 0;

                        self.projectPrograms.forEach(function(projProgram){
                          //  let i2 = 0;
                            let exists_in_program = false;
                            self.availablePrograms.forEach(function(availProgram){
                                if(availProgram.program.id == projProgram.id){
                                    exists_in_program = true;
                                }

                             //   i2 = i2+1;
                            });
                            if(exists_in_program == false){
                                let legacy_program = {
                                    active: true,
                                    is_organization_program: false,
                                    program: projProgram,
                                    program_id: projProgram.id

                                }
                                self.availablePrograms.push(legacy_program);
                            }


                          //  i = i+1;
                        });
                    }




                    self.status.loading = false;

                    self.showElements();

                }, function(errorResponse) {

                    console.log('Unable to load request project');

                    self.status.loading = false;

                    self.showElements();

                });
            }

            /*add program to project
            * Okay, so to do this, we're going pass in our program_id then loop over our
            * availableProgram object array, set it's active attribute to true.
            * That's for the UI and so we can extract the program info from
            * that list and add it to our project object, which we will then save.
            * Also, to prevent the browser from registering the click twice (oy!)
            * we pass the click event and stop it's propagation.
            * Sound good? let's do it !
            * */

            self.addProgram = function($event,program_id){

                self.status.processing = true;

                console.log("Adding program to project-->",program_id);

                if($event){
                    $event.stopPropagation();
                    $event.preventDefault();
                }

                let i = 0;

                /*Set the new program to active in our availableProgram array*/

                self.availablePrograms.forEach(function(availProgram){
                    
                    if(availProgram.program.id == program_id){

                        self.availablePrograms[i].active = true;

                    }

                    i = i +1;
                });

                /*Update the project object*/

                i = 0;
                self.tempActivePrograms = [];
                self.availablePrograms.forEach(function(availProgram){
                   if(availProgram.active == true){

                       self.tempActivePrograms.push({"id":availProgram.program.id});

                   }
                   i=i+1
                });

                console.log("self.project.programs -->",self.project.programs);

                self.project.programs = self.tempActivePrograms;

                console.log("self.project.programs updated-->",self.project.programs);

                /*Save, Save, Save the project - and your money - it's never to late to start.*/

                self.saveProject();


            }

            /*remove program from project
            Ok, so how do we do this ? well, first pass the event in and stop it's propagation.
            We do basically what we did for adding a program (above) but we set
            the active attribute of available programs object to false.
             */

            self.removeProgram = function($event,program_id){

                self.status.processing = true;

                console.log("Removing program to project-->",program_id);

                if($event){
                    $event.stopPropagation();
                    $event.preventDefault();
                }

                /*Set the program active attribute to false in our availableProgram array*/

                let i = 0;

                self.availablePrograms.forEach(function(availProgram){

                    if(availProgram.program.id == program_id){

                        self.availablePrograms[i].active = false;

                    }

                    i = i +1;
                });

                /*Update the project object*/

                i = 0;
                self.tempActivePrograms = [];
                self.availablePrograms.forEach(function(availProgram){
                    if(availProgram.active == true){

                        self.tempActivePrograms.push({"id":availProgram.program.id});

                    }
                    i=i+1
                });

                console.log("self.project.programs -->",self.project.programs);

                self.project.programs = self.tempActivePrograms;

                console.log("self.project.programs updated-->",self.project.programs);

                /*Save the project */

                self.saveProject();
            }

         /*   self.searchPrograms = function(value) {

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
        */
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

            };

        /*    self.setProgram = function(item, model, label) {

                self.project.program_id = item.id;

            };

            self.unsetProgram = function() {

                self.project.program_id = null;

                self.program = null;

            };

         */

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'extent',
                    'geometry',
                    'images',
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


                self.project.partners = self.processRelations(self.tempPartners);

                self.project.workflow_state = "Draft";

                console.log("self.project --> submit", self.project);

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
                    'sites'
                ].join(',');

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

            /*
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
            */

        });