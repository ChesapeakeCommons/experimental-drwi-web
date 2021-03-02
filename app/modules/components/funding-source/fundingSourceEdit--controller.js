'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('FundingSourceEditController', function(Account, $location, $log,
        FundingSource, fundingSource, $q, $rootScope, $route, $timeout,
        $interval, user, Utility, SearchService) {

        var self = this;

        $rootScope.viewState = {
            'fundingSource': true
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

            }, 50);

        };

        self.parseUnit = function(datum, symbol) {

            datum.name = symbol ? (datum.symbol + ' \u00B7 ' + datum.plural) : datum.plural;

            return datum;

        };

        self.parseFeature = function(datum) {

            self.fundingSource = datum;

        };

        self.loadFundingSource = function() {

            fundingSource.$promise.then(function(successResponse) {

                console.log('self.fundingSource', successResponse);

                self.parseFeature(successResponse);

                if (!successResponse.permissions.read &&
                    !successResponse.permissions.write) {

                    self.makePrivate = true;

                }

                self.permissions.can_edit = successResponse.permissions.write;
                self.permissions.can_delete = successResponse.permissions.write;

                $rootScope.page.title = self.fundingSource.name ? self.fundingSource.name : 'Un-named Funding Source';

                self.scrubFeature();

                self.showElements();

            }, function(errorResponse) {

                self.showElements();

            });

        };

        self.searchOrganizations = function(value) {

            return SearchService.organization({
                q: value
            }).$promise.then(function(response) {

                console.log('SearchService.organization response', response);

                response.results.forEach(function(result) {

                    delete result.category;
                    delete result.subcategory;

                });

                return response.results.slice(0, 5);

            });

        };

        self.scrubFeature = function() {

            //

        };

        self.saveFundingSource = function() {

            self.status.processing = true;

            FundingSource.update({
                id: self.fundingSource.id
            }, self.fundingSource).then(function(successResponse) {

                self.parseFeature(successResponse);

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Funding source changes saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            }).catch(function(errorResponse) {

                // Error message

                self.alerts = [{
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Funding source changes could not be saved.',
                    'prompt': 'OK'
                }];

                $timeout(closeAlerts, 2000);

                self.showElements();

            });

        };

        self.deleteFeature = function() {

            FundingSource.delete({
                id: +self.deletionTarget.id
            }).$promise.then(function(data) {

                self.alerts.push({
                    'type': 'success',
                    'flag': 'Success!',
                    'msg': 'Successfully deleted this funding source.',
                    'prompt': 'OK'
                });

                $timeout(closeRoute, 2000);

            }).catch(function(errorResponse) {

                console.log('self.deleteFeature.errorResponse', errorResponse);

                if (errorResponse.status === 409) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Unable to delete “' + self.deletionTarget.name + '”. There are pending tasks affecting this funding source.',
                        'prompt': 'OK'
                    }];

                } else if (errorResponse.status === 403) {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'You don’t have permission to delete this funding source.',
                        'prompt': 'OK'
                    }];

                } else {

                    self.alerts = [{
                        'type': 'error',
                        'flag': 'Error!',
                        'msg': 'Something went wrong while attempting to delete this funding source.',
                        'prompt': 'OK'
                    }];

                }

                $timeout(closeAlerts, 2000);

            });

        };

        self.setPracticeType = function($item, $model, $label) {

            console.log('self.unitType', $item);

            self.unitType = $item;

            self.fundingSource.unit_id = $item.id;

        };

        self.extractPrograms = function(user) {

            var _programs = [];

            user.programs.forEach(function(program) {

                _programs.push(program);

            });

            return _programs;

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

                self.programs = self.extractPrograms($rootScope.user);

                self.loadFundingSource();

            });

        } else {

            $location.path('/logout');

        }

    });