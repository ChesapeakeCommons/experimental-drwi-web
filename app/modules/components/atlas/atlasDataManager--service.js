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

        var fetchedFeatures = {
            'practice': {
                'line': [],
                'point': [],
                'polygon': []
            },
            'site': {
                'line': [],
                'point': [],
                'polygon': []
            },
            'project': {
                'point': []
            }
        };

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

            },
            createURLData: function (feature, toString) {

                toString = typeof toString === 'boolean' ? toString : true;

                var origin = '-77.0147,38.9101,12';

                var params = {};

                var centroid = this.getCentroid(feature);

                if (centroid !== undefined) {

                    if (centroid.hasOwnProperty('coordinates')) {

                        origin = [
                            centroid.coordinates[0],
                            centroid.coordinates[1],
                            12
                        ].join(',');

                    } else {

                        origin = [
                            centroid.geometry.coordinates[0],
                            centroid.geometry.coordinates[1],
                            12
                        ].join(',');

                    }

                }

                params.origin = encodeURIComponent(
                    origin
                ).replace(/\./g, '%2E');

                var node = feature.type + ':' + feature.id;

                params.data = encodeURIComponent(btoa(node));

                if (toString) {

                    var str = [];

                    for (var key in params) {

                        str.push(encodeURIComponent(key) + '=' + params[key]);

                    }

                    return str.join('&');

                }

                return params;

            },
            getCentroid: function (feature) {

                console.log(
                    'getCentroid:feature',
                    feature
                );

                var featureType = feature.type;

                console.log(
                    'getCentroid:featureType',
                    featureType
                );

                if (featureType === 'project') {

                    return feature.centroid;

                }

                try {

                    var geometryType = feature.geometry.type.toLowerCase();

                    if (geometryType === 'linestring') {

                        var line = turf.lineString(feature.geometry.coordinates);

                        console.log(
                            'getCentroid:line',
                            line
                        );

                        return turf.centroid(line);

                    }

                    if (geometryType === 'polygon') {

                        var polygon = turf.polygon(feature.geometry.coordinates);

                        console.log(
                            'getCentroid:polygon',
                            polygon
                        );

                        console.log(
                            'getCentroid:centroid',
                            turf.centroid(polygon)
                        );

                        return turf.centroid(polygon);

                    }

                } catch (e) {

                    console.warn(e);

                    return undefined;

                }

                return undefined;

            },
            getFetched: function (featureType, geometryType) {

                return fetchedFeatures[featureType][geometryType];

            },
            getFetchedKeys: function (featureType, geometryType) {

                var index = fetchedFeatures[featureType][geometryType];

                if (Array.isArray(index)) {

                    var vals = [];

                    index.forEach(function (feature) {

                        vals.push(feature.properties.id);

                    })

                    return vals;

                }

                return [];

            },
            getOrigin: function (params) {

                try {

                    var origin = decodeURIComponent(params.origin);

                    var tokens = origin.split(',');

                    return {
                        lng: +tokens[0],
                        lat: +tokens[1],
                        zoom: +tokens[2]
                    }

                } catch (e) {

                    return undefined;

                }

            },
            getData: function (params) {

                try {

                    var data = decodeURIComponent(params.data);

                    var str = atob(data);

                    var tokens = str.split(':');

                    return {
                        featureType: tokens[0],
                        featureId: +tokens[1]
                    }

                } catch (e) {

                    return undefined;

                }

            },
            trackFeature: function (featureType, geometryType, feature) {

                fetchedFeatures[featureType][geometryType].push(feature);

            }

        };

    });