'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('ProjectsCtrl', function (Account, $location, $log, Project, projects, $rootScope, $scope, user) {

    var self = this;

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      title: 'Projects',
      links: [
        {
          text: 'Projects',
          url: '/projects',
          type: 'active'
        }
      ],
      actions: [
        {
          type: 'button-link new',
          action: function() {
            self.createProject();
          },
          text: 'Create project'
        }
      ]
    };

    //
    // Project functionality
    //
    self.projects = projects;

    self.search = {
      query: '',
      execute: function() {

        //
        // Get all of our existing URL Parameters so that we can
        // modify them to meet our goals
        //
        var q = {
          filters: [{
            "and": [
              {
                name: 'name',
                op: 'ilike',
                val: '%' + self.search.query + '%'
              }
            ]
          }],
          order_by: [{
            field: 'created_on',
            direction: 'desc'
          }]
        };

        $location.path('/projects/').search({
          q: angular.toJson(q),
          page: 1
        });

      },
      paginate: function(pageNumber) {

        //
        // Get all of our existing URL Parameters so that we can
        // modify them to meet our goals
        //
        var searchParams = $location.search();

        searchParams.page = pageNumber;

        $location.path('/projects/').search(searchParams);
      },
      clear: function() {
        $location.path('/projects/').search('');
      }
    };

    //
    // Set Default Search Filter value
    //
    if (self.search && self.search.query === '') {

      var searchParams = $location.search(),
          q = angular.fromJson(searchParams.q);

      if (q && q.filters && q.filters.length) {
        angular.forEach(q.filters[0].and, function(filter) {
            if (filter.name === 'name') {
              self.search.query = filter.val.replace(/%/g, '');;
            }
        });
      }
    };

    self.createProject = function() {
        self.project = new Project({
            'name': 'Untitled Project'
        });

        self.project.$save(function(successResponse) {
            $location.path('/projects/' + successResponse.id + '/edit');
        }, function(errorResponse) {
            $log.error('Unable to create Project object');
        });
    };

    //
    // Verify Account information for proper UI element display
    //
    if (Account.userObject && user) {
        user.$promise.then(function(userResponse) {
            $rootScope.user = Account.userObject = userResponse;
            self.permissions = {
                isLoggedIn: Account.hasToken()
            };
        });
    }

  });
