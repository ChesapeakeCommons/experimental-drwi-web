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

            $location.path('/programs/' + self.programId + '/metric-types');

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

            }, 1000);

        };

        self.parseUnit = function(datum, symbol) {

            datum.name = symbol ? (datum.symbol + ' \u00B7 ' + datum.plural) : datum.plural;

            return datum;

        };

        self.parseFeature = function(datum) {

            self.metricType = datum;

            self.programId = self.metricType.properties.program_id;

            if (self.metricType.properties.unit) {

                self.unitType = self.parseUnit(self.metricType.properties.unit.properties);

            }

        };

        self.loadMetricType = function() {

            metricType.$promise.then(function(successResponse) {

                console.log('self.metricType', successResponse);

                self.parseFeature(successResponse);

                if (!successResponse.permissions.read &&
                    !successResponse.permissions.write) {

                    self.makePrivate = true;

                }

                self.permissions.can_edit = successResponse.permissions.write;
                self.permissions.can_delete = successResponse.permissions.write;

                $rootScope.page.title = self.metricType.properties.name ? self.metricType.properties.name : 'Un-named Metric Type';

                self.scrubFeature();

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

        self.scrubFeature = function() {

            delete self.metricType.geometry;
            delete self.metricType.properties.organization;
            delete self.metricType.properties.creator;
            delete self.metricType.properties.last_modified_by;
            delete self.metricType.properties.program;
            delete self.metricType.properties.unit;

        };

        self.saveMetricType = function() {

            self.status.processing = true;

            self.scrubFeature();

            if (self.unitType &&
                typeof self.unitType !== 'string') {

                self.metricType.properties.unit_id = self.unitType.id;

            }

            self.metricType.$update().then(function(successResponse) {

                self.parseFeature(successResponse);

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Metric type changes saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            }, function(errorResponse) {

                // Error message

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Metric type changes could not be saved.',
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
                    'msg': 'Successfully deleted this metric type.',
                    'prompt': 'OK'
                });

                $timeout(closeRoute, 2000);

            }).catch(function(errorResponse) {

                console.log('self.deleteFeature.errorResponse', errorResponse);

                if (errorResponse.status === 409) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this metric type.',
                        'prompt': 'OK'
                    }];

                } else if (errorResponse.status === 403) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'You don’t have permission to delete this metric type.',
                        'prompt': 'OK'
                    }];

                } else {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong while attempting to delete this metric type.',
                        'prompt': 'OK'
                    }];

                }

                $timeout(closeAlerts, 2000);

            });

        };

        self.setPracticeType = function($item, $model, $label) {

            console.log('self.unitType', $item);

            self.unitType = $item;

            self.metricType.properties.unit_id = $item.id;

        };

        //
        // Verify Account information for proper UI element display
        //
        if (Account.userObject && user) {

            user.$promise.then(function(userResponse) {

                $rootScope.user = Account.userObject = userResponse;

                self.permissions = {
                    isLoggedIn: Account.hasToken(),
                    role: $rootScope.user.properties.roles[0],
                    account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null,
                    can_edit: false
                };

                self.loadMetricType();

            });

        } else {

            $location.path('/login');

        }

    });