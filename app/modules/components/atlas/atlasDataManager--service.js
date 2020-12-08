'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('AtlasDataManager', function(
        Utility, Dashboard, Project, Site,
        Practice, GeographyService) {

        //Let's set an internal reference to this service
        var self = this;

        // dashboardObject, contains basic
        // info about the dashboard
        self.dashboardObj = {};
        self.projects = {};
        self.geographies = {};

        self.defaultExtent;

        return {
            getPractice: function(featureId, callback) {

                Practice.publicFeature({
                    id: feature
                }).$promise.then(function(successResponse) {

                    if (callback !== null) {

                        return callback(successResponse);

                    }

                }, function(errorResponse) {

                    console.log(
                        'getPractice:errorResponse',
                        errorResponse);

                });

            },
            getDashboard: function(feature, successCallback = null) {

                Dashboard.basic({
                    id: feature
                }).$promise.then(function(successResponse) {

                    console.log('self.loadDashboard.successResponse', successResponse);

                    self.dashboardObj = successResponse;

                    console.log("DASHBOARD OBJ",  self.dashboardObj);

                    if(successCallback !== null){

                        return successCallback(successResponse);

                    }

                }, function(errorResponse) {

                    console.log('self.loadDashboard.errorResponse', errorResponse);

                    return "NO DASH";
                });

            },
            getProjects: function(feature,successCallback) {

                Dashboard.projects({
                    id: feature
                }).$promise.then(function(successResponse) {

                    self.projects = successResponse;

                    console.log("self.projects",self.projects);

                    if (successCallback !== null) {

                        return successCallback(successResponse);

                    }


                }, function(errorResponse) {

                    console.log('self.loadDashboard.errorResponse', errorResponse);

                    return "NO DASH";
                });

            },
            getProjectSites: function(featureId,callback){
                Dashboard.projectSites({
                    id: featureId
                }).$promise.then(function(successResponse) {
                    console.log("Site Load",successResponse);
                    //       Utility.scrubFeature(successResponse, []);
                    callback(successResponse);
                }, function(errorResponse) {
                    console.log(13);
                    console.log('errorResponse', errorResponse);

                });
            },
            getProjectPractices: function(featureId,callback){
                Dashboard.projectPractices({
                    id: featureId
                }).$promise.then(function(successResponse) {
                    //       Utility.scrubFeature(successResponse, []);
                    callback(successResponse);
                }, function(errorResponse) {
                    console.log(13);
                    console.log('errorResponse', errorResponse);

                });
            },
            getSitePractices: function(featureId,callback){
                Dashboard.sitePractices({
                    id: featureId
                }).$promise.then(function(successResponse) {
                    //       Utility.scrubFeature(successResponse, []);
                    callback(successResponse);
                }, function(errorResponse) {
                    console.log(13);
                    console.log('errorResponse', errorResponse);

                });
            },
            getGeographies: function(featureId, callback,overwrite = false){
                Dashboard.geographies({
                    id: featureId
                }).$promise.then(function(successResponse) {
                    //       Utility.scrubFeature(successResponse, []);
                    callback(successResponse,overwrite);
                }, function(errorResponse) {
                    console.log(13);
                    console.log('errorResponse', errorResponse);

                });

            },
            getDashboardMetrics: function(featureId,callback){
                Dashboard.progress({
                    id: featureId,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('granteeResponse', successResponse);

                    callback(successResponse,true);
                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });
            },
            getGeographyMetrics: function(featureId,callback){
                GeographyService.progress({
                    id: featureId,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('granteeResponse', successResponse);

                    callback(successResponse);
                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });
            },
            getProjectMetrics: function(featureId,callback){
                Project.progress({
                    id: featureId,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('granteeResponse', successResponse);

                    callback(successResponse);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            },
            getSiteMetrics: function(featureId,callback){
                Site.progress({
                    id: featureId,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('granteeResponse', successResponse);

                    callback(successResponse);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            },
            getPracticeMetrics: function(featureId,callback){
                Practice.progress({
                    id: featureId,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('granteeResponse', successResponse);

                    callback(successResponse);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            },
            getProjectTags: function (featureId, callback){
                console.log("LOADING PROJECT TAGS");
                console.log(featureId);
                Project.tags({
                    id: featureId
                }).$promise.then(function(successResponse) {

                    console.log('Feature.tags', successResponse);

                    successResponse.features.forEach(function(tag) {

                        if (tag.color &&
                            tag.color.length) {

                            tag.lightColor = tinycolor(tag.color).lighten(5).toString();

                        }

                    });
                    console.log("TAG RESPONSE");
                    console.log(successResponse);
                    return callback(successResponse);

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                });

            },
            getTags: function(featureType, featureId, callback){
                console.log("LOADING TAGS");

                var models = {
                        'geography': GeographyService,
                        'practice': Practice,
                        'project': Project,
                        'site': Site
                    },
                    targetModel = models[featureType];

                console.log(targetModel);
                if (targetModel) {

                    targetModel.tags({
                        id: featureId
                    }).$promise.then(function(successResponse) {

                        console.log('Feature.tags', successResponse);

                        successResponse.features.forEach(function(tag) {

                            if (tag.color &&
                                tag.color.length) {

                                tag.lightColor = tinycolor(tag.color).lighten(5).toString();

                            }

                        });
                        console.log("TAG RESPONSE");
                        console.log(successResponse);
                        return callback(successResponse);

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                }

            }

        };

    });