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

            self.showDeletionDialog = false;

            self.deletionId = undefined;

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

               /*     if(self.projectPrograms.length == 0){
                        i = 0;
                        self.availablePrograms.forEach(function(availProgram){
                            if(availProgram.main == true){
                                self.availablePrograms[i].active = true;
                                self.availablePrograms[i].is_organization_program = true;
                            }
                        i = i+1;
                        });

                    }

                */

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

                  //  self.checkUserRoles();


                    self.status.loading = false;

                    self.showElements();

                }, function(errorResponse) {

                    console.log('Unable to load request project');

                    self.status.loading = false;

                    self.showElements();

                });
            }

            /*Chech user roles
            * Okay, so now we need to set up a function
            * which will inspect the
            * 1) availablePrograms id,
            * 2) user' organization id, the users' programs, and user's role
            * 3) the project's status, organization id
            * to determine what actions the user can take on this view.
            * I don't believe we need to be concerned with the organization id,
            * however, if a manager is under the organization, then conflicts of permission
            * state will need to be avoided.
            * In a draft project, A grantee user can add or remove programs
            * In a draft project, A manager can add or remove their program
            * In an active project, a grantee can add programs.
            * In an active project, a manager can remove their program.
            *
            * */

            self.checkUserRoles = function(){

                console.log("self.checkUserRoles -->");
                console.log("self.$rootScope.user -->", $rootScope.user);
                console.log("self.project -->", self.project);
                console.log("self.availablePrograms -->", self.availablePrograms);
                console.log("self.project.status -->", self.project.status);
                console.log("$rootScope.user.programs-->", $rootScope.user.programs);
                console.log("$rootScope.user.roles-->", $rootScope.user.roles);




                let is_availableManager = false;

                let status = self.project.status;
                let roles = $rootScope.user.roles;

                let is_manager = $rootScope.user.is_manager;
                let is_admin = $rootScope.user.is_admin;
                let is_grantee = false;

                if(is_manager === false && is_admin === false){
                    is_grantee = true;
                }

                let i = 0;

                i = 0;

                self.availablePrograms.forEach(function(availProgram){

                    /*First we're going to loop through all
                     * the available programs and create an 'editable' attribute
                    * and set it to false*/

                    self.availablePrograms[i].editable = false;

                    /*If the project is active*/
                    if(status === 'active') {
                        if (is_admin === true) {

                            self.availablePrograms[i].editable = true;

                        }else if(is_grantee === true) {
                            if (availProgram.active === false) {

                                self.availablePrograms[i].editable = true;

                            } else if (availProgram.active === true) {

                                self.availablePrograms[i].editable = false;
                            }

                        }else {
                                $rootScope.user.programs.forEach(function (user_program) {

                                    if (user_program.id === availProgram.program.id) {

                                        if (availProgram.active === false && is_manager === true) {

                                            self.availablePrograms[i].editable = true;

                                        } else if (availProgram.active === true && is_manager === true) {

                                            self.availablePrograms[i].editable = true;
                                        }
                                    }
                                });
                            }


                        /*If the project is draft*/

                    }else if(status === 'draft'){

                        if (is_admin === true || is_grantee === true) {

                            self.availablePrograms[i].editable = true;

                        }else {

                            $rootScope.user.programs.forEach(function (user_program) {

                                if (user_program.id === availProgram.program.id) {

                                    if (availProgram.active === false && is_manager === true) {

                                        self.availablePrograms[i].editable = true;

                                    } else if (availProgram.active === true && is_manager === true) {

                                        self.availablePrograms[i].editable = true;
                                    }
                                }
                            });
                        }



                    }


                    i = i + 1;
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

                self.showDeletionDialog = false;

                self.deletionId = undefined;

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
                        self.availablePrograms[i].is_organization_program = true;
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

            /*Confirm deletion
            * This is logic for the confirm popup dialog
            * */
            self.confirmProgramDelete = function ($event,id) {

                console.log("Confirm dialog");

                console.log(id);

                if($event){
                    $event.stopPropagation();
                    $event.preventDefault();
                }

                self.showDeletionDialog = !self.showDeletionDialog;

                self.deletionId = id;
            };
            /*Cancel deletion*/
            self.cancelProgramDelete = function($event) {

                console.log("Cancel Removal");
                if($event){
                    $event.stopPropagation();
                    $event.preventDefault();
                }


                self.showDeletionDialog = false;

                self.deletionId = undefined;


            };

            /*remove program from project
            Ok, so how do we do this ? well, first pass the event in and stop it's propagation.
            We do basically what we did for adding a program (above) but we set
            the active attribute of available programs object to false.
             */

            self.removeProgram = function($event,program_id){

                self.showDeletionDialog = false;

                self.deletionId = undefined;

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


            //
            // Verify Account information for proper UI element display
            //
            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    console.log("$rootScope.user -->",$rootScope.user);

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


        });