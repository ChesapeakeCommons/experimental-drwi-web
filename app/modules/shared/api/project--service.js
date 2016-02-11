(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('Project', function (environment, Preprocessors, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/project/:id'), {
        id: '@id'
      }, {
        query: {
          isArray: false
        },
        update: {
          method: 'PATCH',
          transformRequest: function(data) {
            var feature = Preprocessors.geojson(data);
            return angular.toJson(feature);
          }
        },
        sites: {
          method: 'GET',
          isArray: false,
          url: environment.apiUrl.concat('/v1/data/project/:id/sites')
        }
      });
    });

}());
