'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ProjectPartnershipController',
        function(Account, $location, $log, Project, project, Partnership,
            $rootScope, $route, user, SearchService, $timeout, $window,
            Utility, $interval, partnerships, Organization) {

            var self = this;

            $rootScope.viewState = {
                'project': true
            };

            $rootScope.toolbarState = {
                'partnerships': true
            };

         //   self.partnerQuery = {};

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

            self.loadPartnerships = function() {

                Project.partnerships({
                    id: self.project.id
                }).$promise.then(function(successResponse) {

                    self.tempPartnerships = successResponse.features;

                    console.log("self.tempPartnerships", self.tempPartnerships);

                    self.showElements();

                }, function(errorResponse) {

                    console.log('Unable to load project partnerships.');

                    self.showElements();

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

                // if (self.project.program) {

                //     self.program = self.project.program;

                // }

                // self.tempPartnerships = self.project.partnerships;

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
                    'tags',
                    'tasks',
                    'centroid',
                    'extent',
                    'program'
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

            self.checkOrganizations = function(){
                if(self.partnerQuery.id == null){

                        var _organization = new Organization({
                            'name': self.partnerQuery.name
                        });

                        _organization.$save(function(successResponse) {

                            self.partnerQuery.id = successResponse.id;

                            self.alerts = [{
                                'type': 'success',
                                'flag': 'Success!',
                                'msg': 'Successfully created ' + successResponse.properties.name + '.',
                                'prompt': 'OK'
                            }];

                            $timeout(self.closeAlerts, 2000);

                            self.createPartnership();

                        }, function(errorResponse) {

                            self.status.processing = false;


                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong and the changes could not be saved.',
                                'prompt': 'OK'
                            }];

                            $timeout(closeAlerts, 2000);

                        });

                }else{
                     self.createPartnership();
                }
            };

            self.createPartnership = function() {

                var params = {
                  //  name: self.partnerQuery.name,
                    project_id: self.project.id,
                    amount: self.partnerQuery.amount,
                    description: self.partnerQuery.description,
                    organization_id: self.partnerQuery.id
                },
                partnership = new Partnership(params);

                partnership.$save().then(function(successResponse) {

                    self.tempPartnerships.push({
                        id: successResponse.id
                    });

                    self.saveProject();

                }).catch(function(error) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to create partnership.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                });

            };

            self.editPartnership = function(obj) {

                self.editMode = true;

                self.displayModal = true;

                self.targetFeature = obj;

                $window.scrollTo(0, 0);

            };

            self.updatePartnership = function() {

                console.log("self.targetFeature-->",self.targetFeature);

                self.scrubFeature(self.targetFeature);

                Partnership.update({
                    id: self.targetFeature.id
                }, self.targetFeature).$promise.then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Partnership changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.displayModal = false;

                    self.editMode = false;

                    $window.scrollTo(0, 0);

                    self.loadPartnerships();

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

                    self.displayModal = false;

                    self.editMode = false;

                    $window.scrollTo(0, 0);

                });

            };

            self.removePartnership = function(partnershipId, index) {

                Partnership.delete({
                    id: partnershipId
                }).$promise.then(function(successResponse) {

                    self.alerts.push({
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Successfully deleted this partnership.',
                        'prompt': 'OK'
                    });

                    $timeout(self.closeAlerts, 2000);

                    self.tempPartnerships.splice(index, 1);

                }).catch(function(error) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete partnership.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                });

            };

            self.saveProject = function() {

                self.status.processing = true;

                self.scrubFeature(self.project);

                self.project.partnerships = self.processRelations(self.tempPartnerships);

                // self.project.workflow_state = "Draft";

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

                Project.update({
                    id: $route.current.params.projectId,
                    exclude: exclude
                }, self.project).then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Project changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.displayModal = false;

                    self.partnerQuery = null;

                    self.loadPartnerships();

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

                    self.displayModal = false;

                    self.partnerQuery = null;

                });

            };

            self.addOrg = function(featureVal){

                if(self.partnerQuery.id == null){
                    self.partnerQuery = {};
                    self.partnerQuery.name = featureVal;
                }else{

                    self.partnerQuery = featureVal;

                }


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
                        can_edit: false,
                        can_delete: false
                    };

                    //
                    // Assign project to a scoped variable
                    //
                    project.$promise.then(function(successResponse) {

                        self.project = successResponse;

                        if (!successResponse.permissions.read &&
                            !successResponse.permissions.write) {

                            self.makePrivate = true;

                        } else {

                            self.processFeature(successResponse);

                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

                            $rootScope.page.title = 'Edit Project';

                        }

                        self.loadPartnerships();

                    }, function(errorResponse) {

                        console.log('Unable to load project.');

                        self.showElements();

                    });

                });

            } else {

                $location.path('/logout');

            }

        });