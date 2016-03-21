(function(){

  'use strict';

  /**
   * @ngdoc service
   * @name FieldDoc.CalculateWetlandsNonTidal
   * @description
   */
  angular.module('FieldDoc')
    .service('CalculateWetlandsNonTidal', function(Calculate, LoadData, $q) {
      return {
        loads: {
          preinstallation: {},
          planned: {}
        },
        loadDataQuery: function(landuse, segment) {
          console.log('loadDataQuery', landuse, segment);
          var defer = $q.defer();

          var request = LoadData.query({
              q: {
                filters: [
                  {
                    name: 'land_river_segment',
                    op: 'eq',
                    val: segment
                  },
                  {
                    name: 'landuse',
                    op: 'eq',
                    val: landuse
                  }
                ]
              }
            }, function() {
              defer.resolve({
                landuse: request.features[0].properties.landuse,
                land_river_segment: request.features[0].properties.land_river_segment,
                nitrogen: (request.features[0].properties.eos_totn/request.features[0].properties.eos_acres),
                phosphorus: (request.features[0].properties.eos_totp/request.features[0].properties.eos_acres),
                sediment: (request.features[0].properties.eos_tss/request.features[0].properties.eos_acres)/2000
              });
            });

          return defer.promise;
        },
        getLoadDataQueries: function(value, segment) {

          var self = this,
              savedQueries = [],
              landuseList = [
                'installation_upland_landuse_1',
                'installation_upland_landuse_2',
                'installation_upland_landuse_3',
                'installation_upland_landuse_4'
              ];

          for (var i = 0; i < landuseList.length; i++) {
            savedQueries.push(self.loadDataQuery(value.properties[landuseList[i]], segment));
          }

          return savedQueries;
        },
        reduceLoadValues: function(previousValue, currentValue) {
          return previousValue + currentValue;
        },
        preInstallationLoad: function(data, loads, parameter) {

          var landuses = 4,
              calculatedLoads = [];

          for (var i = 0; i < landuses; i++) {
            var landuse = 'installation_upland_landuse_'+(i+1),
                acresTreated = 'installation_landuse_acreage_'+(i+1);

            calculatedLoads.push(data.properties[acresTreated]*loads[i][parameter]);
          };

          return calculatedLoads.reduce(this.reduceLoadValues);
        },
        plannedLoad: function(data, loads, efficiency, parameter) {

          var landuses = 4,
              calculatedLoads = [];

          for (var i = 0; i < landuses; i++) {
            var landuse = 'installation_upland_landuse_'+(i+1),
                acresTreated = 'installation_landuse_acreage_'+(i+1);

            calculatedLoads.push(data.properties[acresTreated]*loads[i][parameter]*efficiency[parameter]);
          };

          return calculatedLoads.reduce(this.reduceLoadValues);
        },
        preInstallationLoads: function(reports, segment) {

          var self = this,
              planningData = Calculate.getPlanningData(reports),
              savedQueries = this.getLoadDataQueries(planningData, segment);

          $q.all(savedQueries).then(function(successResponse) {

            var loadData = successResponse,
                efficiency = {
                  nitrogen: 0.20,
                  phosphorus: 0.45,
                  sediment: 0.60
                };

            self.loads.preinstallation = {
              nitrogen: self.preInstallationLoad(planningData, loadData, 'nitrogen'),
              phosphorus: self.preInstallationLoad(planningData, loadData, 'phosphorus'),
              sediment: self.preInstallationLoad(planningData, loadData, 'sediment')
            };

            switch (planningData.properties.planning_project_type) {
              case 'urban':
                self.loads.planned = {
                  nitrogen: self.plannedLoad(planningData, loadData, efficiency, 'nitrogen'),
                  phosphorus: self.plannedLoad(planningData, loadData, efficiency, 'phosphorus'),
                  sediment: self.plannedLoad(planningData, loadData, efficiency, 'sediment')
                }
              case 'agriculture':
                self.loads.planned = {
                  nitrogen: self.plannedLoad(planningData, loadData, efficiency, 'nitrogen'),
                  phosphorus: self.plannedLoad(planningData, loadData, efficiency, 'phosphorus'),
                  sediment: self.plannedLoad(planningData, loadData, efficiency, 'sediment')
                }
            }

          }, function(errorResponse) {
            console.log('errorResponse', errorResponse);
          });

        },
        plannedNitrogenLoadReduction: function(value) {},
        installedNitrogenLoadReduction: function(values, format) {},
        quantityInstalled: function(values, field, format) {

          var planned_total = 0,
              installed_total = 0,
              percentage = 0;

          // Get readings organized by their Type
          angular.forEach(values, function(reading, $index) {

            if (reading.properties.measurement_period === 'Planning') {
              planned_total += reading.properties[field];
            } else if (reading.properties.measurement_period === 'Installation') {
              installed_total += reading.properties[field];
            }

          });

          // Divide the Installed Total by the Planned Total to get a percentage of installed
          if (planned_total >= 1) {
            if (format === '%') {
              percentage = (installed_total/planned_total);
              return (percentage*100);
            } else {
              return installed_total;
            }
          }

          return 0;
        }
      }
    });

}());
