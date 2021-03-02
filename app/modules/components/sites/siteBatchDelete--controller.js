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
        .controller('SiteBatchDeleteController',
            function(Account, environment, $http, $location, mapbox,
                     Notifications, Site, site, $rootScope, $route, $scope,
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

                /*END Pagniation vars*/

                self.loadSite = function() {

                    console.log("LOAD SITE");

                    site.$promise.then(function(successResponse) {

                        console.log("SITE RESPONSE");

                        console.log('self.site', successResponse);

                        self.site = successResponse;

                        if (successResponse.permissions.read &&
                            successResponse.permissions.write) {

                            self.makePrivate = false;

                        } else {

                            self.makePrivate = true;

                        }

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        self.project = successResponse.project;

                        console.log('self.project', self.project);

                        //
                        // Load practices
                        //

                        self.loadPractices();

                    });

                };

                self.loadPractices = function(){
                    Site.practices({
                        id: self.site.id,
                        limit: self.limit,
                        page: self.page,
                        t: Date.now()
                    }).$promise.then(function(successResponse) {

                        console.log("PRACTICE RESPONSE");

                        self.practices = successResponse.features;

                        self.summary = successResponse.summary;

                        console.log('self.practices', successResponse);

                        self.availableFeatures = self.practices;

                        self.availableFeatures.forEach(function(feature, index) {
                            console.log("index", index);
                            var markedKey = "marked_for_deletion";
                            var markedVal = false;
                            self.availableFeatures[index][markedKey] = markedVal;
                        });

                        console.log('self.availableFeatures', self.availableFeatures);

                        self.showElements();

                        self.showMarkedForDeletion();

                    }, function(errorResponse) {

                        console.log("PRACTICE ERROR RESPONSE");

                        self.showElements();

                    });

                };

                self.showElements = function() {

                    $timeout(function() {

                        self.status.loading = false;

                        self.status.processing = false;

                        $timeout(function() {

                            /*
                                if (!self.mapOptions) {

                                    self.mapOptions = self.getMapOptions();

                                }

                                self.createMap(self.mapOptions);
                            */
                            if (self.practices && self.practices.length) {

                                //    self.addMapPreviews(self.practices);
                                self.createStaticMapURLs(self.practices);

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
                self.createStaticMapURLs = function(arr){

                    arr.forEach(function(feature, index) {

                        if (feature.properties.project.extent) {

                            if(feature.geometry != null){

                                feature.staticURL = Utility.buildStaticMapURL(
                                    feature.geometry,
                                    'practice',
                                    400,
                                    200);

                                if(feature.staticURL.length >= 4096){
                                    feature.staticURL = ['https://api.mapbox.com/styles/v1',
                                        '/mapbox/streets-v11/static/-76.4034,38.7699,3.67/400x200?access_token=',
                                        'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                                    ].join('');
                                }

                                self.practices[index].staticURL = feature.staticURL;

                            }else{

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
                    /*
                        var i = 0

                        self.unselectedFeatures.forEach(function(feature){
                            if(feature.properties.id == featureId){
                                console.log(featureId+" found in self.unselectedFeatures");
                                var tempFeature = feature;
                                self.selectedFeatures.push(tempFeature);
                                self.unselectedFeatures.splice(i,1);
                            }
                            i = i+1;
                        });
                        console.log("self.selectedFeatures -->",self.selectedFeatures);
                        console.log("self.unselectedFeatures -->",self.unselectedFeatures);
                     */
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
                    /*  var i2 = 0;
                      self.selectedFeatures.forEach(function(feature){
                           console.log("REMOVING PRACTICE "+featureId+" FROM selectedFeatures");
                           if(feature.properties.id == featureId){
                             // this line is causing issue
                              self.selectedFeatures.splice(i2,1);

                           }
                           i2 = i2+1;
                      });
                      */
                    console.log("self.selectedFeatures -->",self.selectedFeatures);
                    console.log("self.availableFeatures -->",self.availableFeatures);

                };

                self.addAllToDeleteQueue = function(){
                    var i = 0
                    self.availableFeatures.forEach(function(feature){
                        self.availableFeatures[i].marked_for_deletion = true;
                        i = i+1;
                    });
                    self.selectedFeatures = self.availableFeatures;

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
                    self.status.processing = true;

                    self.toggleConfirmDelete = false;
                    console.log("self.site.id",self.site.id);

                    var data  = {collection: self.selectedFeatures};

                    Batch.batchDelete({
                        featureType: 'site',
                        id: self.site.id
                    },data).$promise.then(function(successResponse) {

                        console.log('Batch.practiceDelete', successResponse);

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practices deleted from site.',
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

                        console.log('errorResponse', errorResponse);

                        self.status.processing = false;
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
                            can_edit: false
                        };

                        site.$promise.then(function(successResponse) {
                            console.log('self.site', successResponse);
                            self.site = successResponse;
                            if (successResponse.permissions.read && successResponse.permissions.write) {
                                self.makePrivate = false;
                            } else {
                                self.makePrivate = true;
                            }
                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

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

                            self.loadSite();

                        }, function(errorResponse) {
                            self.showElements();
                        });

                    });

                } else {
                    $location.path('/logout');

                }

            });

}());