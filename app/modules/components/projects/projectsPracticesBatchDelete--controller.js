(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name FieldDoc.controller:SiteEditController
     * @description
     * # SiteEditController
     * Controller of the FieldDoc
     */
    angular.module('FieldDoc')
        .controller('ProjectsPracticesBatchDeleteController',
            function(Account, environment, $http, $location, mapbox,
                     Notifications, Project, project, $rootScope, $route, $scope,
                     $timeout, $interval, user, Utility, Batch, QueryParamManager) {

                var self = this;

                self.params;

                self.confirmBatchDelete = false;
                self.toggleConfirmDelete = false;

                self.unselectedFeatures = [];
                self.selectedFeatures = [];

                $rootScope.toolbarState = {
                    'edit': true
                };

                $rootScope.page = {
                    title: 'Batch Delete'
                };

                self.status = {
                    loading: true,
                    processing: false
                };

                self.alerts = [];

                self.closeAlerts = function() {

                    self.alerts = [];

                };

                self.showMarkedForDeletion = function(){
                    self.availableFeatures.forEach(function(af, af_i) {
                        self.selectedFeatures.forEach(function(sf, sf_i) {
                            var markedKey = "marked_for_deletion";
                            var markedVal = true;


                            if(af.properties.id == sf.properties.id){
                                self.availableFeatures[af_i][markedKey] = markedVal;
                                console.log("ID CHECK: "+af.properties.id+"--"+sf.properties.id);
                            }else{
                                //     self.availableFeatures[af_i][markedKey] = false;
                            }


                        });

                    });

                };

                self.loadProject = function() {

                    project.$promise.then(function(successResponse) {

                        console.log('self.project', successResponse);

                        self.project = successResponse;

                        if (!successResponse.permissions.read &&
                            !successResponse.permissions.write) {

                            self.makePrivate = true;

                            self.showElements(false);

                        } else {

                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

                            $rootScope.page.title = 'Project Batch Delete';

                            self.loadPractices();

                        }

                        self.tags = Utility.processTags(self.project.tags);

                        // self.showElements();

                    }).catch(function(errorResponse) {

                        console.log('loadProject.errorResponse', errorResponse);

                        self.showElements(false);

                    });

                };

                self.loadPractices = function(params) {

                    console.log(
                        'loadPractices:params:',
                        params
                    );

                    params = QueryParamManager.adjustParams(
                        params,
                        {
                            id: self.project.id,
                            t: Date.now()
                        },
                        true);

                    self.queryParams = QueryParamManager.getParams();

                    Project.practices(params).$promise.then(function(successResponse) {

                        console.log("PRACTICE RESPONSE");

                        self.practices = successResponse.features;

                        self.availableFeatures = self.practices;

                        self.summary = successResponse.summary;

                        console.log("SUMMARY", self.summary);

                        console.log('self.practices', successResponse);

                        self.showElements(true);

                        self.showMarkedForDeletion();

                    }, function(errorResponse) {

                        self.showElements();

                    });

                };

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                        $timeout(function() {

                            if (self.practices && self.practices.length) {

                                self.createStaticMapURLs(self.practices,"practice");

                            }

                        }, 50);

                    }, 50);

                };

                /*  createStaticMapUrls:
                    takes self.sites as self.practices as argument
                    iterates of self.practices
                    checks if project extent exists
                    checks if practice geometry exists, if so, calls Utility.buildStateMapURL, pass geometry
                    adds return to practices[] as staticURL property
                    if no site geometry, adds default URL to practices[].staticURL
                */
                self.createStaticMapURLs = function(arr,feature_type){
                    //    console.log("11");
                    arr.forEach(function(feature, index) {
                        //         console.log("22");
                        if (feature.properties.project.extent) {
                            //             console.log("33");
                            if(feature.geometry != null){
                                //                 console.log("44");
                                feature.staticURL = Utility.buildStaticMapURL(
                                    feature.geometry,
                                    feature_type,
                                    400,
                                    200);

                                if(feature.staticURL.length >= 4096){
                                    //                        console.log("55");
                                    feature.staticURL = ['https://api.mapbox.com/styles/v1',
                                        '/mapbox/streets-v11/static/-76.4034,38.7699,3.67/400x200?access_token=',
                                        'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                                    ].join('');
                                }

                                self.practices[index].staticURL = feature.staticURL;

                            }else{
                                //               console.log("66");
                                self.practices[index].staticURL = ['https://api.mapbox.com/styles/v1',
                                    '/mapbox/streets-v11/static/0,0,3,0/400x200?access_token=',
                                    'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                                ].join('');
                            }

                        }

                    });
                }


                self.addToDeleteQueue = function(featureId){
                    console.log("ADDING PRACTICE "+featureId+" TO DELETE QUEUE");
                    var i = 0
                    self.availableFeatures.forEach(function(feature){
                        if(feature.properties.id == featureId){
                            console.log(featureId+" found in self.availableFeatures");
                            self.availableFeatures[i].marked_for_deletion = true;
                            var tempFeature = feature;
                            self.selectedFeatures.push(tempFeature);

                            //  self.unselectedFeatures.splice(i,1);
                        }
                        i = i+1;
                    });

                    console.log("self.selectedFeatures -->",self.selectedFeatures);
                    console.log("self.availableFeatures -->",self.availableFeatures);

                };

                self.removeFromDeleteQueue = function(featureId){
                    console.log("REMOVING PRACTICE "+featureId+" FROM DELETE QUEUE");
                    /*below resetting of self.selected features is a hackaround for the
                    commented out splice below, as it appeared to be
                     also splicing available features after select all. Cause unknow*/
                    self.selectedFeatures = [];
                    var i = 0
                    self.availableFeatures.forEach(function(feature){
                        if(feature.properties.id == featureId){
                            console.log(featureId+" found in self.availableFeatures");
                            self.availableFeatures[i].marked_for_deletion = false;
                            // self.selectedFeatures.splice(i,1);
                            //  self.unselectedFeatures.splice(i,1);
                        }
                        if(self.availableFeatures[i].marked_for_deletion == true){
                            self.selectedFeatures.push(self.availableFeatures[i]);
                        }
                        i = i+1;
                    });

                    console.log("self.selectedFeatures -->",self.selectedFeatures);
                    console.log("self.availableFeatures -->",self.availableFeatures);

                };

                self.addAllToDeleteQueue = function(){
                    var i = 0
                    self.availableFeatures.forEach(function(feature){
                        if( self.availableFeatures[i].marked_for_deletion != true ){
                            self.availableFeatures[i].marked_for_deletion = true;
                            self.selectedFeatures.push(self.availableFeatures[i]);
                        }

                        i = i+1;
                    });
                    //self.selectedFeatures = self.availableFeatures;

                };

                self.removeAllFromDeleteQueue = function(){
                    var i = 0
                    self.availableFeatures.forEach(function(feature){
                        self.availableFeatures[i].marked_for_deletion = false;
                        i = i+1;
                    });
                    self.selectedFeatures = [];
                };


                self.toggleConfirmDeleteDialog = function(){
                    console.log();
                    self.toggleConfirmDelete = true;
                };

                self.batchDelete = function(){
                    self.toggleConfirmDelete = false;
                    console.log("self.project.id",self.project.id);

                    self.status.processing = true;


                    var data  = {collection: self.selectedFeatures};

                    Batch.batchDelete({
                        featureType: 'site',
                        id: self.project.id,
                    },data).$promise.then(function(successResponse) {

                        console.log('Batch.practiceDelete', successResponse);

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practices deleted from project.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);


                        self.selectedFeatures = [];
                        self.loadPractices();

                    }, function(errorResponse) {

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Something went wrong and the changes could not be saved.',
                            'prompt': 'OK'
                        }];

                        self.status.processing = false;

                        console.log('errorResponse', errorResponse);

                    });
                };

                self.cancelDelete = function(){
                    self.toggleConfirmDelete = false;

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

                        project.$promise.then(function(successResponse) {

                            console.log('self.project', successResponse);

                            self.project = successResponse;

                            if (successResponse.permissions.read && successResponse.permissions.write) {
                                self.makePrivate = false;
                            } else {
                                self.makePrivate = true;
                            }

                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

                            $rootScope.page.title = self.project.name;

                            //
                            // Set default query string params.
                            //

                            var existingParams = QueryParamManager.getParams();

                            QueryParamManager.setParams(
                                existingParams,
                                true);

                            //
                            // Set scoped query param variable.
                            //

                            self.queryParams = QueryParamManager.getParams();

                            self.loadProject();

                        }, function(errorResponse) {

                            self.showElements();

                        });

                    });

                } else {

                    $location.path('/logout');

                }

            });

}());