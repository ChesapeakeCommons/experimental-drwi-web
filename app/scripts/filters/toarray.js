'use strict';

/**
 * @ngdoc function
 * @name practiceMonitoringAssessmentApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the practiceMonitoringAssessmentApp
 */
angular.module('practiceMonitoringAssessmentApp')
  .filter('toArray', function(){

    //
    // This function transforms a dictionary or object into an array
    // so that we can use Filters, OrderBy, and other repeater functionality
    // with structured objects.
    //
    return  function(object) {
      
      var result = [];

      angular.forEach(object, function(value) {
        result.push(value);
      });
      
      return result;
    };

  });
