'use strict';

/**
 * @ngdoc function
 * @name practiceMonitoringAssessmentApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the practiceMonitoringAssessmentApp
 */
angular.module('practiceMonitoringAssessmentApp')
  .controller('MainCtrl', ['$rootScope', '$scope', function ($rootScope, $scope) {

    //
    // Setup basic page variables
    //
    $scope.page = {
      template: '/views/index.html',
      title: 'Welcome',
      back: '/'
    };

  }]);
