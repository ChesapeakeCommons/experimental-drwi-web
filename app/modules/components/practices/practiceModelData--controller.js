'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeModelDataController',
        function($scope, Account, $location, $log, Practice, practice,
            $rootScope, $route, user, FilterStore, $timeout, SearchService,
            MetricType, Model, $filter, $http, $window, GenericFile) {

            var self = this;

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

            self.status = {
                processing: true
            };

            self.modelInputs = {};

            self.alerts = [];

            self.closeAlerts = function() {

                self.alerts = [];

            };

            function closeRoute() {

                    if(self.practice.site != null){
                         $location.path(self.practice.links.site.html);
                    }else{

                    } $location.path("/projects/"+self.practice.project.id);

            }

            self.loadMatrix = function() {

                Practice.targetMatrix({
                    id: $route.current.params.practiceId,
                    simple_bool: 'true'
                }).$promise.then(function(successResponse) {

                    console.log('self.loadMatrix.successResponse', successResponse);

                    self.targets = successResponse.active || [];

                }).catch(function(errorResponse) {

                    console.log('Unable to load practice target matrix.');

                });

            };

            self.loadModels = function(activeDomain) {

                console.log('self.loadModel.activeDomain', activeDomain);

                Practice.models({
                    id: $route.current.params.practiceId
                }).$promise.then(function(successResponse) {

                    console.log('Practice model successResponse', successResponse);

                    self.models = successResponse.features;

                }, function(errorResponse) {

                    console.log('Practice model errorResponse', errorResponse);

                });

            };

            self.saveInputs = function() {

                console.log('self.saveInputs.run');

                self.modelInputs.practice_code = self.practice.category.model_key;

                self.models.forEach(function(feature, index) {

                    console.log(
                    'self.saveInputs --> model',
                    feature,
                    index);

                    $http({
                        method: 'POST',
                        url: feature.model.api_url,
                        data: self.modelInputs
                    }).then(function successCallback(successResponse) {

                        console.log(
                        'self.saveInputs.successResponse',
                        successResponse);

                        var automatedTargets = [];

                        feature.metrics.forEach(function(metric) {

                            if (successResponse.data.hasOwnProperty(metric.model_key)) {

                                console.log(
                                    'self.saveInputs.metricMatch',
                                    successResponse.data[metric.model_key],
                                    metric.model_key);

                                metric.value = successResponse.data[metric.model_key];

                                automatedTargets.push({
                                    name: metric.name,
                                    value: metric.value,
                                    metric_id: metric.id,
                                    metric: metric
                                });

                            }

                        });

                        //
                        // If the practice has existing targets, update their values.
                        //

                        if (self.targets.length) {

                            automatedTargets.forEach(function(newTarget) {

                                self.syncTarget(self.targets, newTarget);

                            });

                        } else {

                            self.targets = automatedTargets;

                        }

                        self.saveTargets();

                    }, function errorCallback(errorResponse) {

                        console.log('self.saveInputs.errorResponse', errorResponse);

                    });

                });

            };

            self.syncTarget = function(baseList, newTarget) {

                console.log(
                    'self.syncTargets.params',
                    baseList,
                    newTarget);

                baseList.forEach(function(target) {

                    if (target.metric.id === newTarget.metric_id) {

                        console.log(
                            'self.syncTargets.metricMatch',
                            target.metric.id,
                            newTarget.metric_id);

                        target.value = newTarget.value;

                    }

                });

            };

            self.loadPractice = function() {

                var exclude = [
                    'centroid',
                    'creator',
                    'dashboards',
                    'extent',
                    'geometry',
                    'members',
                    'metric_types',
                    'partners',
                    'practices',
                    'practice_types',
                    'properties',
                    'tags',
                    'targets',
                    'tasks',
                    'type',
                    'practices'
                ].join(',');

                Practice.get({
                    id: $route.current.params.practiceId,
                    exclude: exclude
                }).$promise.then(function(successResponse) {

                    self.processPractice(successResponse);

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                }).catch(function(errorResponse) {

                    console.log('Unable to load practice');

                    self.status.processing = false;

                });

            };

            self.removeAll = function() {

                self.targets.active.forEach(function(item) {

                    self.targets.inactive.unshift(item);

                });

                self.targets.active = [];

            };

            self.addTarget = function(item, idx) {

                if (!item.value ||
                    typeof item.value !== 'number') {

                    item.value = 0;

                }

                if (typeof idx === 'number') {

                    item.action = 'add';

                    if (!item.metric ||
                        typeof item.metric === 'undefined') {

                        item.metric_id = item.id;

                        delete item.id;

                    }

                    self.targets.inactive.splice(idx, 1);

                    self.targets.active.push(item);

                }

                console.log('Updated targets (addition)');

            };

            self.removeTarget = function(item, idx) {

                if (typeof idx === 'number') {

                    self.targets.active.splice(idx, 1);

                    item.action = 'remove';

                    item.value = null;

                    self.targets.inactive.unshift(item);

                }

                console.log('Updated targets (removal)');

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

                self.practice = data.properties || data;

                if (self.practice.model_inputs) {

                    self.modelInputs = JSON.parse(self.practice.model_inputs);

                }

                self.tempTargets = self.practice.targets || [];

                self.status.processing = false;

                self.tplUrl = self.practice.category.model_tpl_url + '?t=' + Date.now();

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'creator',
                    'extent',
                    'geometry',
                    'images',
                    'last_modified_by',
                    'organization',
                    'project',
                    'site',
                    'tags',
                    'targets',
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

            self.saveTargets = function() {

                self.status.processing = true;

                self.scrubFeature(self.practice);

                console.log('self.savePractice.practice', self.practice);

                console.log('self.savePractice.Practice', Practice);

                var data = {
                    targets: self.targets
                };

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

                    self.savePractice();

                }).catch(function(error) {

                    console.log('savePractice.error', error);

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

            self.uploadAttachment = function() {

                if (!self.fileAttachment ||
                    !self.fileAttachment.length) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Please select a file.',
                        'prompt': 'OK'
                    }];

                    $timeout(self.closeAlerts, 2000);

                    return false;

                }

                self.progressMessage = 'Uploading your file...';

                var fileData = new FormData();

                fileData.append('file', self.fileAttachment[0]);

                console.log('fileData', fileData);

                try {

                    GenericFile.upload({}, fileData, function(successResponse) {

                        console.log('successResponse', successResponse);

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Upload successful.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                        self.modelInputs.attachment_url = successResponse.file_url;

                        self.savePractice();

                    }, function(errorResponse) {

                        console.log('Upload error', errorResponse);

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'The file could not be processed.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                    });

                } catch (error) {

                    console.log('File upload error', error);

                }

            };

            self.openAttachment = function(url) {

                $window.open(url, '_blank');

            };

            self.savePractice = function() {

                self.status.processing = true;

                self.scrubFeature(self.practice);

                // self.practice.targets = self.processTargets(self.tempTargets);

                self.practice.model_inputs = JSON.stringify(self.modelInputs);

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

                    self.loadMatrix();

                }).catch(function(error) {

                    console.log('savePractice.error', error);

                    // Do something with the error

                    self.status.processing = false;

                });

            };

            //
            // Verify Account information for proper UI element display
            //

            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.permissions = {};

                    self.loadPractice();

                    self.loadMatrix();

                    self.loadModels();

                    //
                    // Setup page meta data
                    //

                    $rootScope.page = {
                        'title': 'Add model data'
                    };

                });

            } else {

                $location.path('/logout');

            }

        });