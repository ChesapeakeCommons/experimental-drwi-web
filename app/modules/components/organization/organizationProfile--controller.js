'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('OrganizationProfileViewController',
        function(Project, Account, $location, $log, Notifications, $rootScope, $scope,
                 $route, $routeParams, user, User, Organization, SearchService, $timeout, Utility) {

            var self = this;

            $rootScope.viewState = {
                'feature': true
            };

            self.status = {
                loading: true,
                processing: false
            };

            self.alerts = [];

            self.closeAlerts = function(){

                self.alerts = [];

            }
            self.showDeletionDialog = false;

            self.deletionId = undefined

            self.summary = {
                program_count : 0
            };

            var featureId = $routeParams.id;

            self.loadOrganization = function(organizationId, postAssigment) {

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.feature = successResponse;

                    self.permissions = successResponse.permissions;


                    self.summary.program_count = self.feature.programs.length;

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
            }

            self.loadOrganizationMembers = function(organizationId, postAssigment) {

                Organization.members({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organizationMembers', successResponse);

                    self.organizationMembers = successResponse.features;

                    self.members = successResponse.features;

                    self.parseMembers(self.members);

                    self.memberCount = successResponse.count;

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


            self.confirmDelete = function(obj) {

                self.deletionTarget = obj;

            };

            self.cancelDelete = function() {

                self.deletionTarget = null;

            };

            self.deleteFeature = function(obj, index) {

                Project.delete({
                    id: obj.id
                }).$promise.then(function(data) {

                    self.deletionTarget = null;

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this project.',
                        'prompt': 'OK'
                    }];

                    self.projects.splice(index, 1);

                    $timeout(closeAlerts, 2000);

                }).catch(function(errorResponse) {

                    console.log('self.deleteFeature.errorResponse', errorResponse);

                    if (errorResponse.status === 409) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to delete “' + obj.name + '”. There are pending tasks affecting this project.',
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

                    $timeout(closeAlerts, 2000);

                });

            };


            /*
            * Program Search
            * Return value of searchService
            * using q query value from bound html input
            *
            * */

            self.searchPrograms = function(value) {

                return SearchService.program({
                    q: value
                }).$promise.then(function(response) {

                    console.log('SearchService.program response', response);

                    let i = 0;

                    response.results.forEach(function(result) {

                        self.feature.programs.forEach(function(program){

                            if(program.program.id == result.id){
                                response.results.splice(i,1);
                                i = i-1;
                            }

                        });

                        result.category = null;

                        i = i+1;

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

                if (self.project.programs) {

                    self.programs = self.project.programs;

                }

                self.project.program_id = [];
                self.project.programs.forEach(function(program){
                    self.project.program_id.push(program.id);

                });

                self.tempPartners = self.project.partners;

                console.log("self.tempPartners",self.tempPartners)

                self.status.processing = false;

            };

            /*self.setProgram: This need to handle an array*/
            self.setProgram = function(item, model, label) {

                console.log("setProgram -->", item);

                let data = {

                    organization_id : +self.feature.id,
                    program_id      : +item.id
                };

                Organization.addProgram({

                },data).$promise.then(function(successResponse) {

                    //   self.processFeature(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Organization changes saved.',
                        'prompt': 'OK'
                    }];

                    console.log("self.feature.programs-->",self.feature.programs)

                    if (featureId) {

                        self.loadOrganization(featureId);
                    }

                    /*if(self.feature.programs == null){

                        self.feature.programs[0].program.main = true;

                    }

                     */

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    console.log("OrganizationService -> addProgram", successResponse);

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

                    console.log("ERROR: OrganizationService -> addProgram", error);

                });


                let tempItem = {};
                tempItem.program = item;

                self.feature.programs.push(tempItem);

                console.log("Updated programs -->", self.feature.programs);

            };


            self.confirmDelete = function (id) {

                self.showDeletionDialog = !self.showDeletionDialog;

                self.deletionId = id;
            };

            self.cancelDelete = function() {

                self.showDeletionDialog = false;

                self.deletionId = undefined;
            };

            self.unsetProgram = function(id) {

                console.log(id);


                self.showDeletionDialog = false;
                self.deletionId = undefined;

                let i = 0;
                self.feature.programs.forEach(function(program){
                    if(program.id == id){

                        self.feature.programs.splice(i,1);
                    }

                     i=i+1;

                });

                let data = {
                    id : id
                };

                Organization.deleteProgram({
                    id : id,
                },data).$promise.then(function(successResponse) {

                    //   self.processFeature(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Organization changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    console.log("OrganizationService -> updateProgram", successResponse);

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

                    console.log("ERROR: OrganizationService -> updateProgram", error);

                });

            };


            self.setDefaultProgram = function(id){


                let data = {
                  id : id,
                  main : true
                };

                Organization.updateProgram({
                    id : id,
                },data).$promise.then(function(successResponse) {

                    //   self.processFeature(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Organization changes saved.',
                        'prompt': 'OK'
                    }];

                    self.feature.programs.forEach(function (program){
                        if(program.id == id){
                            program.main = true;
                        }else{
                            program.main = false;
                        }

                    });

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    console.log("OrganizationService -> updateProgram", successResponse);

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

                    console.log("ERROR: OrganizationService -> updateProgram", error);

                });

            };



            /*END program relations*/



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

/*
Init Commit
 */