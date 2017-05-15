'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
  .controller('ProjectsCtrl', function (Account, $location, $log, Project, projects, $rootScope, $scope, Site, user, years) {

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
        // {
        //   type: 'button-link',
        //   action: function() {
        //     self.createPlan();
        //   },
        //   text: 'Create Pre-Project Plan'
        // },
        {
          type: 'button-link new',
          action: function() {
            self.createProject();
          },
          text: 'Create project'
        }
      ]
    };

    self.filters = {
        "active": {
            "workflow_state": null,
            "year": {
                "year": null
            },
            "sstring": null
        },
        "values": {
          "workflow_states": [
            'Draft',
            'Submitted',
            'Funded',
            'Completed'
          ],
          "years": years
        }
    };


    //
    // Project functionality
    //
    self.projects = projects;

    self.search = {
      query: '',
      execute: function(page) {

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

        if (self.filters.active.workflow_state !== null) {
          console.log('add workflow state filter')

          q.filters.push({
            "name": "workflow_state",
            "op": "like",
            "val": self.filters.active.workflow_state
          });
        }

        if (self.filters.active.year && self.filters.active.year.year) {
            q.filters.push({
              "name": "created_on",
              "op": "gte",
              "val": self.filters.active.year.year + "-01-01"
            });
            q.filters.push({
              "name": "created_on",
              "op": "lte",
              "val": self.filters.active.year.year + "-12-31"
            })
        }

        Project.query({
            "q": q,
            "page": (page ? page : 1)
          }).$promise.then(function(successResponse) {
            console.log("successResponse", successResponse);
            self.projects = successResponse;
          }, function(errorResponse) {
            console.log("errorResponse", errorResponse);
          });

      },
      paginate: function(pageNumber) {

        //
        // Get all of our existing URL Parameters so that we can
        // modify them to meet our goals
        //
        self.search.execute(pageNumber);
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

    self.createPlan = function() {
      self.project = new Project({
          'name': 'Project Plan',
          'program_type': 'Pre-Project Plan',
          'description': 'This project plan was created to estimate the potential benefits of a project\'s site and best management practices.'
      });

      self.project.$save(function(successResponse) {

          self.site = new Site({
            'name': 'Planned Site',
            'project_id': successResponse.id
          });

          self.site.$save(function(siteSuccessResponse) {
            $location.path('/projects/' + successResponse.id + '/sites/' + siteSuccessResponse.id + '/edit');
          }, function(siteErrorResponse) {
            console.error('Could not save your new Project Plan');
          });

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
    else {
        $location.path('/user/logout');
    }

  });
