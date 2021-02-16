'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeTargetController',
        function($scope, Account, $location, $log, Practice,
                 Organization, QueryParamManager,
                 $rootScope, $route, user, FilterStore, $timeout, SearchService,
                 MetricType, Model, $filter, $interval, Program,
                 Project) {

            var self = this;

            console.log("RELOAD RELOAD RELOAD ????");

            $rootScope.viewState = {
                'practice': true
            };

            $rootScope.toolbarState = {
                'editTargets': true
            };

            $rootScope.page = {};

            self.searchScope = {
                target: 'metric'
            };


            self.showModal = {}

            self.status = {
                processing: true
            };

            self.alerts = [];

            self.closeAlerts = function() {

                self.alerts = [];

            };

            self.metricMatrix = [];

            self.activeDomain = [];

            self.summary = {
                program_count : 0
            };

            function closeRoute() {

                if(self.practice.site != null){
                    $location.path(self.practice.links.site.html);
                }else{

                } $location.path("/projects/"+self.practice.project.id);

            }

            self.loadMatrix = function() {
                console.log("Load Matrix -->")
                console.log("self.practice.project.program_id",self.practice.project.program_id);
                //
                // Assign practice to a scoped variable
                //
                Practice.targetMatrix({
                    id: $route.current.params.practiceId,
                    simple_bool: 'true',
                    program: self.practice.project.program_id
                }).$promise.then(function(successResponse) {

                    self.targets = successResponse;

                    var activeDomain = [];

                    self.targets.active.forEach(function(target) {

                        activeDomain.push(target.metric.id);

                    });

                    self.loadModels(activeDomain);

               //     console.log("LoadMatrix", successResponse);

               //     console.log("self.practice.calculating",self.practice.calculating);



                }).catch(function(errorResponse) {

                    console.log('Unable to load practice target matrix.');

                });

            };

            self.loadModels = function(activeDomain) {

                console.log('self.loadModels.activeDomain', activeDomain);

                Practice.models({
                    id: $route.current.params.practiceId
                }).$promise.then(function(successResponse) {

                    console.log('Practice model successResponse', successResponse);

                    var modelTargets = [];

                    self.models = successResponse.features;

                    self.models.forEach(function(model) {

                        model.metrics.forEach(function(metric) {

                            if (activeDomain.indexOf(metric.id) < 0) {

                                modelTargets.push(metric);

                            }

                        });

                    });

                    self.modelTargets = modelTargets;

                }, function(errorResponse) {

                    console.log('Practice model errorResponse', errorResponse);

                });

            };

            self.loadPractice = function() {

                var exclude = [
                    'centroid',
                    'creator',
                    'dashboards',
                    //  'extent',
                    // 'geometry',
                    'members',
                    'metric_types',
                    'partners',
                    'practices',
                    'practice_types',
                    'properties',
                    'tags',
                    'targets',
                    'tasks',
                    'practices'
                ].join(',');

                Practice.getSingle({
                    id: $route.current.params.practiceId,
                    exclude: exclude
                }).$promise.then(function(successResponse) {

                    self.practice_category = successResponse.category;

                    console.log("self.practice_category -->",self.practice_category);

                    self.processPractice(successResponse);

                    self.organization = successResponse.organization;

                    self.project_id = successResponse.project_id;

                    console.log("practice response",successResponse)

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    self.calculating = true;

                    /*organization programs will need to be redefined using project.programs*/

               //     self.loadOrganization(self.organization.id);
                    self.loadProject(self.project_id);




                }).catch(function(errorResponse) {

                    console.log('Unable to load practice');

                    self.status.processing = false;

                });

            };

            self.processTargets = function(list) {

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

            self.processPractice = function(data) {

                console.log('process-data -->', data);
                console.log('process-data -->', data.properties);

                self.practice = data.properties || data;

                if(self.practice.custom_extent == null){
                    self.practice.custom_extent = self.practice.calculated_extent.converted;
                }

                self.calculating = self.practice.calculating;

                self.geometryMismatch = false;

                self.tempTargets = self.practice.targets || [];

                self.status.processing = false;

                console.log("process practice->>",self.practice);

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'category',
                    'creator',
                    //        'extent',
                    'geometry',
                    'images',
                    'last_modified_by',
                    'members',
                    'organization',
                    'project',
                    'site',
                    'tags',
                    'tasks'
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

                console.log('self.tempTargets', self.tempTargets);

                console.log('self.savePractice.practice', self.practice);

                console.log('self.savePractice.Practice', Practice);

                Practice.update({
                    id: +self.practice.id
                }, self.practice).then(function(successResponse) {

                    self.processPractice(successResponse);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Practice changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;
                    self.calculating = true;

                    self.bgLoadMetrics();

                }).catch(function(error) {

                    console.log('savePractice.error', error);

                    // Do something with the error

                    self.status.processing = false;

                });

            };

            /*
            START Program context switch logic
            Note: we are currently loading in Organization Programs
            This needs to be updated to loadProject
             */
            self.loadProject = function(projectId){


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

                Project.getSingle({
                    id: projectId,
                    exclude: exclude
                }).$promise.then(function(successResponse) {


                    console.log("project response -->",successResponse);

                    self.project = successResponse;

                    self.programs = successResponse.programs;

                    console.log("project programs -->", self.programs);

                    self.summary.program_count = self.programs.length;

                    if(self.programs.length > 0 && self.currentProgram == undefined){
                        self.currentProgram = self.programs[0];
                    }

                    self.loadMetrics(self.practice.id,self.currentProgram.program_id);

                    self.status.loading = false;

                }, function(errorResponse) {

                    console.log('Unable to load request project');

               //     self.showElements();

                });

            }


            /*self.loadOrganization is obsolete - can be removed*/
            self.loadOrganization = function(organizationId) {

                Organization.profile({
                    id: organizationId
                }).$promise.then(function(successResponse) {

                    console.log('self.organization', successResponse);

                    self.feature = successResponse;

                    self.programs = successResponse.programs;

                    self.summary.program_count = self.programs.length;

                    if(self.programs.length > 0 && self.currentProgram == undefined){
                        self.currentProgram = self.programs[0];
                    }

                    self.loadMetrics(self.practice.id,self.currentProgram.program_id);

                    self.status.loading = false;

                }, function(errorResponse) {

                    console.error('Unable to load organization.');

                    self.status.loading = false;

                });

            };

            /*
            END Program context switch logic
             */

            /*
            START Custom Extent Logic
            */

            self.deleteCustomExtent = function(){

                self.calculating = true;

                self.practice.custom_extent = null;

                self.savePractice();

            };

            self.bgLoadMatrix = function(){

                console.log("BG LOAD MATRIX", self.calculating);

                //self.practice.calculating
                if(self.calculating == true){
                    console.log("Checking Practice");
                    var timer = setTimeout(function(){
                        self.checkStatus();

                    }, 2000);
                }else{
                    clearTimeout(timer);
                    self.loadMatrix();
                }

            };

            self.checkStatus = function(){
                console.log("Checking Calc Status");

                Practice.checkStatus({
                    id: $route.current.params.practiceId,
                }).$promise.then(function(successResponse) {

                    console.log(successResponse);

                    self.calculating = successResponse.calculating;

                    //  self.bgLoadMatrix();
                    self.bgLoadMetrics();
                    //self.loadMatrix();

                }).catch(function(errorResponse) {

                    console.log(errorResponse)

                });

            };


            $scope.loadMetrics = self.loadMetrics = function(practice_id,program_id){

                // loop over programs to see if currentProgram is currently set.

                console.log("load metrics for program_id-->",program_id)

                console.log('self.programs',self.programs);

                /* Here we're going to loop over the self programs
                object and check feature ids against the parameter id.
                If there's a match (which there should be) we'll assign
                the match as self.currentProgram.
                * */

                for(let program of self.programs){

                    console.log("program -->",program);

                    if (program.id === program_id) {

                        console.log("program matched");

                        self.currentProgram = program;

                        break;
                    }

                }

                Practice.metrics({
                    id: practice_id,
                    program: program_id
                }).$promise.then(function(successResponse){
                    console.log("loadMetrics TEST SUCCESS");
                    console.log("successResponse -->",successResponse);

                },function(errorResponse){

                    console.log("loadMetrics TEST error",errorResponse);
                });


                Practice.metrics({
                    id: practice_id,
                    program: program_id
                }).$promise.then(function(successResponse){

                        console.log("loadMetrics",successResponse);

                    self.info = successResponse;
                    self.programMetrics = self.info.metrics.secondary;

                  //  console.log(self.pro);

                    /* 2021.02.10 - RZT
                    We're going to sort the targets by program id
                    * This is will not account for unassigned primary and secondary metrics or unassigned metrics
                    * seperate handling will be needed
                    * Ideally we'll a better request/end point structure to simplify front end logic.
                    * */
                    self.assignedMetrics = [];

                    console.log("self.currentProgram -->",self.currentProgram);

                    self.info.targets.forEach(function(target){
                        console.log("target -->",target);
                        console.log("target.program_id -->",target.program_id);
                        console.log("self.currentProgram.id -->",self.currentProgram.id);

                        if(target.program_id == self.currentProgram.id){

                            self.assignedMetrics.push(target);

                        }

                    })
                    console.log("assignedMetrics -->",self.assignedMetrics);


                   // self.assignedMetrics = self.info.targets;

                    /*Check if secondary metrics are automated and have caputred extent
                    * if so so, remove from programMetrics arr (ie Secondary Metrics
                    * */

                    let i = 0;

                    self.programMetrics.forEach(function(metric) {

                        if(metric.automated === true && metric.capture_extent === true){

                            self.programMetrics.splice(i,1);

                            i = i+1;

                        }

                    });

                    /*Check if primary metrics are also assign metrics,
                    if not, add them to the programMetrics (secondary) arr
                    * */
                    /*We're going to add conditional checks against the current program id
                    * and only add those to the assigned metrics panel.
                    * */

                    let unassignedPrimaryMetrics = [];

                    self.info.metrics.primary.forEach(function(pMetric) {

                        let metricAssigned = false;

                        self.assignedMetrics.forEach(function(aMetric){

                            if(pMetric.id === aMetric.id){

                                metricAssigned = true;

                            }

                        });

                        if(metricAssigned === false){

                            unassignedPrimaryMetrics.push(pMetric);

                        }

                    });

                    /* loop over our unassigned primary metrics
                    and add them to program/secondary metrics array
                    * */

                    unassignedPrimaryMetrics.forEach(function(uMetric){

                        self.programMetrics.splice(0,0,uMetric);

                    });

                    self.assignedMetrics.forEach(function(am){

                        self.activeDomain.push(am.id);

                        var i = 0;

                        self.programMetrics.forEach(function(pm){

                            if(am.metric.id == pm.id){

                                self.programMetrics.splice(i,1);
                            }

                            i = i+1;
                        });

                    });

                    self.loadModels(self.activeDomain);

                    self.calculating = false;

                },function(errorResponse){

                    console.log("loadMetrics error",errorResponse);
                });

            };

            self.bgLoadMetrics = function(){

                if(self.calculating == true){

                    var timer = setTimeout(function(){

                        self.checkStatus();

                    }, 2000);

                }else{

                    clearTimeout(timer);

                    self.loadMetrics(self.practice.id);
                }

            };

            self.addMetric = function($item, $model, $label) {

                self.metricMatrix.push($item);

                var tempProgramMetrics = [];


                self.programMetrics.forEach(function(newItem){

                    if ($item.id !== newItem.id){
                      //  console.log("newItem",newItem);
                        tempProgramMetrics.push(newItem);

                        self.activeDomain.push(newItem.id);

                    }



                });



                self.programMetrics = tempProgramMetrics;

                console.log("save Target-->",$item);

               self.saveTarget($item, null, 0);



            //    self.updateTarget($item);

                // document.getElementById("assignTargetsBlock").blur();

                self.loadModels(self.activeDomain);

            };

            self.updateTarget = function($item){

                console.log("self.updateTarget", $item);

                Practice.targetUpdate({
                    id: +self.practice.id,
                    targetId: $item.id,
                    program: self.currentProgram.id
                }, $item).$promise.then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Target changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    console.log("practice.updateMatrix", successResponse);

                }).catch(function(error) {

                    console.log('updateMatrix.error', error);

                    // Do something with the error

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Something went wrong and the target changes were not saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                });

            };

            self.saveTarget = function($item,$index,$value){

                console.log("save $item", $item);

                var target_arr = [];

                target_arr.push({

                    'metric': $item,
                    'value': $value,

                });

                var data = {
                    program : self.currentProgram.id,
                    targets: target_arr
                };

                console.log("target_arr -->",target_arr);

                Practice.updateMatrix({
                    id: +self.practice.id
                }, data).$promise.then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Target changes saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    console.log("practice.updateMatrix", successResponse);

                }).catch(function(error) {

                    console.log('updateMatrix.error', error);

                    // Do something with the error

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Something went wrong and the target changes were not saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                });
            };

            self.removeMetric = function($item,$index){

                console.log($item+" "+$index);

                self.metricMatrix.splice($index,1);

                self.programMetrics.push($item);

            }

            self.deleteTarget = function($item,$index){

                console.log("$delete $item,",$item)

                var target_arr = [];
                target_arr.push($item);

                var data = {
                    targets: target_arr
                };

                Practice.targetDelete({
                    id: +self.practice.id,
                    target_id : $item.id
                }).$promise.then(function(successResponse) {

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Target deleted.',
                        'prompt': 'OK'
                    }];

                    console.log("assignedMetrics",self.assignedMetrics);

                    var i = 0;
                    self.assignedMetrics.forEach(function(am){

                        if(am.id == $item.id){

                            self.assignedMetrics.splice(i,1);
                        }
                        i = i+1;
                    });

                    self.programMetrics.push($item.metric);

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                    console.log("practice.delete", successResponse);

                }).catch(function(error) {

                    console.log('practiceDelete.error', error);

                    // Do something with the error

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'Something went wrong and the target changes were not saved.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    self.status.processing = false;

                });


            }

            //
            // Verify Account information for proper UI element display
            //

            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.loadPractice();

                    //
                    // Setup page meta data
                    //

                    $rootScope.page = {
                        'title': 'Edit practice targets'
                    };

                });

            } else {

                $location.path('/logout');

            }



            $scope.$on('$destroy', function () { $interval.cancel(matrixLoadInterval); });

        });
