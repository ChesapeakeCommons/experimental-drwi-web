(function() {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .controller('ModelSummaryController', [
            'Account',
            '$location',
            '$timeout',
            '$log',
            '$rootScope',
            '$route',
            'Utility',
            'user',
            '$window',
            'mapbox',
            'Model',
            'Project',
            'model',
            function(Account, $location, $timeout, $log, $rootScope,
                $route, Utility, user, $window, mapbox, Model,
                Project, model) {

                var self = this;

                self.modelId = $route.current.params.modelId;

                $rootScope.viewState = {
                    'model': true
                };

                $rootScope.toolbarState = {
                    'dashboard': true
                };

                $rootScope.page = {};

                self.status = {
                    loading: true
                };

                self.alerts = [];

                function closeAlerts() {

                    self.alerts = [];

                }

                function closeRoute() {

                    $location.path(self.model.links.site.html);

                }

                self.loadModel = function() {

                    model.$promise.then(function(successResponse) {

                        console.log('self.model', successResponse);

                        self.model = successResponse;

                        $rootScope.model = successResponse;

                        $rootScope.page.title = self.model.name ? self.model.name : 'Un-named Model';

                        self.status.loading = false;

                        self.loadPractices();

                    }, function(errorResponse) {



                    });

                };

                self.loadTags = function() {

                    //

                };

                self.loadMetrics = function() {

                    //

                };

                self.loadProjects = function() {

                    //

                };

                self.loadPractices = function() {

                    Model.practiceTypes({
                        id: self.model.id
                    }).$promise.then(function(successResponse) {

                        console.log('Model.practiceTypes successResponse', successResponse);

                        var practiceTypes = [];

                        successResponse.features.forEach(function(feature) {

                            if(feature.model_practice_type.model_id == self.model.id){

                                practiceTypes.push(feature.practice_type);

                            }

                        });

                        self.practiceTypes = practiceTypes;

                    }, function(errorResponse) {

                        console.log('Model.practiceTypes errorResponse', errorResponse);

                    });

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

                        self.loadModel();

                    });
                }

            }
        ]);

}());