(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name FieldDoc.controller:WetlandsNonTidalReportController
   * @description
   */
  angular.module('FieldDoc')
    .controller('WetlandsNonTidalReportController', function (Account, Calculate, CalculateWetlandsNonTidal, Efficiency, LoadData, $location, $log, practice, PracticeWetlandsNonTidal, $q, readings, $rootScope, $route, site, $scope, user, Utility, $window) {

      var self = this,
          projectId = $route.current.params.projectId,
          siteId = $route.current.params.siteId,
          practiceId = $route.current.params.practiceId;

      $rootScope.page = {};

      self.practiceType = null;
      self.project = {
        'id': projectId
      };

      self.calculate = Calculate;
      self.calculateWetlandsNonTidal = CalculateWetlandsNonTidal;

      practice.$promise.then(function(successResponse) {

        self.practice = successResponse;

        self.practiceType = Utility.machineName(self.practice.properties.practice_type);

        //
        //
        //
        self.template = {
          path: '/modules/components/practices/modules/' + self.practiceType + '/views/report--view.html'
        };

        //
        //
        //
        site.$promise.then(function(successResponse) {
          self.site = successResponse;

          self.segment = self.site.properties.segment.properties.hgmr_code;

          $rootScope.page.title = self.practice.properties.practice_type;
          $rootScope.page.links = [
              {
                  text: 'Projects',
                  url: '/projects'
              },
              {
                  text: self.site.properties.project.properties.name,
                  url: '/projects/' + projectId
              },
              {
                text: self.site.properties.name,
                url: '/projects/' + projectId + '/sites/' + siteId
              },
              {
                text: self.practice.properties.practice_type,
                url: '/projects/' + projectId + '/sites/' + siteId + '/practices/' + self.practice.id,
                type: 'active'
              }
          ];

          $rootScope.page.actions = [
            {
              type: 'button-link',
              action: function() {
                $window.print();
              },
              hideIcon: true,
              text: 'Print'
            },
            {
              type: 'button-link',
              action: function() {
                $scope.$emit('saveToPdf');
              },
              hideIcon: true,
              text: 'Save as PDF'
            },
            {
              type: 'button-link new',
              action: function() {
                self.addReading();
              },
              text: 'Add Measurement Data'
            }
          ];

        }, function(errorResponse) {
          //
        });

        //
        // Verify Account information for proper UI element display
        //
        if (Account.userObject && user) {
            user.$promise.then(function(userResponse) {
                $rootScope.user = Account.userObject = userResponse;

                self.permissions = {
                    isLoggedIn: Account.hasToken(),
                    role: $rootScope.user.properties.roles[0].properties.name,
                    account: ($rootScope.account && $rootScope.account.length) ? $rootScope.account[0] : null,
                    can_edit: true
                };
            });
        }
      });

      readings.$promise.then(function(successResponse) {

        self.readings = successResponse;

        self.total = {
          planning: self.calculate.getTotalReadingsByCategory('Planning', self.readings.features),
          installation: self.calculate.getTotalReadingsByCategory('Installation', self.readings.features),
          monitoring: self.calculate.getTotalReadingsByCategory('Monitoring', self.readings.features)
        };

        self.results = self.calculateWetlandsNonTidal.loads(self.readings.features, self.segment)

      }, function(errorResponse) {

      });

      self.addReading = function(measurementPeriod) {

        var newReading = new PracticeWetlandsNonTidal({
            'measurement_period': measurementPeriod,
            'report_date': new Date(),
            'practice_id': practiceId,
            'account_id': self.site.properties.project.properties.account_id
          });

        newReading.$save().then(function(successResponse) {
            $location.path('/projects/' + projectId + '/sites/' + siteId + '/practices/' + practiceId + '/' + self.practiceType + '/' + successResponse.id + '/edit');
          }, function(errorResponse) {
            console.error('ERROR: ', errorResponse);
          });
      };


    });

}());