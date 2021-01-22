(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('ReportEditController',
            function(Account, $location, MetricType, Organization,
                Practice, Report, ReportMetric, ReportMonitoring, report,
                $rootScope, $route, $scope, user, Utility,
                $timeout, report_metrics, $filter, $interval, Program) {

                var self = this;

                self.measurementPeriods = [{
                    'name': 'Installation',
                    'description': null
                }];

                $rootScope.page = {};

                self.status = {
                    loading: true,
                    processing: true,
                    readings: {
                        loading: false
                    },
                    metrics: {
                        loading: false
                    },
                    monitoring: {
                        loading: false
                    }
                };

                self.alerts = [];

                self.programSummary = {
                    program_count : 0
                };

                self.closeAlerts = function() {

                    self.alerts = [];

                };

                function closeRoute() {

                    $location.path('/practices/' + self.practice.id);

                }

                function railsRedirection(){
                    window.location.replace("/practices/"+self.report.practice.id);
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

                    }, 500);

                };

                $scope.loadMetrics = self.loadMetrics = function() {

                    Report.metrics({
                        id: $route.current.params.reportId
                    }).$promise.then(function(successResponse) {

                        console.log('Report metrics', successResponse);

                        var _reportMetrics = [];

                        successResponse.features.forEach(function(metric) {

                            var datum = self.processMetric(metric);

                            _reportMetrics.push(datum);

                        });

                        self.reportMetrics = _reportMetrics;

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                };

                self.processReport = function(data) {

                    self.report = data;

                    self.loadMetrics();

                };

                self.processMetric = function(metric) {

                    var datum = metric.properties || metric;

                    if (datum.category !== null) {

                        datum.category = datum.category.properties;

                    } else {

                        datum.category = null;

                    }

                    return datum;

                };

                //
                // Setup all of our basic date information so that we can use it
                // throughout the page
                //
                self.today = new Date();

                self.days = [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ];

                self.months = [{
                        'shortName': 'Jan',
                        'name': 'January',
                        'numeric': '01'
                    },
                    {
                        'shortName': 'Feb',
                        'name': 'February',
                        'numeric': '02'
                    },
                    {
                        'shortName': 'Mar',
                        'name': 'March',
                        'numeric': '03'
                    },
                    {
                        'shortName': 'Apr',
                        'name': 'April',
                        'numeric': '04'
                    },
                    {
                        'shortName': 'May',
                        'name': 'May',
                        'numeric': '05'
                    },
                    {
                        'shortName': 'Jun',
                        'name': 'June',
                        'numeric': '06'
                    },
                    {
                        'shortName': 'Jul',
                        'name': 'July',
                        'numeric': '07'
                    },
                    {
                        'shortName': 'Aug',
                        'name': 'August',
                        'numeric': '08'
                    },
                    {
                        'shortName': 'Sep',
                        'name': 'September',
                        'numeric': '09'
                    },
                    {
                        'shortName': 'Oct',
                        'name': 'October',
                        'numeric': '10'
                    },
                    {
                        'shortName': 'Nov',
                        'name': 'November',
                        'numeric': '11'
                    },
                    {
                        'shortName': 'Dec',
                        'name': 'December',
                        'numeric': '12'
                    }
                ];



                function parseISOLike(s) {
                    var b = s.split(/\D/);
                    return new Date(b[0], b[1] - 1, b[2]);
                }

                function convertPracticeArea(data) {

                    var area = data.area,
                        acres;

                    if (area !== null &&
                        area > 0) {

                        acres = $filter('convertArea')(area, 'acre');

                        return Utility.precisionRound(acres, 4);

                    }

                }

                self.calculateMeterWidth = function(tgt) {

                    if (typeof tgt.practice_target === 'number' &&
                        typeof tgt.total_reported === 'number') {

                        return (tgt.total_reported / tgt.practice_target) * 100;

                    }

                    return 0;

                };

                self.updateReportedTotal = function(target) {

                    console.log(
                        'self.updateReportedTotal:target',
                        target
                    );

                    if (typeof target.value === 'number') {

                        target.reported_value += target.value;

                        target.width = self.calculateMeterWidth(target);

                    }

                    console.log(
                        'self.updateReportedTotal:target[2]',
                        target
                    );

                };

                $scope.loadMatrix = self.loadMatrix = function(report_id, program_id) {

                    // loop over programs to see if currentProgram is currently set.

                    for(let program of self.programs){

                        if (program.program_id === program_id) {

                            self.currentProgram = program;

                            break;
                        }

                    }

                    //
                    // Assign practice to a scoped variable
                    //
                    Report.targetMatrix({
                        id: report_id,
                        simple_bool: 'true'
                    }).$promise.then(function(successResponse) {

                        var activeTargets = [];

                        successResponse.active.forEach(function (tgt) {

                            tgt.width = self.calculateMeterWidth(tgt);

                            activeTargets.push(tgt);

                        });

                        successResponse.active = activeTargets;

                        self.targets = successResponse;

                        console.log("self.targets",self.targets);

                        self.showElements();

                    }).catch(function(errorResponse) {

                        console.error('Unable to load report target matrix.');

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Unable to load report metric targets.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                    });

                };

                self.loadPractice = function(practiceId) {

                    Practice.get({
                        id: practiceId
                    }).$promise.then(function(successResponse) {

                        console.log('loadPractice.successResponse', successResponse);

                        self.practice = successResponse;

                        if (!successResponse.permissions.read &&
                            !successResponse.permissions.write) {

                            self.makePrivate = true;

                        } else {

                            self.permissions.can_edit = successResponse.permissions.write;
                            self.permissions.can_delete = successResponse.permissions.write;

                        }

                        self.loadOrganization(self.practice.organization.id);


                        // self.loadMetricTypes(self.practice.project);

                    }).catch(function(errorResponse) {

                        //

                    });

                };

                /*
                START Program context switch logic
                Note: we are currently loading in Organization Programs
                This is to be replaced with
                */

                self.loadOrganization = function(organizationId) {

                    Organization.profile({
                        id: organizationId
                    }).$promise.then(function(successResponse) {

                        console.log('self.organization', successResponse);

                        self.feature = successResponse;

                        self.programs = successResponse.programs;

                        self.programSummary.program_count = self.programs.length;

                        if(self.programs.length > 0 && self.currentProgram == undefined){
                            self.currentProgram = self.programs[0];
                        }

                        self.loadMetrics(self.practice.id,self.currentProgram.program_id);

                        self.loadMatrix(self.report.id, self.currentProgram.program_id);

                        self.status.loading = false;

                    }, function(errorResponse) {

                        console.error('Unable to load organization.');

                        self.status.loading = false;

                    });

                };

                /*
                END Program context switch logic
                 */


                $scope.$watch(angular.bind(this, function() {

                    return this.date;

                }), function(response) {

                    if (response) {

                        var _new = response.year + '-' + response.month.numeric + '-' + response.date,
                            _date = new Date(_new);
                        self.date.day = self.days[_date.getDay()];

                    }

                }, true);

                self.scrubFeature = function(feature) {

                    var excludedKeys = [
                        'creator',
                        'geometry',
                        'last_modified_by',
                        'organization',
                        'practice',
                        'program',
                        'project',
                        'properties',
                        'site',
                        'status',
                        'tags',
                        'targets',
                        'tasks',
                        'users'
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

                self.saveReport = function(metricArray) {

                    self.status.processing = true;

                    self.scrubFeature(self.report);

                    if (self.date.month.numeric !== null &&
                        typeof self.date.month.numeric === 'string') {

                        self.report.report_date = self.date.year + '-' + self.date.month.numeric + '-' + self.date.date;

                    } else {

                        self.report.report_date = self.date.year + '-' + self.date.month + '-' + self.date.date;

                    }

                    Report.update({
                        id: self.report.id
                    }, self.report).then(function(successResponse) {

                        self.processReport(successResponse);

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Report changes saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                        self.loadMetrics();

                        self.showElements();

                    //    if(self.practice.geometry == null || self.practice.geometry == undefined){
                        $timeout(railsRedirection,3000);
                   //     }

                    }).catch(function(errorResponse) {

                        console.error('ERROR: ', errorResponse);

                        self.alerts = [{
                            'type': 'error',
                            'flag': 'Error!',
                            'msg': 'Report changes could not be saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                        self.showElements();

                    });

                };

                self.deleteFeature = function() {

                    Report.delete({
                        id: +self.deletionTarget.id
                    }).$promise.then(function(data) {

                        self.alerts.push({
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Successfully deleted this report.',
                            'prompt': 'OK'
                        });

                        $timeout(closeRoute, 2000);

                    }).catch(function(errorResponse) {

                        console.log('self.deleteFeature.errorResponse', errorResponse);

                        if (errorResponse.status === 409) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Unable to delete “' + self.deletionTarget.properties.name + '”. There are pending tasks affecting this report.',
                                'prompt': 'OK'
                            }];

                        } else if (errorResponse.status === 403) {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'You don’t have permission to delete this report.',
                                'prompt': 'OK'
                            }];

                        } else {

                            self.alerts = [{
                                'type': 'error',
                                'flag': 'Error!',
                                'msg': 'Something went wrong while attempting to delete this report.',
                                'prompt': 'OK'
                            }];

                        }

                        $timeout(self.closeAlerts, 2000);

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

                    };

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

                self.saveTargets = function() {

                    self.status.processing = true;

                    // self.scrubFeature(self.report);

                    var data = {
                        targets: self.targets.active.slice(0)
                    };

                    self.targets.inactive.forEach(function(item) {

                        if (item.action &&
                            item.action === 'remove') {

                            data.targets.push(item);

                        }

                    });

                    Report.updateMatrix({
                        id: +self.report.id
                    }, data).$promise.then(function(successResponse) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Target changes saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(self.closeAlerts, 2000);

                        self.status.processing = false;

                        self.loadMatrix();

                    }).catch(function(error) {

                        console.log('saveReport.error', error);

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

                //
                // Verify Account information for proper UI element display
                //
                if (Account.userObject && user) {

                    user.$promise.then(function(userResponse) {

                        $rootScope.user = Account.userObject = userResponse;

                        self.permissions = {};

                        //
                        //
                        //
                        report.$promise.then(function(successResponse) {

                            console.log('self.report', successResponse);

                            self.processReport(successResponse);

                            if (self.report.report_date) {

                                self.today = parseISOLike(self.report.report_date);

                            }

                            //
                            // Check to see if there is a valid date
                            //
                            self.date = {
                                month: self.months[self.today.getMonth()],
                                date: self.today.getDate(),
                                day: self.days[self.today.getDay()],
                                year: self.today.getFullYear()
                            };

                            // $rootScope.page.title = "Other Conservation Practice";

                            $rootScope.page.title = 'Edit measurement data';

                            self.loadPractice(self.report.practice_id);

                            // self.loadMatrix();

                        }, function(errorResponse) {

                            console.error('ERROR: ', errorResponse);

                        });

                    });

                } else {

                    $location.path('/logout');

                }

            });

}());
