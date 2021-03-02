'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('ChangeLogController',
        function(ChangeLog, Account, $location, $log, Notifications, $rootScope,
                 $route, $routeParams, user, User, Organization,
                 SearchService, $timeout, Utility, QueryParamManager) {

            var self = this;

            $rootScope.viewState = {
                'changeLog': true
            };

            self.status = {
                loading: true,
                processing: false
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 50);

            };

            self.parseRouteParams = function() {

                self.featureId = $routeParams.id;

                var featureType = $routeParams.feature_type;

                var lastChar = featureType.slice(-1);

                if (lastChar === 's') {

                    featureType = featureType.slice(0, -1);

                }

                self.featureType = featureType;

                $rootScope.viewState = {
                    featureType: true
                };

                console.log('featureId-->', self.featureId);

                console.log('featureType-->', self.featureType);

            };

            self.loadHistory = function(firstLoad, params) {

                console.log(
                    'loadHistory:firstLoad:',
                    firstLoad
                );

                console.log(
                    'loadHistory:params:',
                    params
                );

                var extras = {
                    id: self.featureId,
                    type: self.featureType,
                    tz_offset: self.tzOffset
                }

                params = QueryParamManager.adjustParams(
                    params,
                    extras);

                self.queryParams = QueryParamManager.getParams();

                ChangeLog.query(params).$promise.then(function(successResponse) {

                    console.log('successResponse', successResponse);

                    self.feature = successResponse.feature;

                    self.feature_type = successResponse.feature_type;

                    if (!self.feature.permissions.write) {

                        self.makePrivate = true;

                    } else {

                        self.permissions.can_edit = self.feature.permissions.write;
                        self.permissions.can_delete = self.feature.permissions.write;

                        self.changeLog = successResponse.history;

                        self.summary = successResponse.summary;

                        self.parseResponse();

                    }

                    if (firstLoad) self.showElements();

                }, function(errorResponse) {

                    console.log('errorResponse', errorResponse);

                    self.showElements();

                });

            };

            self.parseResponse = function() {

                console.log('self.changeLog-->', self.changeLog);

                self.changeLog.forEach(function(group) {

                    group.changes.forEach(function(change) {

                        var separatorIdx = change.action.indexOf('_');

                        // 
                        // Extract operation name from `change.action`.
                        // 
                        // e.g. `create_practice` --> `create`
                        // 

                        var op = change.action.substring(0, separatorIdx);

                        change.op = op;

                        // 
                        // Extract feature type from `change.action`.
                        // 
                        // e.g. `create_practice` --> `practice`
                        // 

                        var featureType = change.action.substring(separatorIdx + 1);

                        console.log(
                            'self.parseResponse.op:',
                            op
                        );

                        console.log(
                            'self.parseResponse.featureType:',
                            featureType
                        );

                        // 
                        // If applicable, add `deletion` flag to log
                        // and a generic string describing the action.
                        // 

                        if (op.indexOf('delete') === 0) {

                            change.deletion = true;

                            change.detail = ' removed from ' + self.featureType + '.';

                        }

                        // 
                        // Hide creation log body when view context
                        // and log feature type match.
                        // 

                        if (op.indexOf('create') >= 0 &&
                            (featureType.replace(/_/g, '-') === self.featureType)) {

                            change.hideBody = true;

                        }

                        // 
                        // Iterate `change.diff` object and generate
                        // static Mapbox URLs for `geometry` types.
                        // 

                        if (change.diff &&
                            typeof change.diff !== 'undefined') {

                            for (var item in change.diff) {

                                console.log('A', item);

                                console.log('change.diff[item].type', change.diff[item].type);

                                if (change.diff[item].type === 'geometry') {

                                    console.log('E');

                                    if (change.diff[item].new_value != null) {

                                        console.log('F');

                                        change.diff[item].new_staticURL = Utility.buildStaticMapURL(
                                            change.diff[item].new_value, self.featureType);

                                    }

                                    if (change.diff[item].previous_value != null) {

                                        console.log('G');

                                        change.diff[item].previous_staticURL = Utility.buildStaticMapURL(
                                            change.diff[item].previous_value, self.featureType);

                                    }

                                }

                            }

                        } else {

                            // 
                            // Generate relative link paths and text content
                            // so that users can access new features from
                            // creation logs.
                            // 

                            if (op.indexOf('create') >= 0) {

                                var link;

                                var linkTxt;

                                switch(featureType) {

                                    case 'organization':

                                        link = 'organizations/' + change.data.id;

                                        linkTxt = change.data.name;

                                        break;

                                    case 'practice':

                                        link = 'practices/' + change.data.id;

                                        if (typeof change.data.name == 'string') {

                                            linkTxt = change.data.name;

                                        } else {

                                            linkTxt = 'Un-named practice (' + change.data.id + ')';

                                        }

                                        break;

                                    case 'program':

                                        link = 'programs/' + change.data.id;

                                        linkTxt = change.data.name;

                                        break;

                                    case 'project':

                                        link = 'projects/' + change.data.id;

                                        linkTxt = change.data.name;

                                        break;

                                    case 'project_member':

                                        link = 'profile/' + change.data.user.id;

                                        linkTxt = change.data.user.first_name + ' ' + change.data.user.last_name;

                                        change.detail = ' added to project.';

                                        break;

                                    case 'report':

                                        link = 'reports/' + change.data.id;

                                        linkTxt = change.data.report_date;

                                        break;

                                    case 'site':

                                        link = 'sites/' + change.data.id;

                                        if (typeof change.data.name == 'string') {

                                            linkTxt = change.data.name;

                                        } else {

                                            linkTxt = 'Un-named site (' + change.data.id + ')';

                                        }

                                        break;

                                    case 'tag':

                                        link = 'tags/' + change.data.id;

                                        linkTxt = change.data.name;

                                        break;

                                }

                                change.link = link;

                                change.linkTxt = linkTxt;

                            } else {

                                // 
                                // Extract feature name for display
                                // in deletion log bodies.
                                // 

                                if (featureType.indexOf('target') < 0) {

                                    if (featureType === 'project_member') {

                                        change.deletedName = change.data.user.first_name + ' ' + change.data.user.last_name;

                                    } else {

                                        change.deletedName = change.data.name;

                                    }

                                }

                            }

                        }

                        console.log(
                            'self.parseResponse.change:',
                            change
                        );

                    });

                });

                console.log('parsedResponse', self.changeLog);

            };

            // 
            // Verify Account information for proper UI element display
            //

            self.parseRouteParams();

            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.user = Account.userObject = userResponse;

                    self.permissions = {
                        can_edit: false,
                        is_manager: false,
                        is_admin: false
                    };

                    // 
                    // Retrieve the system's time zone offset.
                    // 

                    self.tzOffset = new Date().getTimezoneOffset();

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

                    self.loadHistory(true, self.queryParams);

                });

            } else {

                $location.path('/logout');

            }

        });