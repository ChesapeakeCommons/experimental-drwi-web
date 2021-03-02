'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('MetricTypeEditController', function(Account, $location, $log,
        MetricType, metricType, unitTypes, $q, $rootScope, $route, $timeout,
        $interval, user, Utility) {

        var self = this;

        $rootScope.viewState = {
            'metricType': true
        };

        $rootScope.toolbarState = {
            'edit': true
        };

        $rootScope.page = {};

        self.status = {
            loading: true,
            processing: true
        };

        self.alerts = [];

        function closeAlerts() {

            self.alerts = [];

        }

        function closeRoute() {

            $location.path('/programs/' + self.programId + '/metrics');

        }

        self.confirmDelete = function(obj) {

            console.log('self.confirmDelete', obj);

            self.deletionTarget = self.deletionTarget ? null : obj;

        };

        self.cancelDelete = function() {

            self.deletionTarget = null;

        };

        self.showElements = function() {

            $timeout(function() {

                self.status.loading = false;

                self.status.processing = false;

            }, 50);

        };

        self.parseUnit = function(datum, symbol) {

            datum.name = symbol ? (datum.symbol + ' \u00B7 ' + datum.plural) : datum.plural;

            return datum;

        };

        self.parseFeature = function(datum) {

            self.metricType = datum;

            self.programId = self.metricType.program_id;

            if (self.metricType.unit) {

                self.unitType = self.parseUnit(self.metricType.unit);

            }

            if (self.metricType.program &&
                typeof self.metricType.program !== 'undefined') {

                self.metricType.program = self.metricType.program;

            }

        };

        self.loadMetricType = function() {

            metricType.$promise.then(function(successResponse) {

                console.log('self.metricType', successResponse);

                self.parseFeature(successResponse);

                self.permissions = successResponse.permissions;

                if (!successResponse.permissions.read &&
                    !successResponse.permissions.write) {

                    self.makePrivate = true;

                }

                $rootScope.page.title = self.metricType.name ? self.metricType.name : 'Un-named Metric';

                self.showElements();

            }, function(errorResponse) {

                self.showElements();

            });

            unitTypes.$promise.then(function(successResponse) {

                console.log('Unit types', successResponse);

                var _unitTypes = [];

                successResponse.features.forEach(function(datum) {

                    _unitTypes.push(self.parseUnit(datum, true));

                });

                self.unitTypes = _unitTypes;

            }, function(errorResponse) {

                console.log('errorResponse', errorResponse);

            });

        };

        self.scrubFeature = function(feature) {

            var excludedKeys = [
                'creator',
                'extent',
                'geometry',
                'last_modified_by',
                'model',
                'organization',
                'program',
                'tags',
                'tasks',
                'unit'
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

        self.saveMetricType = function() {

            self.status.processing = true;

            self.scrubFeature(self.metricType);

            if (self.unitType &&
                typeof self.unitType !== 'string') {

                self.metricType.unit_id = self.unitType.id;

            }

            MetricType.update({
                id: self.metricType.id
            }, self.metricType).then(function(successResponse) {

                self.parseFeature(successResponse);

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Metric changes saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            }).catch(function(errorResponse) {

                // Error message

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Metric changes could not be saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            });

        };

        self.deleteFeature = function() {

            MetricType.delete({
                id: +self.deletionTarget.id
            }).$promise.then(function(data) {

                self.alerts.push({
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Successfully deleted this metric.',
                    'prompt': 'OK'
                });

                $timeout(closeRoute, 2000);

            }).catch(function(errorResponse) {

                console.log('self.deleteFeature.errorResponse', errorResponse);

                if (errorResponse.status === 409) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete “' + self.deletionTarget.name + '”. There are pending tasks affecting this metric.',
                        'prompt': 'OK'
                    }];

                } else if (errorResponse.status === 403) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'You don’t have permission to delete this metric.',
                        'prompt': 'OK'
                    }];

                } else {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong while attempting to delete this metric.',
                        'prompt': 'OK'
                    }];

                }

                $timeout(closeAlerts, 2000);

            });

        };

        self.setPracticeType = function($item, $model, $label) {

            console.log('self.unitType', $item);

            self.unitType = $item;

            self.metricType.unit_id = $item.id;

        };

        self.extractPrograms = function(user) {

            var _programs = [];

            user.programs.forEach(function(program) {

                _programs.push(program.properties);

            });

            return _programs;

        };

        //
        // Verify Account information for proper UI element display
        //
        if (Account.userObject && user) {

            user.$promise.then(function(userResponse) {

                $rootScope.user = Account.userObject = userResponse;

                self.permissions = {};

                self.programs = self.extractPrograms($rootScope.user);

                self.loadMetricType();

            });

        } else {

            $location.path('/logout');

        }

    });