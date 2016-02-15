'use strict';

/**
 * @ngdoc overview
 * @name 
 * @description
 */
angular
  .module('FieldStack', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ipCookie',
    'leaflet-directive',
    'angularFileUpload',
    'geolocation',
    'angular-loading-bar',
    'monospaced.elastic',
    'angularMoment',
    'config'
  ]);

'use strict';

/**
 * @ngdoc overview
 * @name 
 * @description
 */
angular.module('FieldStack')
  .config(function($routeProvider, $locationProvider) {

    $routeProvider
      .otherwise({
        templateUrl: '/modules/shared/errors/error404--view.html'
      });

    $locationProvider.html5Mode(true);

  });

"use strict";

 angular.module('config', [])

.constant('environment', {name:'local',apiUrl:'http://127.0.0.1:5000',siteUrl:'http://127.0.0.1:9000',clientId:'lynCelX7eoAV1i7pcltLRcNXHvUDOML405kXYeJ1'})

;
(function() {

    'use strict';

    /**
     * @ngdoc overview
     * @name FieldStack
     * @description
     * # FieldStack
     *
     * Main module of the application.
     */
    angular.module('FieldStack')
      .config(function ($routeProvider) {
        $routeProvider
          .when('/', {
            redirectTo: '/user/login'
          })
          .when('/user', {
            redirectTo: '/user/login'
          })
          .when('/user/login', {
            templateUrl: '/modules/shared/security/views/securityLogin--view.html',
            controller: 'SecurityController',
            controllerAs: 'page'
          })
          .when('/user/register', {
            templateUrl: '/modules/shared/security/views/securityRegister--view.html',
            controller: 'SecurityController',
            controllerAs: 'page'
          })
          .when('/user/reset', {
            templateUrl: '/modules/shared/security/views/securityResetPassword--view.html',
            controller: 'SecurityResetPasswordController',
            controllerAs: 'page'
          })
          .when('/logout', {
            redirectTo: '/user/logout'
          })
          .when('/user/logout', {
            template: 'Logging out ...',
            controller: 'SecurityLogoutController',
            controllerAs: 'page'
          });
      });

}());

(function() {

    'use strict';

    /**
     * @ngdoc controller
     * @name
     * @description
     */
     angular.module('FieldStack')
        .controller('SecurityController', function(Account, $location, Security, ipCookie, $route, $rootScope, $timeout) {

            var self = this;

            self.cookieOptions = {
                'path': '/',
                'expires': 7
            };

            //
            // Before showing the user the login page,
            //
            if (ipCookie('FIELDSTACKIO_SESSION')) {
                $location.path('/projects');
            }

            self.login = {
              submit: function(firstTime) {

                self.login.processing = true;

                var credentials = new Security({
                  email: self.login.email,
                  password: self.login.password,
                });

                credentials.$save(function(response) {

                  //
                  // Check to see if there are any errors by checking for the existence
                  // of response.response.errors
                  //
                  if (response.response && response.response.errors) {
                    self.login.errors = response.response.errors;
                    self.register.processing = false;
                    self.login.processing = false;

                    $timeout(function() {
                      self.login.errors = null;
                    }, 3500);
                  } else {
                    //
                    // Make sure our cookies for the Session are being set properly
                    //
                    ipCookie.remove('FIELDSTACKIO_SESSION');
                    ipCookie('FIELDSTACKIO_SESSION', response.access_token, self.cookieOptions);

                    //
                    // Make sure we also set the User ID Cookie, so we need to wait to
                    // redirect until we're really sure the cookie is set
                    //
                    Account.setUserId().$promise.then(function() {
                      Account.getUser().$promise.then(function(userResponse) {

                        Account.userObject = userResponse;

                        $rootScope.user = Account.userObject;
                        $rootScope.isLoggedIn = Account.hasToken();
                        $rootScope.isAdmin = Account.hasRole('admin');

                        if ($rootScope.isAdmin) {
                          $location.path('/projects');
                        }
                        else if (firstTime) {
                          $location.path('/profiles/' + $rootScope.user.id + '/edit');
                        }
                        else {
                          $location.path('/activity');
                        }
                      });
                    });

                  }
                }, function(){
                  self.login.processing = false;
                  self.login.errors = {
                    email: ['The email or password you provided was incorrect']
                  };

                  $timeout(function() {
                    self.login.errors = null;
                  }, 3500);
                });
              }
            };
        });

}());

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:SecurityLogout
 * @description
 * # SecurityLogout
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('SecurityLogout', ['$location', 'token', function($location, token) {

    console.log('SecurityLogout');
    
    //
    // Remove the access token from our session cookie
    //
    token.remove();

    //
    // Redirect the user to the home page
    //
    $location.path('/');
    
  }]);

(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name FieldStack.authorizationInterceptor
     * @description
     * # authorizationInterceptor
     * Service in the FieldStack.
     */
    angular.module('FieldStack')
      .factory('AuthorizationInterceptor', function($location, $q, ipCookie, $log) {

        return {
          request: function(config) {

            var sessionCookie = ipCookie('FIELDSTACKIO_SESSION');

            //
            // Configure our headers to contain the appropriate tags
            //
            config.headers = config.headers || {};

            if (config.headers['Authorization-Bypass'] === true) {
              delete config.headers['Authorization-Bypass'];
              return config || $q.when(config);
            }

            if (sessionCookie) {
              config.headers.Authorization = 'Bearer ' + sessionCookie;
            }

            config.headers['Cache-Control'] = 'no-cache, max-age=0, must-revalidate';

            //
            // Configure or override parameters where necessary
            //
            config.params = (config.params === undefined) ? {} : config.params;

            console.debug('SecurityInterceptor::Request', config || $q.when(config));

            return config || $q.when(config);
          },
          response: function(response) {
            $log.info('AuthorizationInterceptor::Response', response || $q.when(response));
            return response || $q.when(response);
          },
          responseError: function (response) {
            $log.info('AuthorizationInterceptor::ResponseError', response || $q.when(response));
            return $q.reject(response);
          }
        };
      }).config(function ($httpProvider) {
        $httpProvider.interceptors.push('AuthorizationInterceptor');
      });

}());

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.Navigation
 * @description
 * # Navigation
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .service('token', ['$location', 'ipCookie', function ($location, ipCookie) {

    return {
      get: function() {
        return ipCookie('COMMONS_SESSION');
      },
      remove: function() {
        //
        // Clear out existing COMMONS_SESSION cookies that may be invalid or
        // expired. This may happen when a user closes the window and comes back
        //
        ipCookie.remove('COMMONS_SESSION');
        ipCookie.remove('COMMONS_SESSION', { path: '/' });
      },
      save: function() {
        var locationHash = $location.hash(),
            accessToken = locationHash.substring(0, locationHash.indexOf('&')).replace('access_token=', '');

        ipCookie('COMMONS_SESSION', accessToken, {
              path: '/',
              expires: 2
            });

        $location.hash(null);

        $location.path('/projects');
      }
    };

  }]);

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects', {
        templateUrl: '/modules/components/projects/views/projectsList--view.html',
        controller: 'ProjectsCtrl',
        controllerAs: 'page',
        reloadOnSearch: false,
        resolve: {
          projects: function(Project) {
            return Project.query();
          },
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          }
        }
      })
      .when('/projects/:projectId', {
        templateUrl: '/modules/components/projects/views/projectsSingle--view.html',
        controller: 'ProjectViewCtrl',
        controllerAs: 'page',
        resolve: {
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          },
          project: function(Project, $route) {
            return Project.get({
                'id': $route.current.params.projectId
            });
          },
          sites: function(Project, $route) {
            return Project.sites({
                'id': $route.current.params.projectId
            });
          }
        }
      })
      .when('/projects/:projectId/edit', {
        templateUrl: '/modules/components/projects/views/projectsEdit--view.html',
        controller: 'ProjectEditCtrl',
        controllerAs: 'page',
        resolve: {
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          },
          project: function(Project, $route) {
            return Project.get({
                'id': $route.current.params.projectId
            });
          }
        }
      })
      .when('/projects/:projectId/users', {
        templateUrl: '/modules/components/projects/views/projectsUsers--view.html',
        controller: 'ProjectUsersCtrl',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.project.templateId
            });
          },
          users: function(User) {
            return User.GetUsers();
          },
          projectUsers: function(Feature, $route) {
            return Feature.GetFeatureUsers({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.project.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.project.templateId, 'object');
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          storage: function() {
            return commonscloud.collections.project.storage;
          }
        }
      });

  });

'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('ProjectsCtrl', function (Account, $location, $log, Project, projects, $rootScope, user) {

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

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:ProjectviewCtrl
 * @description
 * # ProjectviewCtrl
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('ProjectViewCtrl', function (Account, $rootScope, $route, $location, mapbox, project, Site, sites, user) {

    var self = this;
    $rootScope.page = {};

    self.sites = sites;

    //
    // Assign project to a scoped variable
    //
    project.$promise.then(function(projectResponse) {
        self.project = projectResponse;

        $rootScope.page.title = self.project.properties.name;
        $rootScope.page.links = [
            {
                text: 'Projects',
                url: '/projects'
            },
            {
                text: self.project.properties.name,
                url: '/projects/' + $route.current.params.projectId,
                type: 'active'
            }
        ];

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
                    can_edit: Account.canEdit(project)
                };
            });
        }

    });


    self.createSite = function() {
        self.site = new Site({
            'name': 'Untitled Site',
            'project_id': self.project.id,
            'account_id': self.project.properties.account_id
        });

        self.site.$save(function(successResponse) {
            $location.path('/projects/' + self.project.id + '/sites/' + successResponse.id + '/edit');
          }, function(errorResponse) {
            console.error('Unable to create your site, please try again later');
          });
    };

    //
    // Setup basic page variables
    //
    $rootScope.page.actions = [
      {
        type: 'button-link new',
        action: function() {
          self.createSite();
        },
        text: 'Create site'
      }
    ];

    // self.$watch('project.sites.list', function(processedSites, existingSites) {
    //  // console.log('self.project.sites.list,', self.project.sites.list)
    //  angular.forEach(processedSites, function(feature, $index) {
    //    var coords = [0,0];
    //
    //    if (feature.geometry !== null) {
    //      console.log('feature.geometry', feature.geometry);
    //      if (feature.geometry.geometries[0].type === 'Point') {
    //        coords = feature.geometry.geometries[0].coordinates;
    //      }
    //    }
    //
    //    self.project.sites.list[$index].site_thumbnail = 'https://api.tiles.mapbox.com/v4/' + mapbox.satellite + '/pin-s+b1c11d(' + coords[0] + ',' + coords[1] + ',17)/' + coords[0] + ',' + coords[1] + ',17/80x80@2x.png?access_token=' + mapbox.access_token;
    //  });
    //});


  });

'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('ProjectEditCtrl', function (Account, $location, $log, Project, project, $rootScope, $route, user) {

    var self = this;
    $rootScope.page = {};

    //
    // Assign project to a scoped variable
    //
    project.$promise.then(function(successResponse) {
        self.project = successResponse;

        $rootScope.page.title = self.project.properties.name;
        $rootScope.page.links = [
            {
              text: 'Projects',
              url: '/projects'
            },
            {
              text: self.project.properties.name,
              url: '/projects/' + self.project.id
            },
            {
              text: 'Edit',
              url: '/projects/' + self.project.id + '/edit',
              type: 'active'
            }
        ];
        $rootScope.page.actions = [];

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
                    can_edit: Account.canEdit(project)
                };
            });
        }

    }, function(errorResponse) {
        $log.error('Unable to load request project');
    });

    //
    //
    //
    self.saveProject = function() {
      self.project.$update().then(function(response) {

        $location.path('/projects/' + self.project.id);

      }).then(function(error) {
        // Do something with the error
      });

    };

    self.deleteProject = function() {
      self.project.$delete().then(function(response) {

        $location.path('/projects/');

      }).then(function(error) {
        // Do something with the error
      });
    };

  });

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:ProjectUsersCtrl
 * @description
 * # ProjectUsersCtrl
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('ProjectUsersCtrl', ['$rootScope', '$scope', '$route', '$location', 'project', 'Template', 'Feature', 'Field', 'template', 'fields', 'storage', 'user', 'users', 'projectUsers', function ($rootScope, $scope, $route, $location, project, Template, Feature, Field, template, fields, storage, user, users, projectUsers) {

    //
    // Setup necessary Template and Field lists
    //
    $scope.template = template;
    $scope.fields = fields;


    //
    // Setup the Project
    //
    $scope.project = project;
    $scope.project.users = projectUsers;
    $scope.project.users_edit = false;


    //
    // Modal Windows
    //
    $scope.modals = {
      open: function($index) {
        $scope.modals.windows[$index].visible = true;
      },
      close: function($index) {
        $scope.modals.windows[$index].visible = false;
      },
      windows: {
        inviteUser: {
          title: 'Add a collaborator',
          body: '',
          visible: false
        }
      }
    };


    //
    // Setup User information
    //
    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    $scope.users = {
      list: users,
      search: null,
      invite: function(user) {
        $scope.invite.push(user); // Add selected User object to invitation list
        this.search = null; // Clear search text
      },
      add: function() {
        angular.forEach($scope.invite, function(user_, $index) {
          Feature.AddUser({
            storage: storage,
            featureId: $scope.project.id,
            userId: user_.id,
            data: {
              read: true,
              write: true,
              is_admin: false
            }
          }).then(function(response) {
            //
            // Once the users have been added to the project, close the modal
            // and refresh the page
            //
            $scope.modals.close('inviteUser');
            $scope.page.refresh();
          });
        });
      },
      remove: function(user) {
        var index = $scope.project.users.indexOf(user);
        
        Feature.RemoveUser({
            storage: storage,
            featureId: $scope.project.id,
            userId: user.id
          }).then(function(response) {
            //
            // Once the users have been added to the project, close the modal
            // and refresh the page
            //
            $scope.project.users.splice(index, 1);
          });
      },
      remove_confirm: false
    };


    $scope.invite = [];


    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/projects/views/projects--users.html',
      title: $scope.project.project_title + ' Users',
      display_title: false,
      editable: true,
      back: '/',
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id
        },
        {
          text: 'Collaborators',
          url: '/projects/' + $scope.project.id + '/users',
          type: 'active'
        }
      ],
      actions: [
        {
          type: 'button-link',
          // url: '/projects/' + $scope.project.id + '/users/invite',
          action: function($index) {
            $scope.project.users_edit = ! $scope.project.users_edit;
            $scope.page.actions[$index].visible = ! $scope.page.actions[$index].visible;
          },
          visible: false,
          text: 'Edit collaborators',
          alt: 'Done Editing'
        },
        {
          type: 'button-link new',
          // url: '/projects/' + $scope.project.id + '/users/invite',
          action: function() {
            console.log('modal');
            $scope.modals.open('inviteUser');
          },
          text: 'Add a collaborator'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };

    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;
        
        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: storage,
            featureId: $scope.project.id,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
            if ($scope.user.feature.is_admin || $scope.user.feature.write) {
            } else {
              $location.path('/projects/' + $scope.project.id);
            }
          });
        }

      });
    }

  }]);

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(['$routeProvider', 'commonscloud', function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites', {
        redirectTo: '/projects/:projectId'
      })
      .when('/projects/:projectId/sites/:siteId', {
        templateUrl: '/modules/components/sites/views/sites--view.html',
        controller: 'SiteViewCtrl',
        controllerAs: 'page',
        resolve: {
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          },
          site: function(Site, $route) {
            return Site.get({
              id: $route.current.params.siteId
            });
          },
          practices: function(Site, $route) {
            return Site.practices({
              id: $route.current.params.siteId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/edit', {
        templateUrl: '/modules/components/sites/views/sites--edit.html',
        controller: 'SiteEditCtrl',
        controllerAs: 'page',
        resolve: {
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          },
          site: function(Site, $route) {
            return Site.get({
              id: $route.current.params.siteId
            });
          }
        }
      });

  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:SiteViewCtrl
 * @description
 * # SiteViewCtrl
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('SiteViewCtrl', function (Account, leafletData, $location, site, Practice, practices, $rootScope, $route, user) {

    var self = this;

    $rootScope.page = {};

    self.practices = practices;

    site.$promise.then(function(successResponse) {

      self.site = successResponse;

      $rootScope.page.title = self.site.properties.name;
      $rootScope.page.links = [
          {
              text: 'Projects',
              url: '/projects'
          },
          {
              text: self.site.properties.project.properties.name,
              url: '/projects/' + $route.current.params.projectId
          },
          {
            text: self.site.properties.name,
            url: '/projects/' + $route.current.params.projectId + '/sites/' + self.site.id,
            type: 'active'
          }
      ];

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
                  can_edit: Account.canEdit(self.site.properties.project)
              };
          });
      }

    }, function(errorResponse) {

    });

    self.createPractice = function() {
        self.practice = new Practice({
            'practice_type': 'Grass Buffer',
            'site_id': self.site.id,
            'account_id': self.site.properties.project.properties.account_id
        });

        self.practice.$save(function(successResponse) {
            $location.path('/projects/' + self.site.properties.project.id + '/sites/' + self.site.id + '/practices/' + successResponse.id + '/edit');
          }, function(errorResponse) {
            console.error('Unable to create your site, please try again later');
          });
    };

    //
    // Setup basic page variables
    //
    $rootScope.page.actions = [
      {
        type: 'button-link new',
        action: function() {
          self.createPractice();
        },
        text: 'Create practice'
      }
    ];

    //
    // $scope.map = {
    //   defaults: {
    //     scrollWheelZoom: false,
    //     zoomControl: false,
    //     maxZoom: 19
    //   },
    //   layers: {
    //     baselayers: {
    //       basemap: {
    //         name: 'Satellite Imagery',
    //         url: 'https://{s}.tiles.mapbox.com/v3/' + mapbox.satellite + '/{z}/{x}/{y}.png',
    //         type: 'xyz',
    //         layerOptions: {
    //           attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>'
    //         }
    //       }
    //     }
    //   },
    //   center: {},
    //   markers: {
    //     LandRiverSegment: {
    //       lat: ($scope.site.geometry !== null && $scope.site.geometry !== undefined) ? $scope.site.geometry.geometries[0].coordinates[1] : 38.362,
    //       lng: ($scope.site.geometry !== null && $scope.site.geometry !== undefined) ? $scope.site.geometry.geometries[0].coordinates[0] : -81.119,
    //       icon: {
    //         iconUrl: '//api.tiles.mapbox.com/v4/marker/pin-l+b1c11d.png?access_token=' + mapbox.access_token,
    //         iconRetinaUrl: '//api.tiles.mapbox.com/v4/marker/pin-l+b1c11d@2x.png?access_token=' + mapbox.access_token,
    //         iconSize: [38, 90],
    //         iconAnchor: [18, 44],
    //         popupAnchor: [0, 0]
    //       }
    //     }
    //   },
    //   geojsonToLayer: function (geojson, layer, options) {
    //
    //     //
    //     // Make sure the GeoJSON object is added to the layer with appropriate styles
    //     //
    //     layer.clearLayers();
    //
    //     if (options === undefined || options === null) {
    //       options = {
    //         stroke: true,
    //         fill: false,
    //         weight: 1,
    //         opacity: 1,
    //         color: 'rgb(255,255,255)',
    //         lineCap: 'square'
    //       };
    //     }
    //
    //     L.geoJson(geojson, {
    //       style: options
    //     }).eachLayer(function(l) {
    //       l.addTo(layer);
    //     });
    //
    //   },
    //   drawPolygon: function(geojson, fitBounds, options) {
    //
    //     leafletData.getMap().then(function(map) {
    //       var featureGroup = new L.FeatureGroup();
    //
    //
    //       //
    //       // Convert the GeoJSON to a layer and add it to our FeatureGroup
    //       //
    //       $scope.map.geojsonToLayer(geojson, featureGroup, options);
    //
    //       //
    //       // Add the FeatureGroup to the map
    //       //
    //       map.addLayer(featureGroup);
    //
    //       //
    //       // If we can getBounds then we can zoom to a specific level, we need to check to see
    //       // if the FeatureGroup has any bounds first though, otherwise we'll get an error.
    //       //
    //       if (fitBounds === true) {
    //         var bounds = featureGroup.getBounds();
    //
    //         if (bounds.hasOwnProperty('_northEast')) {
    //           map.fitBounds(featureGroup.getBounds());
    //         }
    //       }
    //     });
    //
    //   },
    //   setupMap: function() {
    //     //
    //     // If the page is being loaded, and a parcel exists within the user's plan, that means they've already
    //     // selected their property, so we just need to display it on the map for them again.
    //     //
    //     if ($scope.site.type_f9d8609090494dac811e6a58eb8ef4be.length > 0) {
    //
    //       //
    //       // Draw the Land River Segment
    //       //
    //       $scope.map.drawPolygon({
    //         type: 'Feature',
    //         geometry: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].geometry
    //       }, false, {
    //         stroke: false,
    //         fill: true,
    //         fillOpacity: 0.65,
    //         color: 'rgb(25,166,215)'
    //       });
    //
    //       //
    //       // Load Land river segment details
    //       //
    //       Feature.GetFeature({
    //         storage: variables.land_river_segment.storage,
    //         featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    //       }).then(function(response) {
    //         $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = response;
    //       });
    //
    //       //
    //       // Draw the county
    //       //
    //       if ($scope.site.type_b1baa10ba3ce493d90581a864ec95dc8.length) {
    //         $scope.map.drawPolygon({
    //           type: 'Feature',
    //           geometry: $scope.site.type_b1baa10ba3ce493d90581a864ec95dc8[0].geometry
    //         }, true);
    //       }
    //
    //     }
    //   }
    // };
    //
    // //
    // // Once the page has loaded we need to load in all Reading Features that are associated with
    // // the Practices related to the Site being viewed
    // //
    // $scope.map.setupMap();

  });

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name FieldStack.controller:SiteEditCtrl
   * @description
   * # SiteEditCtrl
   * Controller of the FieldStack
   */
  angular.module('FieldStack')
    .controller('SiteEditCtrl', function (Account, environment, $http, leafletData, $location, mapbox, Site, site, $rootScope, $route, $scope, Segment, $timeout, user) {

      var self = this,
          timeout;

      $rootScope.page = {};

      site.$promise.then(function(successResponse) {

        self.site = successResponse;

        self.site.geolocation = null;

        $rootScope.page.title = self.site.properties.name;
        $rootScope.page.links = [
            {
                text: 'Projects',
                url: '/projects'
            },
            {
                text: self.site.properties.project.properties.name,
                url: '/projects/' + $route.current.params.projectId
            },
            {
              text: self.site.properties.name,
              url: '/projects/' + $route.current.params.projectId + '/sites/' + self.site.id
            },
            {
              text: 'Edit',
              type: 'active'
            }
        ];

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
                    can_edit: Account.canEdit(self.site.properties.project)
                };
            });
        }

        self.map = {
          defaults: {
            scrollWheelZoom: false,
            zoomControl: false,
            maxZoom: 19
          },
          layers: {
            baselayers: {
              basemap: {
                name: 'Satellite Imagery',
                url: 'https://{s}.tiles.mapbox.com/v3/' + mapbox.satellite + '/{z}/{x}/{y}.png',
                type: 'xyz',
                layerOptions: {
                  attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>'
                }
              }
            }
          },
          center: {
            lat: (self.site.geometry !== null && self.site.geometry !== undefined) ? self.site.geometry.geometries[0].coordinates[1] : 38.362,
            lng: (self.site.geometry !== null && self.site.geometry !== undefined) ? self.site.geometry.geometries[0].coordinates[0] : -81.119,
            zoom: (self.site.geometry !== null && self.site.geometry !== undefined) ? 16 : 6
          },
          markers: {
            LandRiverSegment: {
              lat: (self.site.geometry !== null && self.site.geometry !== undefined) ? self.site.geometry.geometries[0].coordinates[1] : 38.362,
              lng: (self.site.geometry !== null && self.site.geometry !== undefined) ? self.site.geometry.geometries[0].coordinates[0] : -81.119,
              focus: false,
              draggable: true,
              icon: {
                iconUrl: '//api.tiles.mapbox.com/v4/marker/pin-l+b1c11d.png?access_token=' + mapbox.access_token,
                iconRetinaUrl: '//api.tiles.mapbox.com/v4/marker/pin-l+b1c11d@2x.png?access_token=' + mapbox.access_token,
                iconSize: [38, 90],
                iconAnchor: [18, 44],
                popupAnchor: [0, 0]
              }
            }
          }
        };

      }, function(errorResponse) {

      });

      self.saveSite = function() {
        self.site.$update().then(function(successResponse) {
          $location.path('/projects/' + $route.current.params.projectId + '/sites/' + $route.current.params.siteId);
        }, function(errorResponse) {

        });
      };

      self.deleteSite = function() {
        self.site.$delete().then(function(successResponse) {
          $location.path('/projects/' + $route.current.params.projectId);
        }, function(errorResponse) {

        });
      };

      /**
       * Mapping functionality
       *
       *
       *
       *
       *
       *
       */

      //
      // Define a layer to add geometries to later
      //
      var featureGroup = new L.FeatureGroup();

      //
      // Convert a GeoJSON Feature Collection to a valid Leaflet Layer
      //
      self.geojsonToLayer = function (geojson, layer) {
        layer.clearLayers();
        function add(l) {
          l.addTo(layer);
        }

        //
        // Make sure the GeoJSON object is added to the layer with appropriate styles
        //
        L.geoJson(geojson, {
          style: {
            stroke: true,
            fill: false,
            weight: 2,
            opacity: 1,
            color: 'rgb(255,255,255)',
            lineCap: 'square'
          }
        }).eachLayer(add);
      };

      self.geolocation = {
        drawSegment: function(geojson) {

          leafletData.getMap().then(function(map) {
            //
            // Reset the FeatureGroup because we don't want multiple parcels drawn on the map
            //
            map.removeLayer(featureGroup);

            //
            // Convert the GeoJSON to a layer and add it to our FeatureGroup
            //
            self.geojsonToLayer(geojson, featureGroup);

            //
            // Add the FeatureGroup to the map
            //
            map.addLayer(featureGroup);
          });

        },
        getSegment: function(coordinates) {

          leafletData.getMap().then(function(map) {

            Segment.query({
                 q: {
                   filters: [
                     {
                       name: 'geometry',
                       op: 'intersects',
                       val: 'SRID=4326;POINT(' + coordinates.lng + ' ' + coordinates.lat + ')'
                     }
                   ]
                 }
               }).$promise.then(function(response) {

                 self.geolocation.drawSegment(successResponse);

                 if (response.features.length) {
                   self.site.properties.segment_id = response.features[0].id;
                 }

               }, function(errorResponse) {
                 console.error('Error', errorResponse);
               });

          });

        },
        search: function() {
          $timeout.cancel(timeout);

          timeout = $timeout(function () {
            self.geolocation.initGeocoder();
          }, 800);
        },
        initGeocoder: function() {
          var requested_location = self.site.geolocation;

          if (requested_location.length >= 3) {
            var geocode_service_url = '//api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/' + requested_location + '.json';
            $http({
              method: 'get',
              url: geocode_service_url,
              params: {
                'callback': 'JSON_CALLBACK',
                'access_token': mapbox.access_token
              },
              headers: {
                'Authorization': 'external'
              }
            }).success(function(data) {
              self.geocode_features = data.features;
            }).error(function(data, status, headers, config) {
              console.log('ERROR: ', data);
            });
          }
        },
        select: function(geocode) {

          //
          // Move the draggable marker to the newly selected address
          //
          self.map.markers.LandRiverSegment = {
            lat: geocode.center[1],
            lng: geocode.center[0],
            focus: false,
            draggable: true,
            icon: {
              iconUrl: '//api.tiles.mapbox.com/v4/marker/pin-l+b1c11d.png?access_token=' + mapbox.access_token,
              iconRetinaUrl: '//api.tiles.mapbox.com/v4/marker/pin-l+b1c11d@2x.png?access_token=' + mapbox.access_token,
              iconSize: [38, 90],
              iconAnchor: [18, 44],
              popupAnchor: [0, 0]
            }
          };

          //
          // Center the map view on the newly selected address
          //
          self.map.center = {
            lat: geocode.center[1],
            lng: geocode.center[0],
            zoom: 16
          };

          //
          // Get the parcel for the property if one exists
          //
          self.geolocation.getSegment(self.map.center);

          //
          // Since an address has been select, we should clear the drop down so the user
          // can focus on the map.
          //
          self.geocode_features = [];

          //
          // We should also make sure we save this information to the
          // User's Site object, that way if we come back later it is
          // retained within the system
          //
          self.site.geometry = {
            type: 'GeometryCollection',
            geometries: []
          };
          self.site.geometry.geometries.push(geocode.geometry);


          $timeout(function () {
            leafletData.getMap().then(function(map) {
              map.invalidateSize();
            });
          }, 200);

        }
      };

      self.processPin = function(coordinates, zoom) {

        //
        // Update the LandRiver Segment
        //
        self.geolocation.getSegment(coordinates);

        //
        // Update the geometry for this Site
        //
        self.site.geometry = {
          type: 'GeometryCollection',
          geometries: []
        };
        self.site.geometry.geometries.push({
          type: 'Point',
          coordinates: [
            coordinates.lng,
            coordinates.lat
          ]
        });

        //
        // Update the visible pin on the map
        //
        self.map.markers.LandRiverSegment.lat = coordinates.lat;
        self.map.markers.LandRiverSegment.lng = coordinates.lng;

        //
        // Update the map center and zoom level
        //
        self.map.center = {
          lat: coordinates.lat,
          lng: coordinates.lng,
          zoom: (zoom < 10) ? 10 : zoom
        };
      };

      //
      // Define our map interactions via the Angular Leaflet Directive
      //
      leafletData.getMap().then(function(map) {

        //
        // Move Zoom Control position to bottom/right
        //
        new L.Control.Zoom({
          position: 'bottomright'
        }).addTo(map);

        //
        // Update the pin and segment information when the user clicks on the map
        // or drags the pin to a new location
        //
        $scope.$on('leafletDirectiveMap.click', function(event, args) {
          self.processPin(args.leafletEvent.latlng, map._zoom);
        });

        $scope.$on('leafletDirectiveMap.dblclick', function(event, args) {
          self.processPin(args.leafletEvent.latlng, map._zoom+1);
        });

        $scope.$on('leafletDirectiveMarker.dragend', function(event, args) {
          self.processPin(args.leafletEvent.target._latlng, map._zoom);
        });

        $scope.$on('leafletDirectiveMarker.dblclick', function(event, args) {
          var zoom = map._zoom+1;
          map.setZoom(zoom);
        });

      });

      //
      // If the page is being loaded, and a parcel exists within the user's plan, that means they've already
      // selected their property, so we just need to display it on the map for them again.
      //
      if (self.site && self.site.properties && self.site.properties.segment) {
        var geojson = {
          type: 'Feature',
          geometry: self.site.properties.segment.geometry
        };
        self.geolocation.drawSegment(geojson);
      }

    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc
   * @name
   * @description
   */
  angular.module('FieldStack')
    .config(function($routeProvider, commonscloud) {

      $routeProvider
        .when('/projects/:projectId/sites/:siteId/practices', {
          redirectTo: '/projects/:projectId/sites/:siteId'
        })
        .when('/projects/:projectId/sites/:siteId/practices/:practiceId', {
          templateUrl: '/modules/components/practices/views/practices--view.html',
          controller: 'PracticeViewController',
          controllerAs: 'page',
          resolve: {
            practice: function(Practice, $route) {
              return Practice.get({
                id: $route.current.params.practiceId
              });
            }
          }
        })
        .when('/projects/:projectId/sites/:siteId/practices/:practiceId/edit', {
          templateUrl: '/modules/components/practices/views/practices--edit.html',
          controller: 'PracticeEditController',
          controllerAs: 'page',
          resolve: {
            user: function(Account) {
              if (Account.userObject && !Account.userObject.id) {
                  return Account.getUser();
              }
              return Account.userObject;
            },
            site: function(Site, $route) {
              return Site.get({
                id: $route.current.params.siteId
              });
            },
            practice: function(Practice, $route) {
              return Practice.get({
                id: $route.current.params.practiceId
              });
            }
          }
        });

    });

}());

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .constant('Storage', {
    'forest-buffer': {
      landuse: 'for',
      storage: 'type_ed657deb908b483a9e96d3a05e420c50',
      templateId: 141,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/forest-buffer/views/report--view.html',
        form: '/modules/components/practices/modules/forest-buffer/views/form--view.html'
      }
    },
    'grass-buffer': {
      landuse: 'hyo',
      storage: 'type_a1ee0564f2f94eda9c0ca3d6c277cf14',
      templateId: 373,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/grass-buffer/views/report--view.html',
        form: '/modules/components/practices/modules/grass-buffer/views/form--view.html'
      }
    },
    'livestock-exclusion': {
      landuse: 'hyo',
      storage: 'type_035455995db040158f5a4a107b5d8a6c',
      templateId: 375,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/livestock-exclusion/views/report--view.html',
        form: '/modules/components/practices/modules/livestock-exclusion/views/form--view.html'
      }
    },
    'urban-homeowner': {
      landuse: null,
      storage: 'type_6da15b74f6564feb90c3d581d97700fd',
      templateId: 377,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/urban-homeowner/views/report--view.html',
        form: '/modules/components/practices/modules/urban-homeowner/views/form--view.html'
      }
    },
    'bioretention': {
      landuse: null,
      storage: 'type_64d08a6ba8874ed5a76ae3f4abeb68ca',
      templateId: 380,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/bioretention/views/report--view.html',
        form: '/modules/components/practices/modules/bioretention/views/form--view.html'
      }
    },
    'instream-habitat': {
      landuse: null,
      storage: 'type_6800a0c907494118b9a8872a70ee26da',
      templateId: 381,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/instream-habitat/views/report--view.html',
        form: '/modules/components/practices/modules/instream-habitat/views/form--view.html'
      }
    },
    'bank-stabilization': {
      landuse: null,
      storage: 'type_907ba68d848c4131a0cf58a3682ff50e',
      templateId: 382,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/bank-stabilization/views/report--view.html',
        form: '/modules/components/practices/modules/bank-stabilization/views/form--view.html'
      }
    },
    'enhanced-stream-restoration': {
      landuse: null,
      storage: 'type_ff74e5abd79f4b2fbf04bf28168eaf97',
      templateId: 383,
      fields: {
        Planning: [],
        Installation: [],
        Monitoring: []
      },
      templates: {
        report: '/modules/components/practices/modules/enhanced-stream-restoration/views/report--view.html',
        form: '/modules/components/practices/modules/enhanced-stream-restoration/views/form--view.html'
      }
    }
  });

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('Calculate', function(Load) {
      return {
        getLoadVariables: function(segment, landuse) {
          var promise = Load.query({
            q: {
              filters: [
                {
                  name: 'landriversegment',
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
          }, function(response) {
            return response;
          });

          return promise;
        },
        getLoadTotals: function(area, efficiency) {
          return {
            nitrogen: (area*(efficiency.eos_totn/efficiency.eos_acres)),
            phosphorus: (area*(efficiency.eos_totp/efficiency.eos_acres)),
            sediment: ((area*(efficiency.eos_tss/efficiency.eos_acres))/2000)
          };
        },
        getTotalReadingsByCategory: function(period, readings) {
          var total = 0;

          for (var i = 0; i < readings.length; i++) {
            if (readings[i].properties.measurement_period === period) {
              total++;
            }
          }

          return total;
        }
      };
    });

}());

'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('PracticeEditController', function (Account, $location, Practice, practice, $rootScope, $route, site, user) {

    var self = this,
        projectId = $route.current.params.projectId,
        siteId = $route.current.params.siteId;

    $rootScope.page = {};

    practice.$promise.then(function(successResponse) {

      self.practice = successResponse;

      site.$promise.then(function(successResponse) {
        self.site = successResponse;

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
              url: '/projects/' + projectId + '/sites/' + siteId + '/practices/' + self.practice.id
            },
            {
              text: 'Edit',
              url: '/projects/' + projectId + '/sites/' + siteId + '/practices/' + self.practice.id + '/edit',
              type: 'active'
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

    self.savePractice = function() {
      self.practice.$update().then(function(successResponse) {
        $location.path('/projects/' + projectId + '/sites/' + siteId + '/practices/' + self.practice.id);
      }, function(errorResponse) {
        // Error message
      });
    };

    self.deletePractice = function() {
      self.practice.$delete().then(function(successResponse) {
        $location.path('/projects/' + projectId + '/sites/' + siteId);
      }, function(errorResponse) {
        // Error message
      });
    };

  });

'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('PracticeViewController', function ($location, practice, $route, Utility) {

    var self = this,
        projectId = $route.current.params.projectId,
        siteId = $route.current.params.siteId,
        practiceId = $route.current.params.practiceId,
        practiceType;

    practice.$promise.then(function(successResponse) {

      self.practice = successResponse;

      practiceType = Utility.machineName(self.practice.properties.practice_type);

      $location.path('/projects/' + projectId + '/sites/' + siteId + '/practices/' + practiceId + '/' + practiceType);

    });

  });

'use strict';

/**
 * @ngdoc service
 * @name.
 * @description
 */
angular.module('FieldStack')
  .constant('AnimalType', {
      beef: {
        average_weight: 877.19,
        manure: 58,
        total_nitrogen: 0.0059,
        total_phosphorus: 0.0016,
      },
      dairy: {
        average_weight: 1351.35,
        manure: 86,
        total_nitrogen: 0.0052,
        total_phosphorus: 0.001,
      },
      'other cattle': {
        average_weight: 480.77,
        manure: 64.39,
        total_nitrogen: 0.0037,
        total_phosphorus: 0.001,
      },
      broilers: {
        average_weight: 2.2,
        manure: 85,
        total_nitrogen: 0.0129,
        total_phosphorus: 0.0035
      },
      layers: {
        average_weight: 4,
        manure: 64,
        total_nitrogen: 0.0131,
        total_phosphorus: 0.0047
      },
      pullets: {
        average_weight: 2.84,
        manure: 45.56,
        total_nitrogen: 0.0136,
        total_phosphorus: 0.0053
      },
      turkeys: {
        average_weight: 14.93,
        manure: 47,
        total_nitrogen: 0.0132,
        total_phosphorus: 0.0049
      },
      'hogs and pigs for breeding': {
        average_weight: 374.53,
        manure: 33.46,
        total_nitrogen: 0.0066,
        total_phosphorus: 0.0021
      },
      'hogs for slaughter': {
        average_weight: 110.01,
        manure: 84,
        total_nitrogen: 0.0062,
        total_phosphorus: 0.0021
      },
      horses: {
        average_weight: 1000,
        manure: 51,
        total_nitrogen: 0.0059,
        total_phosphorus: 0.0014
      },
      'angora goats': {
        average_weight: 65.02,
        manure: 41,
        total_nitrogen: 0.011,
        total_phosphorus: 0.0027
      },
      'milk goats': {
        average_weight: 65.02,
        manure: 41,
        total_nitrogen: 0.011,
        total_phosphorus: 0.0027
      },
      'sheep and lambs': {
        average_weight: 100,
        manure: 40,
        total_nitrogen: 0.0105,
        total_phosphorus: 0.0022
      },
      biosolids: {
        average_weight: null,
        manure: null,
        total_nitrogen: 0.039,
        total_phosphorus: 0.025
      }
  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .constant('Landuse', {
    'high-till with manure': 'hwm',
    'high-till with manure nutrient management': 'nhi',
    'high-till without manure': 'hom',
    'high-till without manure nutrient management': 'nho',
    'low-till with manure': 'lwm',
    'low-till with manure nutrient management': 'nlo',
    'hay with nutrients': 'hyw',
    'hay with nutrients nutrient management': 'nhy',
    'alfalfa': 'alf',
    'alfalfa nutrient management': 'nal',
    'hay without nutrients': 'hyo',
    'pasture': 'pas',
    'pasture nutrient management': 'npa',
    'trampled riparian pasture': 'trp',
    'animal feeding operations': 'afo',
    'nursery': 'urs',
    'concentrated animal feeding operations': 'cfo',
    'regulated construction': 'rcn',
    'css construction': 'ccn',
    'regulated extractive': 'rex',
    'css extractive': 'cex',
    'nonregulated extractive': 'nex',
    'forest': 'for',
    'harvested forest': 'hvf',
    'regulated impervious developed': 'rid',
    'nonregulated impervious developed': 'nid',
    'css impervious developed': 'cid',
    'atmospheric deposition to non-tidal water': 'atdep',
    'regulated pervious developed': 'rpd',
    'nonregulated pervious developed': 'npd',
    'css pervious developed': 'cpd',
    'municipal-waste water treatment plants':'wwtp',
    'septic': 'septic',
    'combined sewer overflows': 'cso',
    'industrial-waste water treatment plants': 'indus'
  });

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(['$routeProvider', 'commonscloud', function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/forest-buffer', {
        templateUrl: '/modules/shared/default.html',
        controller: 'ForestBufferReportController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          readings: function(Storage, Feature, $route) {
            return Feature.GetRelatedFeatures({
              storage: commonscloud.collections.practice.storage,
              relationship: Storage['forest-buffer'].storage,
              featureId: $route.current.params.practiceId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/forest-buffer/:reportId/edit', {
        templateUrl: '/modules/shared/default.html',
        controller: 'ForestBufferFormController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          }
        }
      });

  }]);

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.Storage
 * @description
 *    Provides site/application specific variables to the entire application
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .service('ForestBufferCalculate', [function() {
    return {

    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:ForestBufferController
 * @description
 * # ForestBufferController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('ForestBufferReportController', function (Efficiency, $rootScope, $scope, $route, $location, $timeout, $http, $q, moment, user, Template, Feature, template, fields, project, site, practice, readings, commonscloud, Storage, Landuse) {

    //
    // Assign project to a scoped variable
    //
    $scope.project = project;
    $scope.site = site;

    $scope.template = template;
    $scope.fields = fields;

    $scope.practice = practice;
    $scope.practice.practice_type = 'forest-buffer';
    $scope.practice.readings = readings;
    $scope.practice_efficiency = null;

    $scope.storage = Storage[$scope.practice.practice_type];

    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    $scope.landuse = Landuse;

    $scope.GetTotal = function(period) {

      var total = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          total++;
        }
      }

      return total;
    };

    $scope.total = {
      planning: $scope.GetTotal('Planning'),
      installation: $scope.GetTotal('Installation'),
      monitoring: $scope.GetTotal('Monitoring')
    };

    //
    // Load Land river segment details
    //
    Feature.GetFeature({
      storage: commonscloud.collections.land_river_segment.storage,
      featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    }).then(function(response) {
      $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = response;
    });

    $scope.readings = {
      bufferWidth: function() {
        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === 'Planning') {
            return $scope.practice.readings[i].average_width_of_buffer;
          }
        }
      },
      landuse: function(landuseType) {
        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === 'Planning') {
            return $scope.practice.readings[i][landuseType];
          }
        }
      },
      add: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            average_width_of_buffer: $scope.readings.bufferWidth(),
            existing_riparian_landuse: $scope.readings.landuse('existing_riparian_landuse'),
            upland_landuse: $scope.readings.landuse('upland_landuse'),
            report_date: moment().format('YYYY-MM-DD'),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      },
      addGrassBuffer: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            report_date: moment().format('YYYY-MM-DD'),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/reports/' + reportId + '/edit');
          });
        });
      }
    };

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--view.html',
      title: $scope.site.site_number + ' « ' + $scope.project.project_title,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
          type: 'active'
        }
      ],
      actions: [
        {
          type: 'button-link new',
          action: function() {
            $scope.readings.add($scope.practice);
          },
          text: 'Add Measurement Data'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.GetAllReadings = function(existingReadings, readingId) {

      var updatedReadings = [{
        id: readingId // Start by adding the newest relationships, then we'll add the existing sites
      }];

      angular.forEach(existingReadings, function(reading, $index) {
        updatedReadings.push({
          id: reading.id
        });
      });

      return updatedReadings;
    };

    $scope.calculate = {};

    $scope.calculate.GetLoadVariables = function(period, landuse) {

      var planned = {
        width: 0,
        length: 0,
        area: 0,
        landuse: '',
        segment: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].name,
        efficieny: null
      };

      var deferred = $q.defer();

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          planned.length = $scope.practice.readings[i].length_of_buffer;
          planned.width = $scope.practice.readings[i].average_width_of_buffer;
          planned.area = ((planned.length*planned.width)/43560);
          planned.landuse = (landuse) ? landuse : $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];

          var promise = $http.get('//api.commonscloud.org/v2/type_3fbea3190b634d0c9021d8e67df84187.json', {
            params: {
              q: {
                filters: [
                  {
                    name: 'landriversegment',
                    op: 'eq',
                    val: planned.segment
                  },
                  {
                    name: 'landuse',
                    op: 'eq',
                    val: planned.landuse
                  }
                ]
              }
            },
            headers: {
              'Authorization': 'external'
            }
          }).success(function(data, status, headers, config) {
            planned.efficieny = data.response.features[0];
            deferred.resolve(planned);
          });
        }
      }

      return deferred.promise;
    };

    $scope.calculate.GetPreInstallationLoad = function(period) {

      //
      // Existing Landuse
      //
      $scope.calculate.GetLoadVariables(period).then(function(loaddata) {

        var uplandPreInstallationLoad = {
          nitrogen: ((loaddata.area * 4)*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: ((loaddata.area * 2)*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: (((loaddata.area * 2)*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('PRE uplandPreInstallationLoad', uplandPreInstallationLoad);

        var existingPreInstallationLoad = {
          nitrogen: (loaddata.area*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: (loaddata.area*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: ((loaddata.area*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('PRE existingPreInstallationLoad', existingPreInstallationLoad);

        $scope.calculate.results.totalPreInstallationLoad = {
          efficieny: loaddata.efficieny,
          uplandLanduse: uplandPreInstallationLoad,
          existingLanduse: existingPreInstallationLoad,
          nitrogen: uplandPreInstallationLoad.nitrogen + existingPreInstallationLoad.nitrogen,
          phosphorus: uplandPreInstallationLoad.phosphorus + existingPreInstallationLoad.phosphorus,
          sediment: uplandPreInstallationLoad.sediment + existingPreInstallationLoad.sediment
        };

      });


    };

    $scope.calculate.GetPlannedLoad = function(period) {

      var existingLanduseType;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
          existingLanduseType = $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];
        }
      }

      $scope.calculate.GetLoadVariables(period, existingLanduseType).then(function(existingLoaddata) {
        $scope.calculate.GetLoadVariables(period, $scope.storage.landuse).then(function(newLoaddata) {

          Efficiency.query({
            q: {
              filters: [
                {
                  name: 'cbwm_lu',
                  op: 'eq',
                  val: existingLanduseType
                },
                {
                  name: 'hydrogeomorphic_region',
                  op: 'eq',
                  val: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].hgmr_nme
                },
                {
                  name: 'best_management_practice_short_name',
                  op: 'eq',
                  val: (existingLanduseType === 'pas' || existingLanduseType === 'npa') ? 'ForestBuffersTrp': 'ForestBuffers'
                }
              ]
            }
          }).$promise.then(function(efficiencyResponse) {
            var efficiency = efficiencyResponse.response.features[0];
            $scope.practice_efficiency = efficiency;

            //
            // EXISTING CONDITION — LOAD VALUES
            //
            var uplandPlannedInstallationLoad = {
              sediment: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.sediment*(efficiency.s_efficiency/100),
              nitrogen: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.nitrogen*(efficiency.n_efficiency/100),
              phosphorus: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.phosphorus*(efficiency.p_efficiency/100)
            };

            console.log('PLANNED uplandPlannedInstallationLoad', uplandPlannedInstallationLoad);

            var existingPlannedInstallationLoad = {
              sediment: ((existingLoaddata.area*((existingLoaddata.efficieny.eos_tss/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_tss/newLoaddata.efficieny.eos_acres)))/2000),
              nitrogen: (existingLoaddata.area*((existingLoaddata.efficieny.eos_totn/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_totn/newLoaddata.efficieny.eos_acres))),
              phosphorus: (existingLoaddata.area*((existingLoaddata.efficieny.eos_totp/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_totp/newLoaddata.efficieny.eos_acres)))
            };

            console.log('PLANNED existingPlannedInstallationLoad', existingPlannedInstallationLoad);

            //
            // PLANNED CONDITIONS — LANDUSE VALUES
            //
            var totals = {
              efficiency: {
                new: newLoaddata,
                existing: existingLoaddata
              },
              nitrogen: uplandPlannedInstallationLoad.nitrogen + existingPlannedInstallationLoad.nitrogen,
              phosphorus: uplandPlannedInstallationLoad.phosphorus + existingPlannedInstallationLoad.phosphorus,
              sediment: uplandPlannedInstallationLoad.sediment + existingPlannedInstallationLoad.sediment
            };

            $scope.calculate.results.totalPlannedLoad = totals;

          });
        });
      });

    };


    $scope.calculate.quantityInstalled = function(values, element, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach(values, function(reading, $index) {
        if (reading.measurement_period === 'Planning') {
          planned_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total) {
        console.log('something to show');
        if (format === '%') {
          percentage = (installed_total/planned_total);
          console.log('percentage', (percentage*100));
          return (percentage*100);
        } else {
          console.log('installed_total', installed_total);
          return installed_total;
        }
      }

      return 0;

    };

    //
    // The purpose of this function is to return a percentage of the total installed versus the amount
    // that was originally planned on being installed:
    //
    // (Installation+Installation+Installation) / Planned = % of Planned
    //
    //
    // @param (string) field
    //    The `field` parameter should be the field that you would like to get the percentage for
    //
    $scope.calculate.GetPercentageOfInstalled = function(field, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach($scope.practice.readings, function(reading, $index) {

        if (reading.measurement_period === 'Planning') {
          planned_total += reading[field];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += reading[field];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total >= 1) {
        if (format === 'percentage') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }
      }

      return null;
    };

    $scope.calculate.GetSingleInstalledLoad = function(value) {

      var reduction = 0,
          bufferArea = ((value.length_of_buffer * value.average_width_of_buffer)/43560),
          landuse = (value.existing_riparian_landuse) ? $scope.landuse[value.existing_riparian_landuse.toLowerCase()] : null,
          preExistingEfficieny = $scope.calculate.results.totalPreInstallationLoad.efficieny,
          landuseEfficiency = ($scope.calculate.results.totalPlannedLoad && $scope.calculate.results.totalPlannedLoad.efficiency) ? $scope.calculate.results.totalPlannedLoad.efficiency : null,
          uplandPreInstallationLoad = null,
          existingPreInstallationLoad = null;

      if ($scope.practice_efficiency) {
        uplandPreInstallationLoad = {
          sediment: (((bufferArea*2*(landuseEfficiency.existing.efficieny.eos_tss/landuseEfficiency.existing.efficieny.eos_acres))/2000)*$scope.practice_efficiency.s_efficiency/100),
          nitrogen: ((bufferArea*4*(landuseEfficiency.existing.efficieny.eos_totn/landuseEfficiency.existing.efficieny.eos_acres))*$scope.practice_efficiency.n_efficiency/100),
          phosphorus: ((bufferArea*2*(landuseEfficiency.existing.efficieny.eos_totp/landuseEfficiency.existing.efficieny.eos_acres))*$scope.practice_efficiency.p_efficiency/100)
        };
      }

      if (landuseEfficiency) {
        existingPreInstallationLoad = {
          sediment: ((bufferArea*((landuseEfficiency.existing.efficieny.eos_tss/landuseEfficiency.existing.efficieny.eos_acres)-(landuseEfficiency.new.efficieny.eos_tss/landuseEfficiency.new.efficieny.eos_acres)))/2000),
          nitrogen: (bufferArea*((landuseEfficiency.existing.efficieny.eos_totn/landuseEfficiency.existing.efficieny.eos_acres)-(landuseEfficiency.new.efficieny.eos_totn/landuseEfficiency.new.efficieny.eos_acres))),
          phosphorus: (bufferArea*((landuseEfficiency.existing.efficieny.eos_totp/landuseEfficiency.existing.efficieny.eos_acres)-(landuseEfficiency.new.efficieny.eos_totp/landuseEfficiency.new.efficieny.eos_acres)))
        };
      }

      if (uplandPreInstallationLoad && existingPreInstallationLoad) {
        return {
          nitrogen: uplandPreInstallationLoad.nitrogen + existingPreInstallationLoad.nitrogen,
          phosphorus: uplandPreInstallationLoad.phosphorus + existingPreInstallationLoad.phosphorus,
          sediment: uplandPreInstallationLoad.sediment + existingPreInstallationLoad.sediment
        };
      } else {
        return {
          nitrogen: null,
          phosphorus: null,
          sediment: null
        };
      }
    };

    $scope.calculate.GetTreeDensity = function(trees, length, width) {
      return (trees/(length*width/43560));
    };

    $scope.calculate.GetPercentage = function(part, total) {
      return ((part/total)*100);
    };

    $scope.calculate.GetConversion = function(part, total) {
      return (part/total);
    };

    $scope.calculate.GetConversionWithArea = function(length, width, total) {
      return ((length*width)/total);
    };

    $scope.calculate.GetRestorationTotal = function(unit, area) {

      var total_area = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Installation') {
          if (area) {
            total_area += ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].average_width_of_buffer);
          } else {
            total_area += $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      // console.log('GetRestorationTotal', total_area, unit, (total_area/unit));


      return (total_area/unit);
    };

    $scope.calculate.GetRestorationPercentage = function(unit, area) {

      var planned_area = 0,
          total_area = $scope.calculate.GetRestorationTotal(unit, area);

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
          if (area) {
            planned_area = ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].average_width_of_buffer);
          } else {
            planned_area = $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      planned_area = (planned_area/unit);

      return ((total_area/planned_area)*100);
    };



    //
    // Scope elements that run the actual equations and send them back to the
    // user interface for display
    //
    // In order to run all of these we need to make sure that our HGMR
    // information from our selected Site has been added to the HGMR object
    //
    Feature.GetFeature({
      storage: 'type_f9d8609090494dac811e6a58eb8ef4be',
      featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    }).then(function(hgmrResponse) {

      //
      // Assign HGMR Code Lookup information to the existing site
      //
      $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = hgmrResponse;

      //
      //
      //
      $scope.calculate.results = {
        percentageLengthOfBuffer: {
          percentage: $scope.calculate.GetPercentageOfInstalled('length_of_buffer', 'percentage'),
          total: $scope.calculate.GetPercentageOfInstalled('length_of_buffer')
        },
        percentageTreesPlanted: {

          percentage: $scope.calculate.GetPercentageOfInstalled('number_of_trees_planted', 'percentage'),
          total: $scope.calculate.GetPercentageOfInstalled('number_of_trees_planted')
        },
        totalPreInstallationLoad: $scope.calculate.GetPreInstallationLoad('Planning'),
        totalPlannedLoad: $scope.calculate.GetPlannedLoad('Planning'),
        totalMilesRestored: $scope.calculate.GetRestorationTotal(5280),
        percentageMilesRestored: $scope.calculate.GetRestorationPercentage(5280, false),
        totalAcresRestored: $scope.calculate.GetRestorationTotal(43560, true),
        percentageAcresRestored: $scope.calculate.GetRestorationPercentage(43560, true)
      };
    });

    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: commonscloud.collections.project.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;

        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: commonscloud.collections.project.storage,
            featureId: $route.current.params.projectId,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
            if ($scope.user.feature.is_admin || $scope.user.feature.write) {
            } else {
              $location.path('/projects/' + $route.current.params.projectId);
            }
          });
        }

      });
    }


  });

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:ReportEditCtrl
 * @description
 * # ReportEditCtrl
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('ForestBufferFormController', ['$rootScope', '$scope', '$route', '$location', 'moment', 'user', 'Template', 'Field', 'Feature', 'Storage', 'template', 'project', 'site', 'practice', 'commonscloud', function ($rootScope, $scope, $route, $location, moment, user, Template, Field, Feature, Storage, template, project, site, practice, commonscloud) {

    //
    // Assign project to a scoped variable
    //
    $scope.template = template;

    $scope.report = {};

    $scope.project = project;
    $scope.practice = practice;
    $scope.practice.practice_type = 'forest-buffer';

    $scope.storage = Storage[$scope.practice.practice_type];

    Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
      $scope.fields = response;
    });

    Feature.GetFeature({
      storage: $scope.storage.storage,
      featureId: $route.current.params.reportId
    }).then(function(report) {

      //
      // Load the reading into the scope
      //
      $scope.report = report;
      $scope.report.template = $scope.storage.templates.form;

      //
      // Watch the Tree Canopy Value, when it changes we need to update the lawn area value
      //
      $scope.calculateBufferComposition = function() {

        var running_total = $scope.report.buffer_composition_woody + $scope.report.buffer_composition_shrub + $scope.report.buffer_composition_bare + $scope.report.buffer_composition_grass;

        var remainder = 100-running_total;

        $scope.report.buffer_composition_other = remainder;
      };
      $scope.$watch('report.buffer_composition_woody', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_shrub', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_bare', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_grass', function() {
        $scope.calculateBufferComposition();
      });


      $scope.report.save = function() {
        Feature.UpdateFeature({
          storage: $scope.storage.storage,
          featureId: $scope.report.id,
          data: $scope.report
        }).then(function(response) {
          $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
        }).then(function(error) {
          // Do something with the error
        });
      };

      $scope.report.delete = function() {

        //
        // Before we can remove the Practice we need to remove the relationship it has with the Site
        //
        //
        angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
          if (feature.id === $scope.report.id) {
            $scope.practice[$scope.storage.storage].splice($index, 1);
          }
        });

        Feature.UpdateFeature({
          storage: commonscloud.collections.practice.storage,
          featureId: $scope.practice.id,
          data: $scope.practice
        }).then(function(response) {
          
          //
          // Now that the Project <> Site relationship has been removed, we can remove the Site
          //
          Feature.DeleteFeature({
            storage: $scope.storage.storage,
            featureId: $scope.report.id
          }).then(function(response) {
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
          });

        });

      };

      //
      // Add the reading information to the breadcrumbs
      //
      var page_title = 'Editing the ' + $scope.report.measurement_period + ' Report from ' + moment($scope.report.report_date).format('MMM d, YYYY');

      $rootScope.page.links.push({
        text: page_title,
        url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + $scope.report.id + '/edit'
      });

      $rootScope.page.title = page_title;

    });

    $scope.site = site;
    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--form.html',
      title: null,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + Feature.MachineReadable($scope.practice.practice_type)
        }    
      ],
      actions: [
        {
          type: 'button-link',
          action: function($index) {
            $scope.report.delete();
          },
          visible: false,
          loading: false,
          text: 'Delete Report'
        },
        {
          type: 'button-link new',
          action: function($index) {
            $scope.report.save();
            $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
          },
          visible: false,
          loading: false,
          text: 'Save Changes'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.in = function(search_value, list) {

      if (!list.length) {
        return true;
      }
        
      var $index;

      for ($index = 0; $index < list.length; $index++) {
        if (list[$index] === search_value) {
          return true;
        }
      }

      return false;
    };

    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: $scope.storage.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;
        
        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: $scope.storage.storage,
            featureId: $scope.report.id,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
          });
        }

      });
    }

  }]);

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(['$routeProvider', 'commonscloud', function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/grass-buffer', {
        templateUrl: '/modules/shared/default.html',
        controller: 'GrassBufferReportController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          readings: function(Storage, Feature, $route) {
            return Feature.GetRelatedFeatures({
              storage: commonscloud.collections.practice.storage,
              relationship: Storage['grass-buffer'].storage,
              featureId: $route.current.params.practiceId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/grass-buffer/:reportId/edit', {
        templateUrl: '/modules/shared/default.html',
        controller: 'GrassBufferFormController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.practice.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.practice.templateId, 'object');
          }
        }
      });

  }]);



'use strict';

/**
 * @ngdoc service
 * @name FieldStack.Storage
 * @description
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .service('GrassBufferCalculate', [function() {
    return {

    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:GrassBufferReportController
 * @description
 * # GrassBufferReportController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('GrassBufferReportController', function (Efficiency, $rootScope, $scope, $route, $location, $timeout, $http, $q, moment, user, Template, Feature, template, fields, project, site, practice, readings, commonscloud, Storage, Landuse) {

    //
    // Assign project to a scoped variable
    //
    $scope.project = project;
    $scope.site = site;

    $scope.template = template;
    $scope.fields = fields;

    $scope.practice = practice;
    $scope.practice.practice_type = 'grass-buffer';
    $scope.practice.readings = readings;
    $scope.practice_efficiency = null;

    $scope.storage = Storage[$scope.practice.practice_type];

    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    $scope.landuse = Landuse;

    $scope.GetTotal = function(period) {

      var total = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          total++;
        }
      }

      return total;
    };

    $scope.total = {
      planning: $scope.GetTotal('Planning'),
      installation: $scope.GetTotal('Installation'),
      monitoring: $scope.GetTotal('Monitoring')
    };

    $scope.readings = {
      bufferWidth: function() {
        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === 'Planning') {
            return $scope.practice.readings[i].average_width_of_buffer;
          }
        }
      },
      landuse: function(landuseType) {
        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === 'Planning') {
            return $scope.practice.readings[i][landuseType];
          }
        }
      },
      add: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            average_width_of_buffer: $scope.readings.bufferWidth(),
            existing_riparian_landuse: $scope.readings.landuse('existing_riparian_landuse'),
            upland_landuse: $scope.readings.landuse('upland_landuse'),
            report_date: moment().format('YYYY-MM-DD'),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      },
      addReading: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            report_date: moment().format('YYYY-MM-DD'),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      }
    };

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--view.html',
      title: $scope.site.site_number + ' « ' + $scope.project.project_title,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
          type: 'active'
        }
      ],
      actions: [
        {
          type: 'button-link new',
          action: function() {
            $scope.readings.add($scope.practice);
          },
          text: 'Add Measurement Data'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.GetAllReadings = function(existingReadings, readingId) {

      var updatedReadings = [{
        id: readingId // Start by adding the newest relationships, then we'll add the existing sites
      }];

      angular.forEach(existingReadings, function(reading, $index) {
        updatedReadings.push({
          id: reading.id
        });
      });

      return updatedReadings;
    };

    $scope.calculate = {};

    $scope.calculate.GetLoadVariables = function(period, landuse) {

      var planned = {
        width: 0,
        length: 0,
        area: 0,
        landuse: '',
        segment: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].name,
        efficieny: null
      };

      var deferred = $q.defer();

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          planned.length = $scope.practice.readings[i].length_of_buffer;
          planned.width = $scope.practice.readings[i].average_width_of_buffer;
          planned.area = ((planned.length*planned.width)/43560);
          planned.landuse = (landuse) ? landuse : $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];

          var promise = $http.get('//api.commonscloud.org/v2/type_3fbea3190b634d0c9021d8e67df84187.json', {
            params: {
              q: {
                filters: [
                  {
                    name: 'landriversegment',
                    op: 'eq',
                    val: planned.segment
                  },
                  {
                    name: 'landuse',
                    op: 'eq',
                    val: planned.landuse
                  }
                ]
              }
            },
            headers: {
              'Authorization': 'external'
            }
          }).success(function(data, status, headers, config) {
            planned.efficieny = data.response.features[0];
            deferred.resolve(planned);
          });
        }
      }

      return deferred.promise;
    };

    $scope.calculate.GetPreInstallationLoad = function(period) {

      //
      // Existing Landuse
      //
      $scope.calculate.GetLoadVariables(period).then(function(loaddata) {

        var uplandPreInstallationLoad = {
          nitrogen: ((loaddata.area * 4)*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: ((loaddata.area * 2)*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: (((loaddata.area * 2)*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('PRE uplandPreInstallationLoad', uplandPreInstallationLoad);

        var existingPreInstallationLoad = {
          nitrogen: (loaddata.area*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: (loaddata.area*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: ((loaddata.area*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('PRE existingPreInstallationLoad', existingPreInstallationLoad);

        $scope.calculate.results.totalPreInstallationLoad = {
          efficieny: loaddata.efficieny,
          uplandLanduse: uplandPreInstallationLoad,
          existingLanduse: existingPreInstallationLoad,
          nitrogen: uplandPreInstallationLoad.nitrogen + existingPreInstallationLoad.nitrogen,
          phosphorus: uplandPreInstallationLoad.phosphorus + existingPreInstallationLoad.phosphorus,
          sediment: uplandPreInstallationLoad.sediment + existingPreInstallationLoad.sediment
        };

      });

    };

    $scope.calculate.GetPlannedLoad = function(period) {

      var existingLanduseType;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          existingLanduseType = $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];
        }
      }

      $scope.calculate.GetLoadVariables(period, existingLanduseType).then(function(existingLoaddata) {
        $scope.calculate.GetLoadVariables(period, $scope.storage.landuse).then(function(newLoaddata) {

          Efficiency.query({
            q: {
              filters: [
                {
                  name: 'cbwm_lu',
                  op: 'eq',
                  val: existingLanduseType
                },
                {
                  name: 'hydrogeomorphic_region',
                  op: 'eq',
                  val: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].hgmr_nme
                },
                {
                  name: 'best_management_practice_short_name',
                  op: 'eq',
                  val: (existingLanduseType === 'pas' || existingLanduseType === 'npa') ? 'GrassBuffersTrp': 'GrassBuffers'
                }
              ]
            }
          }).$promise.then(function(efficiencyResponse) {
            var efficiency = efficiencyResponse.response.features[0];
            $scope.practice_efficiency = efficiency;

            //
            // EXISTING CONDITION — LOAD VALUES
            //
            var uplandPlannedInstallationLoad = {
              sediment: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.sediment*(efficiency.s_efficiency/100),
              nitrogen: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.nitrogen*(efficiency.n_efficiency/100),
              phosphorus: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.phosphorus*(efficiency.p_efficiency/100)
            };

            console.log('PLANNED uplandPlannedInstallationLoad', uplandPlannedInstallationLoad);

            var existingPlannedInstallationLoad = {
              sediment: ((existingLoaddata.area*((existingLoaddata.efficieny.eos_tss/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_tss/newLoaddata.efficieny.eos_acres)))/2000),
              nitrogen: (existingLoaddata.area*((existingLoaddata.efficieny.eos_totn/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_totn/newLoaddata.efficieny.eos_acres))),
              phosphorus: (existingLoaddata.area*((existingLoaddata.efficieny.eos_totp/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_totp/newLoaddata.efficieny.eos_acres)))
            };

            console.log('PLANNED existingPlannedInstallationLoad', existingPlannedInstallationLoad);

            //
            // PLANNED CONDITIONS — LANDUSE VALUES
            //
            var totals = {
              efficiency: {
                new: newLoaddata,
                existing: existingLoaddata
              },
              nitrogen: uplandPlannedInstallationLoad.nitrogen + existingPlannedInstallationLoad.nitrogen,
              phosphorus: uplandPlannedInstallationLoad.phosphorus + existingPlannedInstallationLoad.phosphorus,
              sediment: uplandPlannedInstallationLoad.sediment + existingPlannedInstallationLoad.sediment
            };

            $scope.calculate.results.totalPlannedLoad = totals;

          });
        });
      });
    };


    $scope.calculate.quantityInstalled = function(values, element, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach(values, function(reading, $index) {
        if (reading.measurement_period === 'Planning') {
          planned_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total) {
        console.log('something to show');
        if (format === '%') {
          percentage = (installed_total/planned_total);
          console.log('percentage', (percentage*100));
          return (percentage*100);
        } else {
          console.log('installed_total', installed_total);
          return installed_total;
        }
      }

      return 0;

    };

    //
    // The purpose of this function is to return a percentage of the total installed versus the amount
    // that was originally planned on being installed:
    //
    // (Installation+Installation+Installation) / Planned = % of Planned
    //
    //
    // @param (string) field
    //    The `field` parameter should be the field that you would like to get the percentage for
    //
    $scope.calculate.GetPercentageOfInstalled = function(field, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach($scope.practice.readings, function(reading, $index) {

        if (reading.measurement_period === 'Planning') {
          planned_total += reading[field];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += reading[field];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total >= 1) {
        if (format === 'percentage') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }
      }

      return null;
    };

    $scope.calculate.GetSingleInstalledLoad = function(value) {

      var reduction = 0,
          bufferArea = ((value.length_of_buffer * value.average_width_of_buffer)/43560),
          landuse = (value.existing_riparian_landuse) ? $scope.landuse[value.existing_riparian_landuse.toLowerCase()] : null,
          preExistingEfficieny = $scope.calculate.results.totalPreInstallationLoad.efficieny,
          landuseEfficiency = ($scope.calculate.results.totalPlannedLoad && $scope.calculate.results.totalPlannedLoad.efficiency) ? $scope.calculate.results.totalPlannedLoad.efficiency : null,
          uplandPreInstallationLoad = null,
          existingPreInstallationLoad = null;

      if ($scope.practice_efficiency) {
        uplandPreInstallationLoad = {
          sediment: (((bufferArea*2*(landuseEfficiency.existing.efficieny.eos_tss/landuseEfficiency.existing.efficieny.eos_acres))/2000)*$scope.practice_efficiency.s_efficiency/100),
          nitrogen: ((bufferArea*4*(landuseEfficiency.existing.efficieny.eos_totn/landuseEfficiency.existing.efficieny.eos_acres))*$scope.practice_efficiency.n_efficiency/100),
          phosphorus: ((bufferArea*2*(landuseEfficiency.existing.efficieny.eos_totp/landuseEfficiency.existing.efficieny.eos_acres))*$scope.practice_efficiency.p_efficiency/100)
        };
      }

      if (landuseEfficiency) {
        existingPreInstallationLoad = {
          sediment: ((bufferArea*((landuseEfficiency.existing.efficieny.eos_tss/landuseEfficiency.existing.efficieny.eos_acres)-(landuseEfficiency.new.efficieny.eos_tss/landuseEfficiency.new.efficieny.eos_acres)))/2000),
          nitrogen: (bufferArea*((landuseEfficiency.existing.efficieny.eos_totn/landuseEfficiency.existing.efficieny.eos_acres)-(landuseEfficiency.new.efficieny.eos_totn/landuseEfficiency.new.efficieny.eos_acres))),
          phosphorus: (bufferArea*((landuseEfficiency.existing.efficieny.eos_totp/landuseEfficiency.existing.efficieny.eos_acres)-(landuseEfficiency.new.efficieny.eos_totp/landuseEfficiency.new.efficieny.eos_acres)))
        };
      }

      if (uplandPreInstallationLoad && existingPreInstallationLoad) {
        return {
          nitrogen: uplandPreInstallationLoad.nitrogen + existingPreInstallationLoad.nitrogen,
          phosphorus: uplandPreInstallationLoad.phosphorus + existingPreInstallationLoad.phosphorus,
          sediment: uplandPreInstallationLoad.sediment + existingPreInstallationLoad.sediment
        };
      } else {
        return {
          nitrogen: null,
          phosphorus: null,
          sediment: null
        }
      }
    };

    $scope.calculate.GetTreeDensity = function(trees, length, width) {
      return (trees/(length*width/43560));
    };

    $scope.calculate.GetPercentage = function(part, total) {
      return ((part/total)*100);
    };

    $scope.calculate.GetConversion = function(part, total) {
      return (part/total);
    };

    $scope.calculate.GetConversionWithArea = function(length, width, total) {
      return ((length*width)/total);
    };

    $scope.calculate.GetRestorationTotal = function(unit, area) {

      console.log('$scope.calculate.GetRestorationTotal', unit, area);

      var total_area = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Installation') {
          if (area) {
            total_area += ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].average_width_of_buffer);
          } else {
            total_area += $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      console.log('GetRestorationTotal', total_area, unit, (total_area/unit));


      return (total_area/unit);
    };

    $scope.calculate.GetRestorationPercentage = function(unit, area) {

      var planned_area = 0,
          total_area = $scope.calculate.GetRestorationTotal(unit, area);

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
          if (area) {
            planned_area = ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].average_width_of_buffer);
          } else {
            planned_area = $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      planned_area = (planned_area/unit);

      console.log(total_area, planned_area, (total_area/planned_area));

      return ((total_area/planned_area)*100);
    };

    //
    // Scope elements that run the actual equations and send them back to the
    // user interface for display
    //
    // In order to run all of these we need to make sure that our HGMR
    // information from our selected Site has been added to the HGMR object
    //
    Feature.GetFeature({
      storage: 'type_f9d8609090494dac811e6a58eb8ef4be',
      featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    }).then(function(hgmrResponse) {

      //
      // Assign HGMR Code Lookup information to the existing site
      //
      $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = hgmrResponse;

      //
      // Scope elements that run the actual equations and send them back to the user interface for display
      //
      $scope.calculate.results = {
        percentageLengthOfBuffer: {
          percentage: $scope.calculate.GetPercentageOfInstalled('length_of_buffer', 'percentage'),
          total: $scope.calculate.GetPercentageOfInstalled('length_of_buffer')
        },
        percentageTreesPlanted: {
          percentage: $scope.calculate.GetPercentageOfInstalled('number_of_trees_planted', 'percentage'),
          total: $scope.calculate.GetPercentageOfInstalled('number_of_trees_planted')
        },
        totalPreInstallationLoad: $scope.calculate.GetPreInstallationLoad('Planning'),
        totalPlannedLoad: $scope.calculate.GetPlannedLoad('Planning'),
        totalMilesRestored: $scope.calculate.GetRestorationTotal(5280),
        percentageMilesRestored: $scope.calculate.GetRestorationPercentage(5280, false),
        totalAcresRestored: $scope.calculate.GetRestorationTotal(43560, true),
        percentageAcresRestored: $scope.calculate.GetRestorationPercentage(43560, true),
      };
    });


    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: commonscloud.collections.project.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;

        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: commonscloud.collections.project.storage,
            featureId: $route.current.params.projectId,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
            if ($scope.user.feature.is_admin || $scope.user.feature.write) {
            } else {
              $location.path('/projects/' + $route.current.params.projectId);
            }
          });
        }

      });
    }


  });

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:GrassBufferFormController
 * @description
 * # GrassBufferFormController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('GrassBufferFormController', ['$rootScope', '$scope', '$route', '$location', 'moment', 'user', 'Template', 'Field', 'Feature', 'Storage', 'template', 'project', 'site', 'practice', 'commonscloud', function ($rootScope, $scope, $route, $location, moment, user, Template, Field, Feature, Storage, template, project, site, practice, commonscloud) {

    //
    // Assign project to a scoped variable
    //
    $scope.template = template;

    $scope.report = {};

    $scope.project = project;
    $scope.practice = practice;
    $scope.practice.practice_type = 'grass-buffer';

    $scope.storage = Storage[$scope.practice.practice_type];

    Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
      $scope.fields = response;
    });

    Feature.GetFeature({
      storage: $scope.storage.storage,
      featureId: $route.current.params.reportId
    }).then(function(report) {

      //
      // Load the reading into the scope
      //
      $scope.report = report;
      $scope.report.template = $scope.storage.templates.form;

      //
      // Watch the Tree Canopy Value, when it changes we need to update the lawn area value
      //
      $scope.calculateBufferComposition = function() {

        var running_total = $scope.report.buffer_composition_woody + $scope.report.buffer_composition_shrub + $scope.report.buffer_composition_bare + $scope.report.buffer_composition_grass;

        var remainder = 100-running_total;

        $scope.report.buffer_composition_other = remainder;
      };
      $scope.$watch('report.buffer_composition_woody', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_shrub', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_bare', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_grass', function() {
        $scope.calculateBufferComposition();
      });


      $scope.report.save = function() {
        Feature.UpdateFeature({
          storage: $scope.storage.storage,
          featureId: $scope.report.id,
          data: $scope.report
        }).then(function(response) {
          $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
        }).then(function(error) {
          // Do something with the error
        });
      };

      $scope.report.delete = function() {

        //
        // Before we can remove the Practice we need to remove the relationship it has with the Site
        //
        //
        angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
          if (feature.id === $scope.report.id) {
            $scope.practice[$scope.storage.storage].splice($index, 1);
          }
        });

        Feature.UpdateFeature({
          storage: commonscloud.collections.practice.storage,
          featureId: $scope.practice.id,
          data: $scope.practice
        }).then(function(response) {
          
          //
          // Now that the Project <> Site relationship has been removed, we can remove the Site
          //
          Feature.DeleteFeature({
            storage: $scope.storage.storage,
            featureId: $scope.report.id
          }).then(function(response) {
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
          });

        });

      };

      //
      // Add the reading information to the breadcrumbs
      //
      var page_title = 'Editing the ' + $scope.report.measurement_period + ' Report from ' + moment($scope.report.report_date).format('MMM d, YYYY');

      $rootScope.page.links.push({
        text: page_title,
        url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + $scope.report.id + '/edit'
      });

      $rootScope.page.title = page_title;

    });

    $scope.site = site;
    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--form.html',
      title: null,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + Feature.MachineReadable($scope.practice.practice_type)
        }    
      ],
      actions: [
        {
          type: 'button-link',
          action: function($index) {
            $scope.report.delete();
          },
          visible: false,
          loading: false,
          text: 'Delete Report'
        },
        {
          type: 'button-link new',
          action: function($index) {
            $scope.report.save();
            $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
          },
          visible: false,
          loading: false,
          text: 'Save Changes'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.in = function(search_value, list) {

      if (!list.length) {
        return true;
      }
        
      var $index;

      for ($index = 0; $index < list.length; $index++) {
        if (list[$index] === search_value) {
          return true;
        }
      }

      return false;
    };

    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: $scope.storage.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;
        
        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: $scope.storage.storage,
            featureId: $scope.report.id,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
          });
        }

      });
    }

  }]);

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(['$routeProvider', 'commonscloud', function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/livestock-exclusion', {
        templateUrl: '/modules/shared/default.html',
        controller: 'LivestockExclusionReportController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          readings: function(Storage, Feature, $route) {
            return Feature.GetRelatedFeatures({
              storage: commonscloud.collections.practice.storage,
              relationship: Storage['livestock-exclusion'].storage,
              featureId: $route.current.params.practiceId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/livestock-exclusion/:reportId/edit', {
        templateUrl: '/modules/shared/default.html',
        controller: 'LivestockExclusionFormController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.practice.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.practice.templateId, 'object');
          }
        }
      });

  }]);



'use strict';

/**
 * @ngdoc service
 * @name FieldStack.LivestockExclusionCalculate
 * @description
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .service('CalculateLivestockExclusion', ['Calculate', 'Landuse', function(Calculate, Landuse) {
    return {
      toMiles: function(feet) {
        return (feet/5280);
      },
      animalUnits: function(quantity, multiplier) {
        return ((quantity*multiplier)/1000);
      },
      totalDaysPerYearInStream: function(values) {
        return values.instream_dpmjan+values.instream_dpmfeb+values.instream_dpmmar+values.instream_dpmapr+values.instream_dpmmay+values.instream_dpmjun+values.instream_dpmjul+values.instream_dpmaug+values.instream_dpmsep+values.instream_dpmoct+values.instream_dpmnov+values.instream_dpmdec;
      },
      averageHoursPerYearInStream: function(values) {
        var totalHoursPerYearInStream = values.instream_hpdjan+values.instream_hpdfeb+values.instream_hpdmar+values.instream_hpdapr+values.instream_hpdmay+values.instream_hpdjun+values.instream_hpdjul+values.instream_hpdaug+values.instream_hpdsep+values.instream_hpdoct+values.instream_hpdnov+values.instream_hpddec;
        return totalHoursPerYearInStream;
      },
      averageDaysPerYearInStream: function(values) {
        // var dpm = this.totalDaysPerYearInStream(values),
        //     hpd = this.averageHoursPerYearInStream(values);

        var sumproduct = (values.instream_hpdjan*values.instream_dpmjan)+(values.instream_hpdfeb*values.instream_dpmfeb)+(values.instream_hpdmar*values.instream_dpmmar)+(values.instream_hpdapr*values.instream_dpmapr)+(values.instream_hpdmay*values.instream_dpmmay)+(values.instream_hpdjun*values.instream_dpmjun)+(values.instream_hpdjul*values.instream_dpmjul)+(values.instream_hpdaug*values.instream_dpmaug)+(values.instream_hpdsep*values.instream_dpmsep)+(values.instream_hpdoct*values.instream_dpmoct)+(values.instream_hpdnov*values.instream_dpmnov)+(values.instream_hpddec*values.instream_dpmdec);

        return (sumproduct/24);
      },
      quantityInstalled: function(values, field, format) {

        var planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += reading[field];
          } else if (reading.measurement_period === 'Installation') {
            installed_total += reading[field];
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
      },
      milesInstalled: function(values, field, format) {

        var installed_length = 0,
            planned_length = 0,
            feetInMiles = 5280;

        angular.forEach(values, function(value, $index) {
          if (values[$index].measurement_period === 'Planning') {
            planned_length += values[$index][field];
          }
          else if (values[$index].measurement_period === 'Installation') {
            installed_length += values[$index][field];
          }
        });

        var miles_installed = installed_length/feetInMiles,
            percentage_installed = installed_length/planned_length;

        return (format === '%') ? (percentage_installed*100) : miles_installed;
      },
      getPrePlannedLoad: function(segment, landuse, area) {

        var promise = Calculate.getLoadVariables(segment, Landuse[landuse.toLowerCase()]).$promise.then(function(efficiency) {
          console.log('Efficienies selected', area, efficiency);
          return Calculate.getLoadTotals(area, efficiency.features[0].properties);
        });

        return promise;
      }
    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:LivestockExclusionReportController
 * @description
 * # LivestockExclusionReportController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('LivestockExclusionReportController', function (AnimalType, Efficiency, $rootScope, $scope, $route, $location, $timeout, $http, $q, moment, user, Template, Feature, template, fields, project, site, practice, readings, commonscloud, Storage, Landuse, CalculateLivestockExclusion, Calculate) {

    //
    // Assign project to a scoped variable
    //
    $scope.project = project;
    $scope.site = site;

    $scope.template = template;
    $scope.fields = fields;

    $scope.practice = practice;
    $scope.practice.practice_type = 'livestock-exclusion';
    $scope.practice.readings = readings;

    $scope.practice_efficiency = null;

    $scope.storage = Storage[$scope.practice.practice_type];

    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    $scope.landuse = Landuse;

    $scope.calculate = CalculateLivestockExclusion;

    //
    // Temporary Fix
    //
    $scope.practice_efficiency = {
      s_efficiency: 30,
      n_efficiency: 9,
      p_efficiency: 24
    };

    $scope.grass_efficiency = {
      s_efficiency: 60,
      n_efficiency: 21,
      p_efficiency: 45
    };

    $scope.forest_efficiency = {
      s_efficiency: 60,
      n_efficiency: 21,
      p_efficiency: 45
    };

    $scope.calculate.GetLoadVariables = function(period, landuse) {

      var planned = {
        width: 0,
        length: 0,
        area: 0,
        landuse: '',
        segment: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].name,
        efficieny: null
      };

      var deferred = $q.defer();

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          planned.length = $scope.practice.readings[i].length_of_fencing;
          planned.width = $scope.practice.readings[i].average_buffer_width;
          planned.area = ((planned.length*planned.width)/43560);
          planned.landuse = (landuse) ? landuse : $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];

          var promise = $http.get('//api.commonscloud.org/v2/type_3fbea3190b634d0c9021d8e67df84187.json', {
            params: {
              q: {
                filters: [
                  {
                    name: 'landriversegment',
                    op: 'eq',
                    val: planned.segment
                  },
                  {
                    name: 'landuse',
                    op: 'eq',
                    val: planned.landuse
                  }
                ]
              }
            },
            headers: {
              'Authorization': 'external'
            }
          }).success(function(data, status, headers, config) {
            planned.efficieny = data.response.features[0];
            deferred.resolve(planned);
          });
        }
      }

      return deferred.promise;
    };

    $scope.calculate.GetPreInstallationLoad = function() {

      var rotationalGrazingArea, existingLanduseType, uplandLanduseType, animal, auDaysYr;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
           rotationalGrazingArea = ($scope.practice.readings[i].length_of_fencing*200/43560);
           existingLanduseType = $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];
           uplandLanduseType = $scope.landuse[$scope.practice.readings[i].upland_landuse.toLowerCase()];
           animal = AnimalType[$scope.practice.readings[i].animal_type];
           auDaysYr = ($scope.calculate.averageDaysPerYearInStream($scope.practice.readings[i])*$scope.calculate.animalUnits($scope.practice.readings[i].number_of_livestock, $scope.practice.readings[i].average_weight));
        }
      }

      $scope.calculate.GetLoadVariables('Planning', existingLanduseType).then(function(existingLoaddata) {
        $scope.calculate.GetLoadVariables('Planning', uplandLanduseType).then(function(loaddata) {

          // var efficiency = $scope.practice_efficiency = efficiencyResponse.response.features[0];

          //
          // =X38*2*AA$10/2000 + Z34*(AA$10/2000)*(AE$5/100)
          //
          var uplandPreInstallationLoad = {
            sediment: (((loaddata.area * 2)*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000) + rotationalGrazingArea*((loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres)/2000)*($scope.practice_efficiency.s_efficiency/100),
            nitrogen: (((loaddata.area * 4)*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres))) + rotationalGrazingArea*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)*($scope.practice_efficiency.n_efficiency/100),
            phosphorus: (((loaddata.area * 2)*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres))) + rotationalGrazingArea*((loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres))*($scope.practice_efficiency.p_efficiency/100)
          };

          // console.log('PRE uplandPreInstallationLoad', uplandPreInstallationLoad);

          var existingPreInstallationLoad = {
            sediment: ((loaddata.area*(existingLoaddata.efficieny.eos_tss/existingLoaddata.efficieny.eos_acres))/2000),
            nitrogen: (loaddata.area*(existingLoaddata.efficieny.eos_totn/existingLoaddata.efficieny.eos_acres)),
            phosphorus: (loaddata.area*(existingLoaddata.efficieny.eos_totp/existingLoaddata.efficieny.eos_acres))
          };

          // console.log('PRE existingPreInstallationLoad', existingPreInstallationLoad);

          var directDeposit = {
            nitrogen: (auDaysYr*animal.manure)*animal.total_nitrogen,
            phosphorus: (auDaysYr*animal.manure)*animal.total_phosphorus,
          };

          // console.log('directDeposit', directDeposit);

          $scope.calculate.results.totalPreInstallationLoad = {
            directDeposit: directDeposit,
            efficieny: loaddata.efficieny,
            uplandLanduse: uplandPreInstallationLoad,
            existingLanduse: existingPreInstallationLoad,
            nitrogen: uplandPreInstallationLoad.nitrogen + existingPreInstallationLoad.nitrogen + directDeposit.nitrogen,
            phosphorus: uplandPreInstallationLoad.phosphorus + existingPreInstallationLoad.phosphorus + directDeposit.phosphorus,
            sediment: uplandPreInstallationLoad.sediment + existingPreInstallationLoad.sediment
          };

        });
      });

    };

    $scope.calculate.GetPlannedLoad = function(period) {

      var existingLanduseType, bmpEfficiency, animal, auDaysYr;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          existingLanduseType = $scope.landuse[$scope.practice.readings[i].existing_riparian_landuse.toLowerCase()];
          bmpEfficiency = ($scope.practice.readings[i].buffer_type) ? $scope.grass_efficiency : $scope.forest_efficiency;
          animal = AnimalType[$scope.practice.readings[i].animal_type];
          auDaysYr = ($scope.calculate.averageDaysPerYearInStream($scope.practice.readings[i])*$scope.calculate.animalUnits($scope.practice.readings[i].number_of_livestock, $scope.practice.readings[i].average_weight));
        }
      }

      $scope.calculate.GetLoadVariables(period, existingLanduseType).then(function(existingLoaddata) {
        $scope.calculate.GetLoadVariables(period, $scope.storage.landuse).then(function(newLoaddata) {

          Efficiency.query({
            q: {
              filters: [
                {
                  name: 'cbwm_lu',
                  op: 'eq',
                  val: existingLanduseType
                },
                {
                  name: 'hydrogeomorphic_region',
                  op: 'eq',
                  val: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].hgmr_nme
                },
                {
                  name: 'best_management_practice_short_name',
                  op: 'eq',
                  val: (existingLanduseType === 'pas' || existingLanduseType === 'npa') ? 'ForestBuffersTrp': 'ForestBuffers'
                }
              ]
            }
          }).$promise.then(function(efficiencyResponse) {
            // var efficiency = $scope.practice_efficiency = efficiencyResponse.response.features[0];

            //
            // EXISTING CONDITION — LOAD VALUES
            //
            var uplandPlannedInstallationLoad = {
              sediment: ($scope.calculate.results.totalPreInstallationLoad.uplandLanduse.sediment/100)*bmpEfficiency.s_efficiency,
              nitrogen: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.nitrogen/100*bmpEfficiency.n_efficiency,
              phosphorus: $scope.calculate.results.totalPreInstallationLoad.uplandLanduse.phosphorus/100*bmpEfficiency.p_efficiency
            };

            console.log('PLANNED uplandPlannedInstallationLoad', uplandPlannedInstallationLoad);

            var existingPlannedInstallationLoad = {
              sediment: ((existingLoaddata.area*((existingLoaddata.efficieny.eos_tss/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_tss/newLoaddata.efficieny.eos_acres)))/2000),
              nitrogen: (existingLoaddata.area*((existingLoaddata.efficieny.eos_totn/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_totn/newLoaddata.efficieny.eos_acres))),
              phosphorus: (existingLoaddata.area*((existingLoaddata.efficieny.eos_totp/existingLoaddata.efficieny.eos_acres)-(newLoaddata.efficieny.eos_totp/newLoaddata.efficieny.eos_acres)))
            };

            console.log('PLANNED existingPlannedInstallationLoad', existingPlannedInstallationLoad);

            var directDeposit = {
              nitrogen: (auDaysYr*animal.manure)*animal.total_nitrogen,
              phosphorus: (auDaysYr*animal.manure)*animal.total_phosphorus,
            };

            //
            // PLANNED CONDITIONS — LANDUSE VALUES
            //
            var totals = {
              efficiency: {
                new: newLoaddata,
                existing: existingLoaddata
              },
              directDeposit: directDeposit,
              nitrogen: uplandPlannedInstallationLoad.nitrogen + existingPlannedInstallationLoad.nitrogen + directDeposit.nitrogen,
              phosphorus: uplandPlannedInstallationLoad.phosphorus + existingPlannedInstallationLoad.phosphorus + directDeposit.phosphorus,
              sediment: uplandPlannedInstallationLoad.sediment + existingPlannedInstallationLoad.sediment
            };

            $scope.calculate.results.totalPlannedLoad = totals;

          });
        });
      });

    };


    $scope.calculate.quantityReductionInstalled = function(values, element, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach(values, function(reading, $index) {
        if (reading.measurement_period === 'Planning') {
          planned_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total) {
        console.log('something to show');
        if (format === '%') {
          percentage = (installed_total/planned_total);
          console.log('percentage', (percentage*100));
          return (percentage*100);
        } else {
          console.log('installed_total', installed_total);
          return installed_total;
        }
      }

      return 0;

    };

    //
    // The purpose of this function is to return a percentage of the total installed versus the amount
    // that was originally planned on being installed:
    //
    // (Installation+Installation+Installation) / Planned = % of Planned
    //
    //
    // @param (string) field
    //    The `field` parameter should be the field that you would like to get the percentage for
    //
    $scope.calculate.GetPercentageOfInstalled = function(field, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach($scope.practice.readings, function(reading, $index) {

        if (reading.measurement_period === 'Planning') {
          planned_total += reading[field];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += reading[field];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total >= 1) {
        if (format === 'percentage') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }
      }

      return null;
    };

    $scope.calculate.GetSingleInstalledLoad = function(value) {

      console.log('value', value)

      /********************************************************************/
      // Setup
      /********************************************************************/

      //
      // Before we allow any of the following calculations to happen we
      // need to ensure that our basic load data has been loaded
      //
      if (!$scope.calculate.results.totalPlannedLoad) {
        return {
          nitrogen: null,
          phosphorus: null,
          sediment: null
        };
      }

      //
      // Setup variables we will need to complete the calculation
      //
      //
      var bufferArea = (value.length_of_fencing * value.average_buffer_width)/43560,
          bmpEfficiency = (value.buffer_type) ? $scope.grass_efficiency : $scope.forest_efficiency,
          newLanduseLoadData = $scope.calculate.results.totalPlannedLoad.efficiency.new.efficieny,
          existingLoaddata = $scope.calculate.results.totalPlannedLoad.efficiency.existing.efficieny,
          uplandLoaddata = $scope.calculate.results.totalPreInstallationLoad.efficieny,
          rotationalGrazingArea = (value.length_of_fencing*200/43560),
          animal = AnimalType[value.animal_type],
          auDaysYr,
          planningValue;

      //
      // Get Animal Unit Days/Year from Planning data
      //
      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
          planningValue = $scope.practice.readings[i];
          auDaysYr = ($scope.calculate.averageDaysPerYearInStream($scope.practice.readings[i])*$scope.calculate.animalUnits($scope.practice.readings[i].number_of_livestock, $scope.practice.readings[i].average_weight));
        }
      }

      /********************************************************************/
      // Part 1: Pre-Project Loads based on "Installed" buffer size
      /********************************************************************/

      var preUplandPreInstallationLoad = {
        sediment: (bufferArea * 2 * (uplandLoaddata.eos_tss/uplandLoaddata.eos_acres)/2000) + rotationalGrazingArea * ((uplandLoaddata.eos_tss/uplandLoaddata.eos_acres)/2000) * ($scope.practice_efficiency.s_efficiency/100),
        nitrogen: ((bufferArea * 4 * (uplandLoaddata.eos_totn/uplandLoaddata.eos_acres))) + rotationalGrazingArea*(uplandLoaddata.eos_totn/uplandLoaddata.eos_acres)*($scope.practice_efficiency.n_efficiency/100),
        phosphorus: ((bufferArea * 2 * (uplandLoaddata.eos_totp/uplandLoaddata.eos_acres))) + rotationalGrazingArea*((uplandLoaddata.eos_totp/uplandLoaddata.eos_acres))*($scope.practice_efficiency.p_efficiency/100)
      };

      var preExistingPreInstallationLoad = {
        sediment: ((bufferArea*(existingLoaddata.eos_tss/existingLoaddata.eos_acres))/2000),
        nitrogen: (bufferArea*(existingLoaddata.eos_totn/existingLoaddata.eos_acres)),
        phosphorus: (bufferArea*(existingLoaddata.eos_totp/existingLoaddata.eos_acres))
      };

      var preDirectDeposit = {
        nitrogen: (auDaysYr*animal.manure)*animal.total_nitrogen,
        phosphorus: (auDaysYr*animal.manure)*animal.total_phosphorus,
      };

       var preInstallationeBMPLoadTotals = {
           nitrogen: preUplandPreInstallationLoad.nitrogen + preExistingPreInstallationLoad.nitrogen + preDirectDeposit.nitrogen,
           phosphorus: preUplandPreInstallationLoad.phosphorus + preExistingPreInstallationLoad.phosphorus + preDirectDeposit.phosphorus,
           sediment: preUplandPreInstallationLoad.sediment + preExistingPreInstallationLoad.sediment
       };

       console.log('preInstallationeBMPLoadTotals', preInstallationeBMPLoadTotals);

       /********************************************************************/
       // Part 2: Loads based on "Installed" buffer size
       /********************************************************************/
       var uplandPlannedInstallationLoad = {
         sediment: preUplandPreInstallationLoad.sediment/100*bmpEfficiency.s_efficiency,
         nitrogen: preUplandPreInstallationLoad.nitrogen/100*bmpEfficiency.n_efficiency,
         phosphorus: preUplandPreInstallationLoad.phosphorus/100*bmpEfficiency.p_efficiency
       };

       console.log('postInstallationeBMPLoadTotals uplandPlannedInstallationLoad', uplandPlannedInstallationLoad);

       var existingPlannedInstallationLoad = {
         sediment: ((bufferArea*((existingLoaddata.eos_tss/existingLoaddata.eos_acres)-(newLanduseLoadData.eos_tss/newLanduseLoadData.eos_acres)))/2000),
         nitrogen: (bufferArea*((existingLoaddata.eos_totn/existingLoaddata.eos_acres)-(newLanduseLoadData.eos_totn/newLanduseLoadData.eos_acres))),
         phosphorus: (bufferArea*((existingLoaddata.eos_totp/existingLoaddata.eos_acres)-(newLanduseLoadData.eos_totp/newLanduseLoadData.eos_acres)))
       };

       console.log('postInstallationeBMPLoadTotals existingPlannedInstallationLoad', existingPlannedInstallationLoad);

       var directDeposit = {
         nitrogen: preDirectDeposit.nitrogen*value.length_of_fencing/planningValue.length_of_fencing,
         phosphorus: preDirectDeposit.phosphorus*value.length_of_fencing/planningValue.length_of_fencing,
       };

       console.log('postInstallationeBMPLoadTotals directDeposit', directDeposit);

      if (uplandPlannedInstallationLoad && existingPlannedInstallationLoad && directDeposit) {
        return {
          nitrogen: uplandPlannedInstallationLoad.nitrogen + existingPlannedInstallationLoad.nitrogen + directDeposit.nitrogen,
          phosphorus: uplandPlannedInstallationLoad.phosphorus + existingPlannedInstallationLoad.phosphorus + directDeposit.phosphorus,
          sediment: uplandPlannedInstallationLoad.sediment + existingPlannedInstallationLoad.sediment
        };
      } else {
        return {
          nitrogen: null,
          phosphorus: null,
          sediment: null
        };
      }
    };

    $scope.calculate.GetTreeDensity = function(trees, length, width) {
      return (trees/(length*width/43560));
    };

    $scope.calculate.GetPercentage = function(part, total) {
      return ((part/total)*100);
    };

    $scope.calculate.GetConversion = function(part, total) {
      return (part/total);
    };

    $scope.calculate.GetConversionWithArea = function(length, width, total) {
      return ((length*width)/total);
    };

    $scope.calculate.GetRestorationTotal = function(unit, area) {

      var total_area = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Installation') {
          if (area) {
            total_area += ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].av);
          } else {
            total_area += $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      console.log('GetRestorationTotal', total_area, unit, (total_area/unit));


      return (total_area/unit);
    };

    $scope.calculate.GetRestorationPercentage = function(unit, area) {

      var planned_area = 0,
          total_area = $scope.calculate.GetRestorationTotal(unit, area);

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
          if (area) {
            planned_area = ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].average_width_of_buffer);
          } else {
            planned_area = $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      planned_area = (planned_area/unit);

      return ((total_area/planned_area)*100);
    };


    $scope.calculate.quantityBufferInstalled = function(values, element, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach(values, function(reading, $index) {
        if (reading.measurement_period === 'Planning') {
          planned_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += $scope.calculate.GetSingleInstalledLoad(reading)[element];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total) {
        console.log('something to show');
        if (format === '%') {
          percentage = (installed_total/planned_total);
          console.log('percentage', (percentage*100));
          return (percentage*100);
        } else {
          console.log('installed_total', installed_total);
          return installed_total;
        }
      }

      return 0;

    };


    //
    // Scope elements that run the actual equations and send them back to the
    // user interface for display
    //
    // In order to run all of these we need to make sure that our HGMR
    // information from our selected Site has been added to the HGMR object
    //
    Feature.GetFeature({
      storage: 'type_f9d8609090494dac811e6a58eb8ef4be',
      featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    }).then(function(hgmrResponse) {

      //
      // Assign HGMR Code Lookup information to the existing site
      //
      $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = hgmrResponse;

      //
      // Scope elements that run the actual equations and send them back to the user interface for display
      //
      $scope.calculate.results = {
        totalPreInstallationLoad: $scope.calculate.GetPreInstallationLoad(),
        totalPlannedLoad: $scope.calculate.GetPlannedLoad('Planning')
      };
    });


    //
    //
    //
    $scope.GetTotal = function(period) {

      var total = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          total++;
        }
      }

      return total;
    };

    $scope.total = {
      planning: $scope.GetTotal('Planning'),
      installation: $scope.GetTotal('Installation'),
      monitoring: $scope.GetTotal('Monitoring')
    };

    //
    // Load Land river segment details
    //
    Feature.GetFeature({
      storage: commonscloud.collections.land_river_segment.storage,
      featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    }).then(function(response) {
      $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = response;
    });

    $scope.readings = {
      prepopulate: function(field) {
        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === 'Planning') {
            return $scope.practice.readings[i][field];
          }
        }
      },
      add: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            average_width_of_buffer: $scope.readings.prepopulate('average_width_of_buffer'),
            existing_riparian_landuse: $scope.readings.prepopulate('existing_riparian_landuse'),
            upland_landuse: $scope.readings.prepopulate('upland_landuse'),
            animal_type: $scope.readings.prepopulate('animal_type'),
            report_date: moment().format('YYYY-MM-DD'),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      },
      addReading: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            report_date: moment().format('YYYY-MM-DD'),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      }
    };

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--view.html',
      title: $scope.site.site_number + ' « ' + $scope.project.project_title,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
          type: 'active'
        }
      ],
      actions: [
        {
          type: 'button-link new',
          action: function() {
            $scope.readings.add($scope.practice);
          },
          text: 'Add Measurement Data'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.GetAllReadings = function(existingReadings, readingId) {

      var updatedReadings = [{
        id: readingId // Start by adding the newest relationships, then we'll add the existing sites
      }];

      angular.forEach(existingReadings, function(reading, $index) {
        updatedReadings.push({
          id: reading.id
        });
      });

      return updatedReadings;
    };


    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: commonscloud.collections.project.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;

        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: commonscloud.collections.project.storage,
            featureId: $route.current.params.projectId,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
            if ($scope.user.feature.is_admin || $scope.user.feature.write) {
            } else {
              $location.path('/projects/' + $route.current.params.projectId);
            }
          });
        }

      });
    }

  });

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:LivestockExclusionFormController
 * @description
 * # LivestockExclusionFormController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('LivestockExclusionFormController', ['$rootScope', '$scope', '$route', '$location', 'user', 'Template', 'Field', 'Feature', 'Storage', 'template', 'project', 'site', 'practice', 'commonscloud', function ($rootScope, $scope, $route, $location, user, Template, Field, Feature, Storage, template, project, site, practice, commonscloud) {

    //
    // Assign project to a scoped variable
    //
    $scope.template = template;

    $scope.report = {};

    $scope.project = project;
    $scope.practice = practice;
    $scope.practice.practice_type = 'livestock-exclusion';

    $scope.storage = Storage[$scope.practice.practice_type];

    Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
      $scope.fields = response;
    });

    Feature.GetFeature({
      storage: $scope.storage.storage,
      featureId: $route.current.params.reportId
    }).then(function(report) {

      //
      // Load the reading into the scope
      //
      $scope.report = report;

      console.log('Report Data Model', $scope.report);

      $scope.report.template = $scope.storage.templates.form;

      //
      // Watch the Tree Canopy Value, when it changes we need to update the lawn area value
      //
      $scope.calculateBufferComposition = function() {

        var running_total = $scope.report.buffer_composition_woody + $scope.report.buffer_composition_shrub + $scope.report.buffer_composition_bare + $scope.report.buffer_composition_grass;

        var remainder = 100-running_total;

        $scope.report.buffer_composition_other = remainder;
      };
      $scope.$watch('report.buffer_composition_woody', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_shrub', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_bare', function() {
        $scope.calculateBufferComposition();
      });
      $scope.$watch('report.buffer_composition_grass', function() {
        $scope.calculateBufferComposition();
      });


      $scope.report.save = function() {
        Feature.UpdateFeature({
          storage: $scope.storage.storage,
          featureId: $scope.report.id,
          data: $scope.report
        }).then(function(response) {
          $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
        }).then(function(error) {
          // Do something with the error
        });
      };

      $scope.report.delete = function() {

        //
        // Before we can remove the Practice we need to remove the relationship it has with the Site
        //
        //
        angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
          if (feature.id === $scope.report.id) {
            $scope.practice[$scope.storage.storage].splice($index, 1);
          }
        });

        Feature.UpdateFeature({
          storage: commonscloud.collections.practice.storage,
          featureId: $scope.practice.id,
          data: $scope.practice
        }).then(function(response) {
          
          //
          // Now that the Project <> Site relationship has been removed, we can remove the Site
          //
          Feature.DeleteFeature({
            storage: $scope.storage.storage,
            featureId: $scope.report.id
          }).then(function(response) {
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
          });

        });

      };

      //
      // Add the reading information to the breadcrumbs
      //
      var page_title = 'Editing the ' + $scope.report.measurement_period + ' Report';

      $rootScope.page.links.push({
        text: page_title,
        url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + $scope.report.id + '/edit'
      });

      $rootScope.page.title = page_title;

    });

    $scope.site = site;
    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--form.html',
      title: null,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + Feature.MachineReadable($scope.practice.practice_type)
        }    
      ],
      actions: [
        {
          type: 'button-link',
          action: function($index) {
            $scope.report.delete();
          },
          visible: false,
          loading: false,
          text: 'Delete Report'
        },
        {
          type: 'button-link new',
          action: function($index) {
            $scope.report.save();
            $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
          },
          visible: false,
          loading: false,
          text: 'Save Changes'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.in = function(search_value, list) {

      if (!list.length) {
        return true;
      }
        
      var $index;

      for ($index = 0; $index < list.length; $index++) {
        if (list[$index] === search_value) {
          return true;
        }
      }

      return false;
    };

    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: $scope.storage.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;
        
        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: $scope.storage.storage,
            featureId: $scope.report.id,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
          });
        }

      });
    }

  }]);

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(['$routeProvider', 'commonscloud', function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/urban-homeowner', {
        templateUrl: '/modules/components/practices/modules/urban-homeowner/views/report--view.html',
        controller: 'UrbanHomeownerReportController',
        controllerAs: 'page',
        resolve: {
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          },
          site: function(Site, $route) {
            return Site.get({
              id: $route.current.params.siteId
            });
          },
          practice: function(Practice, $route) {
            return Practice.get({
              id: $route.current.params.practiceId
            });
          },
          readings: function(Practice, $route) {
            return Practice.urbanHomeowner({
              id: $route.current.params.practiceId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/urban-homeowner/:reportId/edit', {
        templateUrl: '/modules/components/practices/modules/urban-homeowner/views/form--view.html',
        controller: 'UrbanHomeownerFormController',
        controllerAs: 'page',
        resolve: {
          user: function(Account) {
            if (Account.userObject && !Account.userObject.id) {
                return Account.getUser();
            }
            return Account.userObject;
          },
          site: function(Site, $route) {
            return Site.get({
              id: $route.current.params.siteId
            });
          },
          practice: function(Practice, $route) {
            return Practice.get({
              id: $route.current.params.practiceId
            });
          },
          report: function(PracticeUrbanHomeowner, $route) {
            return PracticeUrbanHomeowner.get({
              id: $route.current.params.reportId
            });
          }
        }
      });

  }]);

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name CalculateUrbanHomeowner
   * @description
   */
  angular.module('FieldStack')
    .service('CalculateUrbanHomeowner', function() {
      return {
        gallonsReducedPerYear: function(value) {

          var rainGarden = (value.rain_garden_area/0.12)*0.623,
              rainBarrel = value.rain_barrel_drainage_area*0.156,
              permeablePavement = value.permeable_pavement_area*0.312,
              downspoutDisconnection = value.downspout_disconnection_drainage_area*0.312;

          return (rainGarden+rainBarrel+permeablePavement+downspoutDisconnection);
        },
        preInstallationNitrogenLoad: function(value, loaddata) {

          var impervious = ((value.rain_garden_area/0.12)+value.rain_barrel_drainage_area+value.permeable_pavement_area+value.downspout_disconnection_drainage_area+value.impervious_cover_removal_area)*loaddata.impervious.tn_ual,
              pervious = (value.urban_nutrient_management_pledge_area+value.urban_nutrient_management_plan_area_hi_risk+value.conservation_landscaping+(value.tree_planting*100))*loaddata.pervious.tn_ual;

          return (impervious+pervious)/43560;
        },
        preInstallationPhosphorusLoad: function(value, loaddata) {
          var impervious = ((value.rain_garden_area/0.12)+value.rain_barrel_drainage_area+value.permeable_pavement_area+value.downspout_disconnection_drainage_area+value.impervious_cover_removal_area),
              pervious = (value.urban_nutrient_management_pledge_area+value.urban_nutrient_management_plan_area_hi_risk+value.conservation_landscaping+(value.tree_planting*100));

          return ((impervious)*loaddata.impervious.tp_ual + (pervious)*loaddata.pervious.tp_ual)/43560;
        },
        plannedNitrogenLoadReduction: function(value, loaddata) {
          var rainGarden = (value.rain_garden_area/0.12)*8.710,
              rainBarrel = value.rain_barrel_drainage_area*4.360,
              permeablePavement = value.permeable_pavement_area*6.970,
              downspoutDisconnection = value.downspout_disconnection_drainage_area*6.970,
              unmPledgeArea = value.urban_nutrient_management_pledge_area*0.653,
              unmHighRisk = value.urban_nutrient_management_plan_area_hi_risk*2.180,
              conservationLandscaping = value.conservation_landscaping*3.830,
              treePlanting = value.tree_planting*0.610,
              imperviousCoverRemoval = value.impervious_cover_removal_area*(loaddata.impervious.tn_ual-loaddata.pervious.tn_ual);

          return (rainGarden+rainBarrel+permeablePavement+downspoutDisconnection+unmPledgeArea+unmHighRisk+conservationLandscaping+treePlanting+imperviousCoverRemoval)/43560;
        },
        plannedPhosphorusLoadReduction: function(value, loaddata) {
          var rainGarden = (value.rain_garden_area/0.12)*1.220,
              rainBarrel = value.rain_barrel_drainage_area*0.520,
              permeablePavement = value.permeable_pavement_area*0.870,
              downspoutDisconnection = value.downspout_disconnection_drainage_area*0.870,
              unmPledgeArea = value.urban_nutrient_management_pledge_area*0.013,
              unmHighRisk = value.urban_nutrient_management_plan_area_hi_risk*0.044,
              conservationLandscaping = value.conservation_landscaping*0.170,
              imperviousCoverRemoval = value.impervious_cover_removal_area*(loaddata.impervious.tp_ual-loaddata.pervious.tp_ual);

          return (rainGarden+rainBarrel+permeablePavement+downspoutDisconnection+unmPledgeArea+unmHighRisk+conservationLandscaping+imperviousCoverRemoval)/43560;
        },
        installedPhosphorusLoadReduction: function(values, loaddata, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (value.properties.measurement_period === 'Planning') {
              planned += self.plannedPhosphorusLoadReduction(value.properties, loaddata);
            }
            else if (value.properties.measurement_period === 'Installation') {
              installed += self.plannedPhosphorusLoadReduction(value.properties, loaddata);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        installedNitrogenLoadReduction: function(values, loaddata, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (value.properties.measurement_period === 'Planning') {
              planned += self.plannedNitrogenLoadReduction(value.properties, loaddata);
            }
            else if (value.properties.measurement_period === 'Installation') {
              installed += self.plannedNitrogenLoadReduction(value.properties, loaddata);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        reductionPracticesInstalled: function(values, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (value.properties.measurement_period === 'Planning') {
              planned += self.gallonsReducedPerYear(value.properties);
            }
            else if (value.properties.measurement_period === 'Installation') {
              installed += self.gallonsReducedPerYear(value.properties);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        treesPlanted: function(values, field, format) {

          var installed_trees = 0,
              planned_trees = 0;

          angular.forEach(values, function(value, $index) {
            if (value.properties.measurement_period === 'Planning') {
              planned_trees += value.properties[field];
            }
            else if (value.properties.measurement_period === 'Installation') {
              installed_trees += value.properties[field];
            }
          });

          return (format === '%') ? ((installed_trees/planned_trees)*100) : installed_trees;
        },
        acresProtected: function(value) {

          var practiceArea = (value.rain_garden_area/0.12) + value.rain_barrel_drainage_area + value.permeable_pavement_area + value.downspout_disconnection_drainage_area + value.urban_nutrient_management_pledge_area + value.urban_nutrient_management_plan_area_hi_risk + value.conservation_landscaping + value.impervious_cover_removal_area,
              treePlantingArea = value.tree_planting*100;

          return (practiceArea+treePlantingArea)/43560;
        },
        acresInstalled: function(values, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (value.properties.measurement_period === 'Planning') {
              planned += self.acresProtected(value.properties);
            }
            else if (value.properties.measurement_period === 'Installation') {
              installed += self.acresProtected(value.properties);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
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
        },
        quantityCustomInstalled: function(values, field, format) {

          var planned_total = 0,
              installed_total = 0,
              percentage = 0;

          // Get readings organized by their Type
          angular.forEach(values, function(reading, $index) {

            if (reading.properties.measurement_period === 'Planning') {
              planned_total += reading.properties[field]/0.12;
            } else if (reading.properties.measurement_period === 'Installation') {
              installed_total += reading.properties[field]/0.12;
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
      };
    });

}());

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:UrbanHomeownerReportController
 * @description
 * # UrbanHomeownerReportController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('UrbanHomeownerReportController', function (Account, Calculate, CalculateUrbanHomeowner, $location, moment, practice, PracticeUrbanHomeowner, readings, $rootScope, $route, site, $scope, UALStateLoad, user, Utility) {

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
    self.calculateUrbanHomeowner = CalculateUrbanHomeowner;

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
            type: 'button-link new',
            action: function() {
              self.addReading();
            },
            text: 'Add Measurement Data'
          }
        ];

        //
        // After we have returned the Site.$promise we can look up our Site
        // specific load data
        //
        if (self.site.properties.state) {
          UALStateLoad.query({
            q: {
              filters: [
                {
                  name: 'state',
                  op: 'eq',
                  val: self.site.properties.state
                }
              ]
            }
          }, function(successResponse) {

            self.loaddata = {};

            angular.forEach(successResponse.features, function(feature, $index) {
              self.loaddata[feature.properties.developed_type] = {
                tn_ual: feature.properties.tn_ual,
                tp_ual: feature.properties.tp_ual,
                tss_ual: feature.properties.tss_ual
              };
            });

            console.log('self.loaddata', self.loaddata);
            
          }, function(errorResponse) {
            console.log('errorResponse', errorResponse);
          });
        } else {
          console.warning('No State UAL Load Reductions could be loaded because the `Site.state` field is `null`');
        }

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
                  can_edit: Account.canEdit(self.site.properties.project)
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

    }, function(errorResponse) {

    });

    self.addReading = function(measurementPeriod) {

      var newReading = new PracticeUrbanHomeowner({
          'measurement_period': measurementPeriod,
          'report_date': moment().format('YYYY-MM-DD'),
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

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:UrbanHomeownerFormController
 * @description
 * # UrbanHomeownerFormController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
.controller('UrbanHomeownerFormController', function (Account, Calculate, CalculateUrbanHomeowner, $location, moment, practice, PracticeUrbanHomeowner, report, $rootScope, $route, site, $scope, user, Utility) {

    var self = this,
        projectId = $route.current.params.projectId,
        siteId = $route.current.params.siteId,
        practiceId = $route.current.params.practiceId;

    $rootScope.page = {};

    self.practiceType = null;
    self.project = {
      'id': projectId
    };

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

        //
        // Assign project to a scoped variable
        //
        report.$promise.then(function(successResponse) {
          self.report = successResponse;

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
              },
              {
                text: 'Edit',
                url: '/projects/' + projectId + '/sites/' + siteId + '/practices/' + practiceId + '/' + self.practiceType + '/' + self.report.id + '/edit',
                type: 'active'
              }
          ];
        }, function(errorResponse) {
          console.error('ERROR: ', errorResponse);
        });

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
                  can_edit: Account.canEdit(self.site.properties.project)
              };
          });
      }
    });

    self.saveReport = function() {
      self.report.$update().then(function(successResponse) {
        $location.path('/projects/' + projectId + '/sites/' + siteId + '/practices/' + practiceId + '/' + self.practiceType);
      }).then(function(errorResponse) {
        console.error('ERROR: ', errorResponse);
      });
    };

    $scope.deleteReport = function() {
      self.report.$delete().then(function(successResponse) {
        $location.path('/projects/' + projectId + '/sites/' + siteId + '/practices/' + practiceId + '/' + self.practiceType);
      }).then(function(errorResponse) {
        console.error('ERROR: ', errorResponse);
      });
    };

  });

'use strict';

/**
 * @ngdoc overview
 * @name FieldStack
 * @description
 * # FieldStack
 *
 * Main module of the application.
 */
angular.module('FieldStack')
  .config(['$routeProvider', 'commonscloud', function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/bioretention', {
        templateUrl: '/modules/shared/default.html',
        controller: 'BioretentionReportController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          readings: function(Storage, Feature, $route) {
            return Feature.GetRelatedFeatures({
              storage: commonscloud.collections.practice.storage,
              relationship: Storage.bioretention.storage,
              featureId: $route.current.params.practiceId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/bioretention/:reportId/edit', {
        templateUrl: '/modules/shared/default.html',
        controller: 'BioretentionFormController',
        resolve: {
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.practice.templateId);
          },
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.practice.templateId, 'object');
          }
        }
      });

  }]);



'use strict';

/**
 * @ngdoc service
 * @name FieldStack.CalculateBioretention
 * @description
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .service('CalculateBioretention', [function() {
    return {
      adjustorCurveNitrogen: function(value, format) {

        var self = this,
            depthTreated = value.rainfall_depth_treated, // Make sure we change this in the database
            runoffVolumeCaptured = self.runoffVolumeCaptured(value),
            first = 0.0308*Math.pow(depthTreated, 5),
            second = 0.2562*Math.pow(depthTreated, 4),
            third = 0.8634*Math.pow(depthTreated, 3),
            fourth = 1.5285*Math.pow(depthTreated, 2),
            fifth = 1.501*depthTreated,
            reduction = (first-second+third-fourth+fifth-0.013);

        return (format === '%') ? reduction*100 : reduction;
      },
      adjustorCurvePhosphorus: function(value, format) {

        var self = this,
            depthTreated = value.rainfall_depth_treated, // Make sure we change this in the database
            runoffVolumeCaptured = self.runoffVolumeCaptured(value), // we need to make sure that this number is 0 before actually doing the rest of the calculation
            first = 0.0304*Math.pow(depthTreated, 5),
            second = 0.2619*Math.pow(depthTreated, 4),
            third = 0.9161*Math.pow(depthTreated, 3),
            fourth = 1.6837*Math.pow(depthTreated, 2),
            fifth = 1.7072*depthTreated,
            reduction = (first-second+third-fourth+fifth-0.0091);

        return (format === '%') ? reduction*100 : reduction;
      },
      adjustorCurveSediment: function(value, format) {

        var self = this,
            depthTreated = value.rainfall_depth_treated, // Make sure we change this in the database
            runoffVolumeCaptured = self.runoffVolumeCaptured(value), // we need to make sure that this number is 0 before actually doing the rest of the calculation
            first = 0.0326*Math.pow(depthTreated, 5),
            second = 0.2806*Math.pow(depthTreated, 4),
            third = 0.9816*Math.pow(depthTreated, 3),
            fourth = 1.8039*Math.pow(depthTreated, 2),
            fifth = 1.8292*depthTreated,
            reduction = (first-second+third-fourth+fifth-0.0098);

        return (format === '%') ? reduction*100 : reduction;
      },
      rainfallDepthTreated: function(value) {
        return (value.rainfall_depth_treated/(value.bioretention_impervious_area/43560))*12;
      },
      gallonsReducedPerYear: function(value) {
        var runoffVolumeCaptured = this.runoffVolumeCaptured(value);

        return (runoffVolumeCaptured*325851.4);
      },
      preInstallationNitrogenLoad: function(value, loaddata) {
        return ((value.bioretention_impervious_area*loaddata.impervious.tn_ual) + ((value.bioretention_total_drainage_area-value.bioretention_impervious_area)*loaddata.pervious.tn_ual))/43560;
      },
      preInstallationPhosphorusLoad: function(value, loaddata) {
        return ((value.bioretention_impervious_area*loaddata.impervious.tp_ual) + ((value.bioretention_total_drainage_area-value.bioretention_impervious_area)*loaddata.pervious.tp_ual))/43560;
      },
      preInstallationSedimentLoad: function(value, loaddata) {
        return ((value.bioretention_impervious_area*loaddata.impervious.tss_ual) + ((value.bioretention_total_drainage_area-value.bioretention_impervious_area)*loaddata.pervious.tss_ual))/43560;
      },
      plannedNitrogenLoadReduction: function(value, loaddata) {
        return (((value.bioretention_impervious_area*loaddata.impervious.tn_ual) + ((value.bioretention_total_drainage_area-value.bioretention_impervious_area)*loaddata.pervious.tn_ual))*this.adjustorCurveNitrogen(value))/43560;
      },
      plannedPhosphorusLoadReduction: function(value, loaddata) {
        return (((value.bioretention_impervious_area*loaddata.impervious.tp_ual) + ((value.bioretention_total_drainage_area-value.bioretention_impervious_area)*loaddata.pervious.tp_ual))*this.adjustorCurvePhosphorus(value))/43560;
      },
      plannedSedimentLoadReduction: function(value, loaddata) {
        return (((value.bioretention_impervious_area*loaddata.impervious.tss_ual) + ((value.bioretention_total_drainage_area-value.bioretention_impervious_area)*loaddata.pervious.tss_ual))*this.adjustorCurveSediment(value))/43560;
      },
      installedPhosphorusLoadReduction: function(values, loaddata, format) {

        var installed = 0,
            planned = 0,
            self = this;

        angular.forEach(values, function(value, $index) {
          if (values[$index].measurement_period === 'Planning') {
            planned += self.plannedPhosphorusLoadReduction(value, loaddata);
          }
          else if (values[$index].measurement_period === 'Installation') {
            installed += self.plannedPhosphorusLoadReduction(value, loaddata);
          }
        });

        var percentage_installed = installed/planned;

        return (format === '%') ? (percentage_installed*100) : installed;
      },
      installedNitrogenLoadReduction: function(values, loaddata, format) {

        var installed = 0,
            planned = 0,
            self = this;

        angular.forEach(values, function(value, $index) {
          if (values[$index].measurement_period === 'Planning') {
            planned += self.plannedNitrogenLoadReduction(value, loaddata);
          }
          else if (values[$index].measurement_period === 'Installation') {
            installed += self.plannedNitrogenLoadReduction(value, loaddata);
          }
        });

        var percentage_installed = installed/planned;

        return (format === '%') ? (percentage_installed*100) : installed;
      },
      installedSedimentLoadReduction: function(values, loaddata, format) {

        var installed = 0,
            planned = 0,
            self = this;

        angular.forEach(values, function(value, $index) {
          if (values[$index].measurement_period === 'Planning') {
            planned += self.plannedSedimentLoadReduction(value, loaddata);
          }
          else if (values[$index].measurement_period === 'Installation') {
            installed += self.plannedSedimentLoadReduction(value, loaddata);
          }
        });

        var percentage_installed = installed/planned;

        return (format === '%') ? (percentage_installed*100) : installed;
      },
      reductionPracticesInstalled: function(values, format) {

        var installed = 0,
            planned = 0,
            self = this;

        angular.forEach(values, function(value, $index) {
          if (values[$index].measurement_period === 'Planning') {
            planned += self.gallonsReducedPerYear(value);
          }
          else if (values[$index].measurement_period === 'Installation') {
            installed += self.gallonsReducedPerYear(value);
          }
        });

        var percentage_installed = installed/planned;

        return (format === '%') ? (percentage_installed*100) : installed;
      },
      acresProtected: function(value) {
        return (value.bioretention_total_drainage_area/43560);
      },
      acresInstalled: function(values, format) {

        var installed = 0,
            planned = 0,
            self = this;

        angular.forEach(values, function(value, $index) {
          if (values[$index].measurement_period === 'Planning') {
            planned += self.acresProtected(value);
          }
          else if (values[$index].measurement_period === 'Installation') {
            installed += self.acresProtected(value);
          }
        });

        var percentage_installed = installed/planned;

        return (format === '%') ? (percentage_installed*100) : installed;
      },
      quantityInstalled: function(values, field, format) {

        var planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += reading[field];
          } else if (reading.measurement_period === 'Installation') {
            installed_total += reading[field];
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
      },
      runoffVolumeCaptured: function(value) {
        return (value.rainfall_depth_treated*value.bioretention_impervious_area)/(12*43560);
      }
    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:BioretentionReportController
 * @description
 * # BioretentionReportController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('BioretentionReportController', ['$rootScope', '$scope', '$route', '$location', '$timeout', '$http', '$q', 'user', 'Template', 'Feature', 'template', 'fields', 'project', 'site', 'practice', 'readings', 'commonscloud', 'Storage', 'Landuse', 'CalculateBioretention', 'Calculate', 'StateLoad', function ($rootScope, $scope, $route, $location, $timeout, $http, $q, user, Template, Feature, template, fields, project, site, practice, readings, commonscloud, Storage, Landuse, CalculateBioretention, Calculate, StateLoad) {

    //
    // Assign project to a scoped variable
    //
    $scope.project = project;
    $scope.site = site;

    $scope.template = template;
    $scope.fields = fields;
    
    $scope.practice = practice;
    $scope.practice.practice_type = 'bioretention';
    $scope.practice.readings = readings;

    $scope.practice_efficiency = null;

    $scope.storage = Storage[$scope.practice.practice_type];

    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    //
    // Retrieve State-specific Load Data
    //
    StateLoad.query({
      q: {
        filters: [
          {
            name: 'state',
            op: 'eq',
            val: $scope.site.site_state
          }
        ]
      }
    }, function(response) {
      $scope.loaddata = {};

      angular.forEach(response.response.features, function(feature, $index) {
        $scope.loaddata[feature.developed_type] = {
          tn_ual: feature.tn_ual,
          tp_ual: feature.tp_ual,
          tss_ual: feature.tss_ual
        };
      });

      console.log('$scope.loaddata', $scope.loaddata)
    });


    $scope.landuse = Landuse;

    $scope.calculate = CalculateBioretention;

    $scope.calculate.GetLoadVariables = function(period, landuse) {

      var planned = {
        width: 0,
        length: 0,
        area: 0,
        landuse: '',
        segment: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].name,
        efficieny: null
      };

      var deferred = $q.defer();

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {

          var promise = $http.get('//api.commonscloud.org/v2/type_3fbea3190b634d0c9021d8e67df84187.json', {
            params: {
              q: {
                filters: [
                  {
                    name: 'landriversegment',
                    op: 'eq',
                    val: planned.segment
                  },
                  {
                    name: 'landuse',
                    op: 'eq',
                    val: planned.landuse
                  }
                ]
              }
            },
            headers: {
              'Authorization': 'external'
            }
          }).success(function(data, status, headers, config) {
            planned.efficieny = data.response.features[0];
            deferred.resolve(planned);
          });
        }
      }

      return deferred.promise;
    };

    $scope.calculate.GetInstalledLoadVariables = function(period, landuse) {

      var segment = $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].name;

      var deferred = $q.defer();

      var promise = $http.get('//api.commonscloud.org/v2/type_3fbea3190b634d0c9021d8e67df84187.json', {
        params: {
          q: {
            filters: [
              {
                name: 'landriversegment',
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
        },
        headers: {
          'Authorization': 'external'
        }
      }).success(function(data, status, headers, config) {
        
        var efficieny = data.response.features[0],
            total_area = 0;

        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === period) {

            var that = {
              length: $scope.practice.readings[i].length_of_fencing,
              width: $scope.practice.readings[i].average_buffer_width
            };

            total_area += (that.length*that.width);
          }
        }

        deferred.resolve({
          efficieny: efficieny,
          area: (total_area/43560)
        });
      });

      return deferred.promise;
    };

    $scope.calculate.GetPreInstallationLoad = function(period) {

      $scope.calculate.GetLoadVariables(period).then(function(loaddata) {

        console.log('GetPreInstallationLoad', loaddata);

        var results = {
          nitrogen: (loaddata.area*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: (loaddata.area*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: ((loaddata.area*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('results', results);

        $scope.calculate.results.totalPreInstallationLoad = results;
      });

    };

    $scope.calculate.GetPlannedLoad = function(period) {

      $scope.calculate.GetLoadVariables(period, $scope.storage.landuse).then(function(loaddata) {

        console.log('GetPlannedLoad', loaddata);

        var results = {
          nitrogen: (loaddata.area*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: (loaddata.area*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: ((loaddata.area*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('results', results);

        $scope.calculate.results.totalPlannedLoad = results;
      });

    };


    $scope.calculate.GetInstalledLoad = function(period) {

      $scope.calculate.GetInstalledLoadVariables(period, $scope.storage.landuse).then(function(loaddata) {

        console.log('GetInstalledLoad', loaddata);

        $scope.practice_efficiency = loaddata.efficieny;

        var results = {
          nitrogen: (loaddata.area*(loaddata.efficieny.eos_totn/loaddata.efficieny.eos_acres)),
          phosphorus: (loaddata.area*(loaddata.efficieny.eos_totp/loaddata.efficieny.eos_acres)),
          sediment: ((loaddata.area*(loaddata.efficieny.eos_tss/loaddata.efficieny.eos_acres))/2000)
        };

        console.log('results', results);

        $scope.calculate.results.totalInstalledLoad = results;
      });

    };

    //
    // The purpose of this function is to return a percentage of the total installed versus the amount
    // that was originally planned on being installed:
    //
    // (Installation+Installation+Installation) / Planned = % of Planned
    //
    //
    // @param (string) field
    //    The `field` parameter should be the field that you would like to get the percentage for
    //
    $scope.calculate.GetPercentageOfInstalled = function(field, format) {

      var planned_total = 0,
          installed_total = 0,
          percentage = 0;

      // Get readings organized by their Type
      angular.forEach($scope.practice.readings, function(reading, $index) {

        if (reading.measurement_period === 'Planning') {
          planned_total += reading[field];
        } else if (reading.measurement_period === 'Installation') {
          installed_total += reading[field];
        }

      });

      // Divide the Installed Total by the Planned Total to get a percentage of installed
      if (planned_total >= 1) {
        if (format === 'percentage') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }
      }

      return null;
    };

    $scope.calculate.GetSingleInstalledLoad = function(length, width, element) {

        var efficieny = $scope.practice_efficiency,
            area = ((length*width)/43560),
            value = null;

        console.log('efficieny', efficieny);

        if (element === 'nitrogen') {
          value = (area*(efficieny.eos_totn/efficieny.eos_acres));
        } else if (element === 'phosphorus') {
          value = (area*(efficieny.eos_totp/efficieny.eos_acres));
        } else if (element === 'sediment') {
          value = ((area*(efficieny.eos_tss/efficieny.eos_acres))/2000);
        }

        return value;
    };

    $scope.calculate.GetTreeDensity = function(trees, length, width) {
      return (trees/(length*width/43560));
    };

    $scope.calculate.GetPercentage = function(part, total) {
      return ((part/total)*100);
    };

    $scope.calculate.GetConversion = function(part, total) {
      return (part/total);
    };

    $scope.calculate.GetConversionWithArea = function(length, width, total) {
      return ((length*width)/total);
    };

    $scope.calculate.GetRestorationTotal = function(unit, area) {

      var total_area = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Installation') {
          if (area) {
            total_area += ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].av);
          } else {
            total_area += $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      console.log('GetRestorationTotal', total_area, unit, (total_area/unit));


      return (total_area/unit);
    };

    $scope.calculate.GetRestorationPercentage = function(unit, area) {

      var planned_area = 0,
          total_area = $scope.calculate.GetRestorationTotal(unit, area);

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === 'Planning') {
          if (area) {
            planned_area = ($scope.practice.readings[i].length_of_buffer*$scope.practice.readings[i].average_width_of_buffer);
          } else {
            planned_area = $scope.practice.readings[i].length_of_buffer;
          }
        }
      }

      planned_area = (planned_area/unit);

      console.log(total_area, planned_area, (total_area/planned_area));

      return ((total_area/planned_area)*100);
    };

    //
    // Scope elements that run the actual equations and send them back to the user interface for display
    //
    // $scope.calculate.results = {
    //   totalPreInstallationLoad: $scope.calculate.GetPreInstallationLoad('Planning'),
    //   totalPlannedLoad: $scope.calculate.GetPlannedLoad('Planning'),
    //   totalInstalledLoad: $scope.calculate.GetInstalledLoad('Installation')
    // };


    //
    //
    //
    $scope.GetTotal = function(period) {

      var total = 0;

      for (var i = 0; i < $scope.practice.readings.length; i++) {
        if ($scope.practice.readings[i].measurement_period === period) {
          total++;
        }
      }

      return total;
    };

    $scope.total = {
      planning: $scope.GetTotal('Planning'),
      installation: $scope.GetTotal('Installation'),
      monitoring: $scope.GetTotal('Monitoring')
    };

    //
    // Load Land river segment details
    //
    Feature.GetFeature({
      storage: commonscloud.collections.land_river_segment.storage,
      featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
    }).then(function(response) {
      $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = response;
    });

    $scope.readings = {
      bufferWidth: function() {
        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === 'Planning') {
            return $scope.practice.readings[i].average_width_of_buffer;
          }
        }
      },
      add: function(practice, readingType) {

        var reportDate = new Date();

        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1 
        //
        console.log('reportDate', reportDate, angular.isDate(reportDate), typeof reportDate);
        
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            report_date: reportDate,
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      },
      addReading: function(practice, readingType) {
        //
        // Creating a practice reading is a two step process.
        //
        //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
        //     for the Practice Reading table
        //  2. Update the Practice to create a relationship with the Reading created in step 1 
        //
        Feature.CreateFeature({
          storage: $scope.storage.storage,
          data: {
            measurement_period: (readingType) ? readingType : null,
            report_date: new Date(),
            owner: $scope.user.id,
            status: 'private'
          }
        }).then(function(reportId) {

          var data = {};
          data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

          //
          // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
          // to submit all relationships that are created and should remain. If we only submit the new
          // ID the system will kick out the sites that were added previously.
          //
          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: practice.id,
            data: data
          }).then(function() {
            //
            // Once the new Reading has been associated with the existing Practice we need to
            // display the form to the user, allowing them to complete it.
            //
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
          });
        });
      }
    };

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--view.html',
      title: $scope.site.site_number + ' « ' + $scope.project.project_title,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
          type: 'active'
        }    
      ],
      actions: [
        {
          type: 'button-link new',
          action: function() {
            $scope.readings.add($scope.practice);
          },
          text: 'Add Measurement Data'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };


    $scope.GetAllReadings = function(existingReadings, readingId) {

      var updatedReadings = [{
        id: readingId // Start by adding the newest relationships, then we'll add the existing sites
      }];

      angular.forEach(existingReadings, function(reading, $index) {
        updatedReadings.push({
          id: reading.id
        });
      });

      return updatedReadings;
    };


    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: commonscloud.collections.project.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;
        
        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: commonscloud.collections.project.storage,
            featureId: $route.current.params.projectId,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
            if ($scope.user.feature.is_admin || $scope.user.feature.write) {
            } else {
              $location.path('/projects/' + $route.current.params.projectId);
            }
          });
        }

      });
    }
    
  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:BioretentionFormController
 * @description
 * # BioretentionFormController
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .controller('BioretentionFormController', ['$rootScope', '$scope', '$route', '$location', 'user', 'Template', 'Field', 'Feature', 'Storage', 'template', 'project', 'site', 'practice', 'commonscloud', function ($rootScope, $scope, $route, $location, user, Template, Field, Feature, Storage, template, project, site, practice, commonscloud) {

    //
    // Assign project to a scoped variable
    //
    $scope.template = template;

    $scope.report = {};

    $scope.save = function() {
      Feature.UpdateFeature({
        storage: $scope.storage.storage,
        featureId: $scope.report.id,
        data: $scope.report
      }).then(function(response) {
        $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
      }).then(function(error) {
        // Do something with the error
      });
    };

    $scope.delete = function() {

      //
      // Before we can remove the Practice we need to remove the relationship it has with the Site
      //
      //
      angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
        if (feature.id === $scope.report.id) {
          $scope.practice[$scope.storage.storage].splice($index, 1);
        }
      });

      Feature.UpdateFeature({
        storage: commonscloud.collections.practice.storage,
        featureId: $scope.practice.id,
        data: $scope.practice
      }).then(function(response) {

        //
        // Now that the Project <> Site relationship has been removed, we can remove the Site
        //
        Feature.DeleteFeature({
          storage: $scope.storage.storage,
          featureId: $scope.report.id
        }).then(function(response) {
          $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
        });

      });

    };

    $scope.project = project;
    $scope.practice = practice;
    $scope.practice.practice_type = 'bioretention';

    $scope.storage = Storage[$scope.practice.practice_type];

    Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
      $scope.fields = response;
    });

    Feature.GetFeature({
      storage: $scope.storage.storage,
      featureId: $route.current.params.reportId
    }).then(function(report) {

      //
      // Load the reading into the scope
      //
      $scope.report = report;

      console.log('report', report);

      $scope.report.template = $scope.storage.templates.form;

      //
      // Add the reading information to the breadcrumbs
      //
      var page_title = 'Editing the ' + $scope.report.measurement_period + ' Report';

      $rootScope.page.links.push({
        text: page_title,
        url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + $scope.report.id + '/edit'
      });

      $rootScope.page.title = page_title;

    });

    $scope.site = site;
    $scope.user = user;
    $scope.user.owner = false;
    $scope.user.feature = {};
    $scope.user.template = {};

    //
    // Setup basic page variables
    //
    $rootScope.page = {
      template: '/modules/components/practices/views/practices--form.html',
      title: null,
      links: [
        {
          text: 'Projects',
          url: '/projects'
        },
        {
          text: $scope.project.project_title,
          url: '/projects/' + $scope.project.id,
        },
        {
          text: $scope.site.site_number,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
        },
        {
          text: $scope.practice.name,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + Feature.MachineReadable($scope.practice.practice_type)
        }
      ],
      actions: [
        {
          type: 'button-link',
          action: function($index) {
            $scope.delete();
          },
          visible: false,
          loading: false,
          text: 'Delete Report'
        },
        {
          type: 'button-link new',
          action: function($index) {
            $scope.save();
            $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
          },
          visible: false,
          loading: false,
          text: 'Save Changes'
        }
      ],
      refresh: function() {
        $route.reload();
      }
    };

    //
    // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
    // backend functionality. Even if the user guesses the URL the API will stop them from editing the
    // actual Feature within the system
    //
    if ($scope.user.id === $scope.project.owner) {
      $scope.user.owner = true;
    } else {
      Template.GetTemplateUser({
        storage: $scope.storage.storage,
        templateId: $scope.template.id,
        userId: $scope.user.id
      }).then(function(response) {

        $scope.user.template = response;

        //
        // If the user is not a Template Moderator or Admin then we need to do a final check to see
        // if there are permissions on the individual Feature
        //
        if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
          Feature.GetFeatureUser({
            storage: $scope.storage.storage,
            featureId: $scope.report.id,
            userId: $scope.user.id
          }).then(function(response) {
            $scope.user.feature = response;
          });
        }

      });
    }

  }]);

'use strict';

/**
 * @ngdoc overview
 * @name
 * @description
 */
angular.module('FieldStack')
  .config(function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/instream-habitat', {
        templateUrl: '/modules/shared/default.html',
        controller: 'InstreamHabitatReportController',
        resolve: {
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          readings: function(Storage, Feature, $route) {
            return Feature.GetRelatedFeatures({
              storage: commonscloud.collections.practice.storage,
              relationship: Storage['instream-habitat'].storage,
              featureId: $route.current.params.practiceId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/instream-habitat/:reportId/edit', {
        templateUrl: '/modules/shared/default.html',
        controller: 'InstreamHabitatFormController',
        resolve: {
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.practice.templateId, 'object');
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.practice.templateId);
          },
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          }
        }
      });

  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .service('InstreamHabitatCalculate', function() {
    return {
      quantityInstalled: function(values, field, format) {

        var planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += reading[field];
          } else if (reading.measurement_period === 'Installation') {
            installed_total += reading[field];
          }

        });

        // Divide the Installed Total by the Planned Total to get a percentage of installed
        if (format === '%') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }

        return 0;
      }
    };
  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('InstreamHabitatReportController', function(commonscloud, Feature, fields, InstreamHabitatCalculate, Landuse, $location, practice, project, readings, $rootScope, $route, $scope, site, Storage, template, Template, user) {

    /**
     * Define how we should handle individual Practice/Monitoring Readings
     * for the In-stream Habitat Practice
     *
     * @param add (function) Add an entirely new Reading to this practice instance
     */
     $scope.readings = {
       count: function(measurementPeriodName) {

         var total = 0;

         for (var i = 0; i < $scope.practice.readings.length; i++) {
           if ($scope.practice.readings[i].measurement_period === measurementPeriodName) {
             total++;
           }
         }

         return total;
       },
       all: function(existingReadings, readingId) {

         // Start by adding the newest relationships, then we'll add the existing sites
         var updatedReadings = [{
           id: readingId
         }];

         // Add all existing readings back to our newly updated array
         angular.forEach(existingReadings, function(reading, $index) {
           updatedReadings.push({
             id: reading.id
           });
         });

         // Return our revised and combined readings array
         return updatedReadings;
       },
       add: function(practice, readingType) {

         var reportDate = new Date();

         /**
          * Creating a practice reading is a two step process.
          *
          *  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
          *     for the Practice Reading table
          *  2. Update the Practice to create a relationship with the Reading created in step 1
          *
          * @todo When we implement the Enterprise we'll be remove the `status`
          *       defintion here. Allowing folks to set this or intercept this
          *       defeats the purpose of really having it to secure the system.
          *
          */
         Feature.CreateFeature({
           storage: $scope.storage.storage,
           data: {
             measurement_period: (readingType) ? readingType : null,
             report_date: reportDate,
             owner: $scope.user.id,
             status: 'private'
           }
         }).then(function(reportId) {

           var data = {};

           //
           // We need to make sure that we add the new reading to the existing
           // list of readings on this Pracitce Instance. if we don't submit
           // all old `id`s with the new `id` bad things happen. Our `POST`
           // needs the entire list of reading `id` in order to retain the
           // relationship between `Practice` instance <> `Reading` list
           //
           data[$scope.storage.storage] = $scope.readings.all(practice.readings, reportId);

           //
           // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
           // to submit all relationships that are created and should remain. If we only submit the new
           // ID the system will kick out the sites that were added previously.
           //
           Feature.UpdateFeature({
             storage: commonscloud.collections.practice.storage,
             featureId: practice.id,
             data: data
           }).then(function() {
             //
             // Once the new Reading has been associated with the existing Practice we need to
             // display the form to the user, allowing them to complete it.
             //
             $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
           });
         });
       }
     };

      /**
       * Ensures that all 'resolve' $promises are loaded into the page as
       * variables on the $scope. If they are not, you won't be able to access
       * them in the page templates
       *
       * @see $routeProvier.when.resolve
       *    https://docs.angularjs.org/api/ngRoute/provider/$routeProvider#when
       *
       */
      $scope.project = project;
      $scope.site = site;

      $scope.template = template;
      $scope.fields = fields;

      $scope.practice = practice;
      $scope.practice.practice_type = 'instream-habitat';
      $scope.practice.readings = readings;
      $scope.practice_efficiency = null;

      $scope.storage = Storage[$scope.practice.practice_type];

      $scope.user = user;
      $scope.user.owner = false;
      $scope.user.feature = {};
      $scope.user.template = {};

      $scope.landuse = Landuse;

      $scope.total = {
        planning: $scope.readings.count('Planning'),
        installation: $scope.readings.count('Installation'),
        monitoring: $scope.readings.count('Monitoring')
      };

      $scope.calculate = InstreamHabitatCalculate;

      /**
       * Defined the Page variables to load and display the page properly
       *
       * @param template (string) The name of the page template to load for this report
       * @param title (string) The title of the page
       * @param links (array) Defines the list of breadcrumbs across the top of the page
       * @param actions (array) Defines the 'action' buttons that appear in the top level beside the breadcrumbs (e.g., Add a Practice)
       * @param refresh (function) A generic page reload function
       */
      $rootScope.page = {
        template: '/modules/components/practices/views/practices--view.html',
        title: $scope.site.site_number + ' « ' + $scope.project.project_title,
        links: [
          {
            text: 'Projects',
            url: '/projects'
          },
          {
            text: $scope.project.project_title,
            url: '/projects/' + $scope.project.id,
          },
          {
            text: $scope.site.site_number,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
          },
          {
            text: $scope.practice.name,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
            type: 'active'
          }
        ],
        actions: [
          {
            type: 'button-link new',
            action: function() {
              $scope.readings.add($scope.practice);
            },
            text: 'Add Measurement Data'
          }
        ],
        refresh: function() {
          $route.reload();
        }
      };


      /**
       * Setup the User's page access and ensure that we are allowing them
       * to access page elements appropriate for their user role.
       *
       * [IF] the user account is already loaded and they are the owner, allow
       * them to go on their way without any further processing.
       *
       * [ELSE] If the user does not own this resource, we need to figure out if
       *        they are allowed to access this.
       *
       * @todo When we upgrade to the Enterprise level API we'll be able to get
       *       rid of large portions of this conditional statement. For now we
       *       need to do things this way because of how the CommonsCloud
       *       Community API is built.
       */
       if ($scope.user.id === $scope.project.owner) {
         $scope.user.owner = true;
       } else {
         Template.GetTemplateUser({
           storage: commonscloud.collections.project.storage,
           templateId: $scope.template.id,
           userId: $scope.user.id
         }).then(function(response) {

           $scope.user.template = response;

           //
           // If the user is not a Template Moderator or Admin then we need to do a final check to see
           // if there are permissions on the individual Feature
           //
           if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
             Feature.GetFeatureUser({
               storage: commonscloud.collections.project.storage,
               featureId: $route.current.params.projectId,
               userId: $scope.user.id
             }).then(function(response) {
               $scope.user.feature = response;
               if ($scope.user.feature.is_admin || $scope.user.feature.write) {
               } else {
                 $location.path('/projects/' + $route.current.params.projectId);
               }
             });
           }

         });
       }
  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('InstreamHabitatFormController', function(commonscloud, Feature, Field, fields, $location, practice, project, $rootScope, $route, $scope, site, Storage, template, Template, user) {

    /**
     * Ensures that all 'resolve' $promises are loaded into the page as
     * variables on the $scope. If they are not, you won't be able to access
     * them in the page templates
     *
     * @see $routeProvier.when.resolve
     *    https://docs.angularjs.org/api/ngRoute/provider/$routeProvider#when
     *
     */
     $scope.report = {};
     $scope.template = template;

     $scope.project = project;
     $scope.practice = practice;
     $scope.practice.practice_type = 'instream-habitat';

     $scope.storage = Storage[$scope.practice.practice_type];

     $scope.site = site;
     $scope.user = user;
     $scope.user.owner = false;
     $scope.user.feature = {};
     $scope.user.template = {};

     $scope.options = {
       structureTypes: [
         'Drop Structure',
         'Vanes',
         'Porous Weirs',
         'Roughened Channels/Constructed Riffles',
         'Boulder Placement',
         'Rootwad Revetment'
       ],
       habitatAssessmentTypes: [
         'Rapid Bioassessment Protocol II',
         'SaveOurStreams',
         'Maryland Biological Stream Survey',
         'Unified Stream Assessment'
       ]
     };


     /**
      *
      */
     Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
       $scope.fields = response;
     });

     Feature.GetFeature({
       storage: $scope.storage.storage,
       featureId: $route.current.params.reportId
     }).then(function(reportResponse) {

       //
       // Load the reading into the scope
       //
       $scope.report = reportResponse;

       $scope.report.template = $scope.storage.templates.form;
     });

     /**
      * Defined the Page variables to load and display the page properly
      *
      * @param template (string) The name of the page template to load for this reading
      * @param title (string) The title of the page
      * @param links (array) Defines the list of breadcrumbs across the top of the page
      * @param actions (array) Defines the 'action' buttons that appear in the top level beside the breadcrumbs (e.g., Add a Practice)
      * @param refresh (function) A generic page reload function
      */
     $rootScope.page = {
       template: '/modules/components/practices/views/practices--form.html',
       title: null,
       links: [
         {
           text: 'Projects',
           url: '/projects'
         },
         {
           text: $scope.project.project_title,
           url: '/projects/' + $scope.project.id,
         },
         {
           text: $scope.site.site_number,
           url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
         },
         {
           text: $scope.practice.name,
           url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type
         }
       ],
       actions: [
         {
           type: 'button-link',
           action: function($index) {
             $scope.reading.delete();
           },
           visible: false,
           loading: false,
           text: 'Delete Reading'
         },
         {
           type: 'button-link new',
           action: function($index) {
             $scope.reading.save();
             $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
           },
           visible: false,
           loading: false,
           text: 'Save Changes'
         }
       ],
       refresh: function() {
         $route.reload();
       }
     };

     /**
      * Setup the User's page access and ensure that we are allowing them
      * to access page elements appropriate for their user role.
      *
      * [IF] the user account is already loaded and they are the owner, allow
      * them to go on their way without any further processing.
      *
      * [ELSE] If the user does not own this resource, we need to figure out if
      *        they are allowed to access this.
      *
      * @todo When we upgrade to the Enterprise level API we'll be able to get
      *       rid of large portions of this conditional statement. For now we
      *       need to do things this way because of how the CommonsCloud
      *       Community API is built.
      */
      if ($scope.user.id === $scope.project.owner) {
        $scope.user.owner = true;
      } else {
        Template.GetTemplateUser({
          storage: commonscloud.collections.project.storage,
          templateId: $scope.template.id,
          userId: $scope.user.id
        }).then(function(response) {

          $scope.user.template = response;

          //
          // If the user is not a Template Moderator or Admin then we need to do a final check to see
          // if there are permissions on the individual Feature
          //
          if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
            Feature.GetFeatureUser({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId,
              userId: $scope.user.id
            }).then(function(response) {
              $scope.user.feature = response;
              if ($scope.user.feature.is_admin || $scope.user.feature.write) {
              } else {
                $location.path('/projects/' + $route.current.params.projectId);
              }
            });
          }

        });
      }

     /**
      * Define how we should handle individual Practice/Monitoring Readings
      * for the In-stream Habitat Form
      *
      * @param add (function) Add an entirely new Reading to this practice instance
      */
      $scope.reading = {
        save: function() {
          Feature.UpdateFeature({
            storage: $scope.storage.storage,
            featureId: $scope.report.id,
            data: $scope.report
          }).then(function(response) {
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
          }).then(function(error) {
            // Do something with the error
          });
        },
        delete: function() {
          //
          // Before we can remove the Practice we need to remove the relationship it has with the Site
          //
          //
          angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
            if (feature.id === $scope.report.id) {
              $scope.practice[$scope.storage.storage].splice($index, 1);
            }
          });

          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: $scope.practice.id,
            data: $scope.practice
          }).then(function(response) {

            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);

            /**
             * @todo We should be actually deleting the feature as displayed in
             *       the code below:
             *
             *         Feature.DeleteFeature({
             *           storage: $scope.storage.storage,
             *           featureId: $scope.report.id
             *         });
             *
             *       However, because of a weird permissions issue that breaks
             *       the endpoint in the existing version of CommonsAPI we
             *       cannot delete this because of the following error:
             *
             * IntegrityError: (IntegrityError) update or delete on table
             * "type_6800a0c907494118b9a8872a70ee26da" violates foreign key
             * constraint "type_6800a0c907494118b9a8872a70ee26da_users_feature_id_fkey"
             * on table "type_6800a0c907494118b9a8872a70ee26da_users"
             *
             *       This issue will be resolved through new permission usage
             *       on the NFWF Enterprise API, but will exist while we use the
             *       existing CommonsCloud API data models.
             *
             *       Our existing and bad fix is to simply "disassociated" the
             *       the Reading Feature from the Practice Feature without
             *       deleting the Feature from the system.
             */

          });
        }
      };
  });

'use strict';

/**
 * @ngdoc overview
 * @name
 * @description
 */
angular.module('FieldStack')
  .config(function($routeProvider, commonscloud) {

    $routeProvider
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/bank-stabilization', {
        templateUrl: '/modules/shared/default.html',
        controller: 'BankStabilizationReportController',
        resolve: {
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          readings: function(Storage, Feature, $route) {
            return Feature.GetRelatedFeatures({
              storage: commonscloud.collections.practice.storage,
              relationship: Storage['bank-stabilization'].storage,
              featureId: $route.current.params.practiceId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.site.templateId);
          },
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          }
        }
      })
      .when('/projects/:projectId/sites/:siteId/practices/:practiceId/bank-stabilization/:reportId/edit', {
        templateUrl: '/modules/shared/default.html',
        controller: 'BankStabilizationFormController',
        resolve: {
          fields: function(Field, $route) {
            return Field.GetPreparedFields(commonscloud.collections.practice.templateId, 'object');
          },
          practice: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: $route.current.params.practiceId
            });
          },
          project: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId
            });
          },
          site: function(Feature, $route) {
            return Feature.GetFeature({
              storage: commonscloud.collections.site.storage,
              featureId: $route.current.params.siteId
            });
          },
          template: function(Template, $route) {
            return Template.GetTemplate(commonscloud.collections.practice.templateId);
          },
          user: function(User, $route) {
            return User.getUser({
              featureId: $route.current.params.projectId,
              templateId: commonscloud.collections.site.templateId
            });
          }
        }
      });

  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .service('BankStabilizationCalculate', function() {
    return {
      preInstallationSedimentLoad: function(value) {

        var baseLength = value.installation_length_of_streambank,
            ler = value.installation_lateral_erosion_rate,
            soilDensity = value.installation_soil_bulk_density,
            squareRoot = Math.sqrt((value.installation_eroding_bank_height*value.installation_eroding_bank_height)+(value.installation_eroding_bank_horizontal_width*value.installation_eroding_bank_horizontal_width)),
            loadTotal = baseLength*squareRoot*ler*soilDensity;

        return (loadTotal)/2000;
      },
      plannedSedimentLoadReduction: function(value) {

        var baseLength = value.installation_length_of_streambank,
            ler = (parseFloat(value.installation_lateral_erosion_rate)-0.02),
            soilDensity = value.installation_soil_bulk_density,
            squareRoot = Math.sqrt((value.installation_eroding_bank_height*value.installation_eroding_bank_height)+(value.installation_eroding_bank_horizontal_width*value.installation_eroding_bank_horizontal_width)),
            loadTotal = baseLength*squareRoot*ler*soilDensity;

        return (loadTotal)/2000;
      },
      installedSedimentLoadReduction: function(values, format) {

        var self = this,
            planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += self.plannedSedimentLoadReduction(reading);
          } else if (reading.measurement_period === 'Installation') {
            installed_total += self.plannedSedimentLoadReduction(reading);
          }

        });

        // Divide the Installed Total by the Planned Total to get a percentage of installed
        if (format === '%') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }

        return 0;
      },
      preInstallationNitrogenLoad: function(value) {

        var baseLength = value.installation_length_of_streambank,
            ler = value.installation_lateral_erosion_rate,
            soilDensity = value.installation_soil_bulk_density,
            soilNDensity = value.installation_soil_n_content,
            squareRoot = Math.sqrt((value.installation_eroding_bank_height*value.installation_eroding_bank_height)+(value.installation_eroding_bank_horizontal_width*value.installation_eroding_bank_horizontal_width)),
            loadTotal = baseLength*squareRoot*ler*soilDensity;

        return ((loadTotal)/2000)*soilNDensity;
      },
      plannedNitrogenLoadReduction: function(value) {

        var baseLength = value.installation_length_of_streambank,
            ler = (value.installation_lateral_erosion_rate-0.02),
            soilDensity = value.installation_soil_bulk_density,
            soilNDensity = value.installation_soil_n_content,
            squareRoot = Math.sqrt((value.installation_eroding_bank_height*value.installation_eroding_bank_height)+(value.installation_eroding_bank_horizontal_width*value.installation_eroding_bank_horizontal_width)),
            loadTotal = baseLength*squareRoot*ler*soilDensity;

        return ((loadTotal)/2000)*soilNDensity;
      },
      installedNitrogenLoadReduction: function(values, format) {

        var self = this,
            planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += self.plannedNitrogenLoadReduction(reading);
          } else if (reading.measurement_period === 'Installation') {
            installed_total += self.plannedNitrogenLoadReduction(reading);
          }

        });

        // Divide the Installed Total by the Planned Total to get a percentage of installed
        if (format === '%') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }

        return 0;
      },
      preInstallationPhosphorusLoad: function(value) {

        var baseLength = value.installation_length_of_streambank,
            ler = value.installation_lateral_erosion_rate,
            soilDensity = value.installation_soil_bulk_density,
            soilPDensity = value.installation_soil_p_content,
            squareRoot = Math.sqrt((value.installation_eroding_bank_height*value.installation_eroding_bank_height)+(value.installation_eroding_bank_horizontal_width*value.installation_eroding_bank_horizontal_width)),
            loadTotal = baseLength*squareRoot*ler*soilDensity;

        return ((loadTotal)/2000)*soilPDensity;
      },
      plannedPhosphorusLoadReduction: function(value) {

        var baseLength = value.installation_length_of_streambank,
            ler = (value.installation_lateral_erosion_rate-0.02),
            soilDensity = value.installation_soil_bulk_density,
            soilPDensity = value.installation_soil_p_content,
            squareRoot = Math.sqrt((value.installation_eroding_bank_height*value.installation_eroding_bank_height)+(value.installation_eroding_bank_horizontal_width*value.installation_eroding_bank_horizontal_width)),
            loadTotal = baseLength*squareRoot*ler*soilDensity;

        return ((loadTotal)/2000)*soilPDensity;
      },
      installedPhosphorusLoadReduction: function(values, format) {

        var self = this,
            planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += self.plannedPhosphorusLoadReduction(reading);
          } else if (reading.measurement_period === 'Installation') {
            installed_total += self.plannedPhosphorusLoadReduction(reading);
          }

        });

        // Divide the Installed Total by the Planned Total to get a percentage of installed
        if (format === '%') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }

        return 0;
      },
      milesStreambankRestored: function(value) {
        return (value.installation_length_of_streambank/5280);
      },
      milesStreambankInstalledFromPlan: function(values, format) {

        var planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += (reading.installation_length_of_streambank/5280);
          } else if (reading.measurement_period === 'Installation') {
            installed_total += (reading.installation_length_of_streambank/5280);
          }

        });

        // Divide the Installed Total by the Planned Total to get a percentage of installed
        if (format === '%') {
          percentage = (installed_total/planned_total);
          return (percentage*100);
        } else {
          return installed_total;
        }

        return 0;
      },
      quantityInstalled: function(values, field, format) {

        var planned_total = 0,
            installed_total = 0,
            percentage = 0;

        // Get readings organized by their Type
        angular.forEach(values, function(reading, $index) {

          if (reading.measurement_period === 'Planning') {
            planned_total += reading[field];
          } else if (reading.measurement_period === 'Installation') {
            installed_total += reading[field];
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
    };
  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('BankStabilizationReportController', function(BankStabilizationCalculate, commonscloud, Feature, fields, Landuse, $location, practice, project, readings, $rootScope, $route, $scope, site, Storage, template, Template, user) {

    /**
     * Define how we should handle individual Practice/Monitoring Readings
     * for the In-stream Habitat Practice
     *
     * @param add (function) Add an entirely new Reading to this practice instance
     */
     $scope.readings = {
       count: function(measurementPeriodName) {

         var total = 0;

         for (var i = 0; i < $scope.practice.readings.length; i++) {
           if ($scope.practice.readings[i].measurement_period === measurementPeriodName) {
             total++;
           }
         }

         return total;
       },
       all: function(existingReadings, readingId) {

         // Start by adding the newest relationships, then we'll add the existing sites
         var updatedReadings = [{
           id: readingId
         }];

         // Add all existing readings back to our newly updated array
         angular.forEach(existingReadings, function(reading, $index) {
           updatedReadings.push({
             id: reading.id
           });
         });

         // Return our revised and combined readings array
         return updatedReadings;
       },
       add: function(practice, readingType) {

         var reportDate = new Date();

         /**
          * Creating a practice reading is a two step process.
          *
          *  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
          *     for the Practice Reading table
          *  2. Update the Practice to create a relationship with the Reading created in step 1
          *
          * @todo When we implement the Enterprise we'll be remove the `status`
          *       defintion here. Allowing folks to set this or intercept this
          *       defeats the purpose of really having it to secure the system.
          *
          */
         Feature.CreateFeature({
           storage: $scope.storage.storage,
           data: {
             measurement_period: (readingType) ? readingType : null,
             report_date: reportDate,
             owner: $scope.user.id,
             status: 'private'
           }
         }).then(function(reportId) {

           var data = {};

           //
           // We need to make sure that we add the new reading to the existing
           // list of readings on this Pracitce Instance. if we don't submit
           // all old `id`s with the new `id` bad things happen. Our `POST`
           // needs the entire list of reading `id` in order to retain the
           // relationship between `Practice` instance <> `Reading` list
           //
           data[$scope.storage.storage] = $scope.readings.all(practice.readings, reportId);

           //
           // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
           // to submit all relationships that are created and should remain. If we only submit the new
           // ID the system will kick out the sites that were added previously.
           //
           Feature.UpdateFeature({
             storage: commonscloud.collections.practice.storage,
             featureId: practice.id,
             data: data
           }).then(function() {
             //
             // Once the new Reading has been associated with the existing Practice we need to
             // display the form to the user, allowing them to complete it.
             //
             $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
           });
         });
       }
     };

      /**
       * Ensures that all 'resolve' $promises are loaded into the page as
       * variables on the $scope. If they are not, you won't be able to access
       * them in the page templates
       *
       * @see $routeProvier.when.resolve
       *    https://docs.angularjs.org/api/ngRoute/provider/$routeProvider#when
       *
       */
      $scope.project = project;
      $scope.site = site;

      $scope.template = template;
      $scope.fields = fields;

      $scope.practice = practice;
      $scope.practice.practice_type = 'bank-stabilization';
      $scope.practice.readings = readings;
      $scope.practice_efficiency = null;

      $scope.storage = Storage[$scope.practice.practice_type];

      $scope.user = user;
      $scope.user.owner = false;
      $scope.user.feature = {};
      $scope.user.template = {};

      $scope.landuse = Landuse;

      $scope.total = {
        planning: $scope.readings.count('Planning'),
        installation: $scope.readings.count('Installation'),
        monitoring: $scope.readings.count('Monitoring')
      };

      $scope.calculate = BankStabilizationCalculate;

      /**
       * Defined the Page variables to load and display the page properly
       *
       * @param template (string) The name of the page template to load for this report
       * @param title (string) The title of the page
       * @param links (array) Defines the list of breadcrumbs across the top of the page
       * @param actions (array) Defines the 'action' buttons that appear in the top level beside the breadcrumbs (e.g., Add a Practice)
       * @param refresh (function) A generic page reload function
       */
      $rootScope.page = {
        template: '/modules/components/practices/views/practices--view.html',
        title: $scope.site.site_number + ' « ' + $scope.project.project_title,
        links: [
          {
            text: 'Projects',
            url: '/projects'
          },
          {
            text: $scope.project.project_title,
            url: '/projects/' + $scope.project.id,
          },
          {
            text: $scope.site.site_number,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
          },
          {
            text: $scope.practice.name,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
            type: 'active'
          }
        ],
        actions: [
          {
            type: 'button-link new',
            action: function() {
              $scope.readings.add($scope.practice);
            },
            text: 'Add Measurement Data'
          }
        ],
        refresh: function() {
          $route.reload();
        }
      };


      /**
       * Setup the User's page access and ensure that we are allowing them
       * to access page elements appropriate for their user role.
       *
       * [IF] the user account is already loaded and they are the owner, allow
       * them to go on their way without any further processing.
       *
       * [ELSE] If the user does not own this resource, we need to figure out if
       *        they are allowed to access this.
       *
       * @todo When we upgrade to the Enterprise level API we'll be able to get
       *       rid of large portions of this conditional statement. For now we
       *       need to do things this way because of how the CommonsCloud
       *       Community API is built.
       */
       if ($scope.user.id === $scope.project.owner) {
         $scope.user.owner = true;
       } else {
         Template.GetTemplateUser({
           storage: commonscloud.collections.project.storage,
           templateId: $scope.template.id,
           userId: $scope.user.id
         }).then(function(response) {

           $scope.user.template = response;

           //
           // If the user is not a Template Moderator or Admin then we need to do a final check to see
           // if there are permissions on the individual Feature
           //
           if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
             Feature.GetFeatureUser({
               storage: commonscloud.collections.project.storage,
               featureId: $route.current.params.projectId,
               userId: $scope.user.id
             }).then(function(response) {
               $scope.user.feature = response;
               if ($scope.user.feature.is_admin || $scope.user.feature.write) {
               } else {
                 $location.path('/projects/' + $route.current.params.projectId);
               }
             });
           }

         });
       }
  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .controller('BankStabilizationFormController', function(commonscloud, Feature, Field, fields, $location, practice, project, $rootScope, $route, $scope, site, Storage, template, Template, user) {

    /**
     * Ensures that all 'resolve' $promises are loaded into the page as
     * variables on the $scope. If they are not, you won't be able to access
     * them in the page templates
     *
     * @see $routeProvier.when.resolve
     *    https://docs.angularjs.org/api/ngRoute/provider/$routeProvider#when
     *
     */
     $scope.report = {};
     $scope.template = template;

     $scope.project = project;
     $scope.practice = practice;
     $scope.practice.practice_type = 'bank-stabilization';

     $scope.storage = Storage[$scope.practice.practice_type];

     $scope.site = site;
     $scope.user = user;
     $scope.user.owner = false;
     $scope.user.feature = {};
     $scope.user.template = {};

     $scope.options = {
       lerEvaluationTypes: [
         'BEHI/NBS',
         'Bank Erosion Pins',
         'Evaluation of Recession Severity Category',
         'Other'
       ]
     };


     /**
      *
      */
     Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
       $scope.fields = response;
     });

     Feature.GetFeature({
       storage: $scope.storage.storage,
       featureId: $route.current.params.reportId
     }).then(function(reportResponse) {

       //
       // Load the reading into the scope
       //
       $scope.report = reportResponse;

       $scope.report.template = $scope.storage.templates.form;
     });

     /**
      * Defined the Page variables to load and display the page properly
      *
      * @param template (string) The name of the page template to load for this reading
      * @param title (string) The title of the page
      * @param links (array) Defines the list of breadcrumbs across the top of the page
      * @param actions (array) Defines the 'action' buttons that appear in the top level beside the breadcrumbs (e.g., Add a Practice)
      * @param refresh (function) A generic page reload function
      */
     $rootScope.page = {
       template: '/modules/components/practices/views/practices--form.html',
       title: null,
       links: [
         {
           text: 'Projects',
           url: '/projects'
         },
         {
           text: $scope.project.project_title,
           url: '/projects/' + $scope.project.id,
         },
         {
           text: $scope.site.site_number,
           url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
         },
         {
           text: $scope.practice.name,
           url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type
         }
       ],
       actions: [
         {
           type: 'button-link',
           action: function($index) {
             $scope.reading.delete();
           },
           visible: false,
           loading: false,
           text: 'Delete Reading'
         },
         {
           type: 'button-link new',
           action: function($index) {
             $scope.reading.save();
             $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
           },
           visible: false,
           loading: false,
           text: 'Save Changes'
         }
       ],
       refresh: function() {
         $route.reload();
       }
     };

     /**
      * Setup the User's page access and ensure that we are allowing them
      * to access page elements appropriate for their user role.
      *
      * [IF] the user account is already loaded and they are the owner, allow
      * them to go on their way without any further processing.
      *
      * [ELSE] If the user does not own this resource, we need to figure out if
      *        they are allowed to access this.
      *
      * @todo When we upgrade to the Enterprise level API we'll be able to get
      *       rid of large portions of this conditional statement. For now we
      *       need to do things this way because of how the CommonsCloud
      *       Community API is built.
      */
      if ($scope.user.id === $scope.project.owner) {
        $scope.user.owner = true;
      } else {
        Template.GetTemplateUser({
          storage: commonscloud.collections.project.storage,
          templateId: $scope.template.id,
          userId: $scope.user.id
        }).then(function(response) {

          $scope.user.template = response;

          //
          // If the user is not a Template Moderator or Admin then we need to do a final check to see
          // if there are permissions on the individual Feature
          //
          if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
            Feature.GetFeatureUser({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId,
              userId: $scope.user.id
            }).then(function(response) {
              $scope.user.feature = response;
              if ($scope.user.feature.is_admin || $scope.user.feature.write) {
              } else {
                $location.path('/projects/' + $route.current.params.projectId);
              }
            });
          }

        });
      }

     /**
      * Define how we should handle individual Practice/Monitoring Readings
      * for the In-stream Habitat Form
      *
      * @param add (function) Add an entirely new Reading to this practice instance
      */
      $scope.reading = {
        save: function() {
          Feature.UpdateFeature({
            storage: $scope.storage.storage,
            featureId: $scope.report.id,
            data: $scope.report
          }).then(function(response) {
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
          }).then(function(error) {
            // Do something with the error
          });
        },
        delete: function() {
          //
          // Before we can remove the Practice we need to remove the relationship it has with the Site
          //
          //
          angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
            if (feature.id === $scope.report.id) {
              $scope.practice[$scope.storage.storage].splice($index, 1);
            }
          });

          Feature.UpdateFeature({
            storage: commonscloud.collections.practice.storage,
            featureId: $scope.practice.id,
            data: $scope.practice
          }).then(function(response) {

            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);

            /**
             * @todo We should be actually deleting the feature as displayed in
             *       the code below:
             *
             *         Feature.DeleteFeature({
             *           storage: $scope.storage.storage,
             *           featureId: $scope.report.id
             *         });
             *
             *       However, because of a weird permissions issue that breaks
             *       the endpoint in the existing version of CommonsAPI we
             *       cannot delete this because of the following error:
             *
             * IntegrityError: (IntegrityError) update or delete on table
             * "type_6800a0c907494118b9a8872a70ee26da" violates foreign key
             * constraint "type_6800a0c907494118b9a8872a70ee26da_users_feature_id_fkey"
             * on table "type_6800a0c907494118b9a8872a70ee26da_users"
             *
             *       This issue will be resolved through new permission usage
             *       on the NFWF Enterprise API, but will exist while we use the
             *       existing CommonsCloud API data models.
             *
             *       Our existing and bad fix is to simply "disassociated" the
             *       the Reading Feature from the Practice Feature without
             *       deleting the Feature from the system.
             */

          });
        }
      };

  });

(function() {

  'use strict';

  /**
   * @ngdoc overview
   * @name
   * @description
   */
  angular.module('FieldStack')
    .config(function($routeProvider, commonscloud) {

      $routeProvider
        .when('/projects/:projectId/sites/:siteId/practices/:practiceId/enhanced-stream-restoration', {
          templateUrl: '/modules/shared/default.html',
          controller: 'EnhancedStreamRestorationReportController',
          resolve: {
            user: function(User, $route) {
              return User.getUser({
                featureId: $route.current.params.projectId,
                templateId: commonscloud.collections.site.templateId
              });
            },
            project: function(Feature, $route) {
              return Feature.GetFeature({
                storage: commonscloud.collections.project.storage,
                featureId: $route.current.params.projectId
              });
            },
            template: function(Template, $route) {
              return Template.GetTemplate(commonscloud.collections.site.templateId);
            },
            fields: function(Field, $route) {
              return Field.GetPreparedFields(commonscloud.collections.site.templateId, 'object');
            },
            site: function(Feature, $route) {
              return Feature.GetFeature({
                storage: commonscloud.collections.site.storage,
                featureId: $route.current.params.siteId
              });
            },
            practice: function(Feature, $route) {
              return Feature.GetFeature({
                storage: commonscloud.collections.practice.storage,
                featureId: $route.current.params.practiceId
              });
            },
            readings: function(Storage, Feature, $route) {
              return Feature.GetRelatedFeatures({
                storage: commonscloud.collections.practice.storage,
                relationship: Storage['enhanced-stream-restoration'].storage,
                featureId: $route.current.params.practiceId
              });
            }
          }
        })
        .when('/projects/:projectId/sites/:siteId/practices/:practiceId/enhanced-stream-restoration/:reportId/edit', {
          templateUrl: '/modules/shared/default.html',
          controller: 'EnhancedStreamRestorationFormController',
          resolve: {
            user: function(User, $route) {
              return User.getUser({
                featureId: $route.current.params.projectId,
                templateId: commonscloud.collections.site.templateId
              });
            },
            project: function(Feature, $route) {
              return Feature.GetFeature({
                storage: commonscloud.collections.project.storage,
                featureId: $route.current.params.projectId
              });
            },
            site: function(Feature, $route) {
              return Feature.GetFeature({
                storage: commonscloud.collections.site.storage,
                featureId: $route.current.params.siteId
              });
            },
            practice: function(Feature, $route) {
              return Feature.GetFeature({
                storage: commonscloud.collections.practice.storage,
                featureId: $route.current.params.practiceId
              });
            },
            template: function(Template, $route) {
              return Template.GetTemplate(commonscloud.collections.practice.templateId);
            },
            fields: function(Field, $route) {
              return Field.GetPreparedFields(commonscloud.collections.practice.templateId, 'object');
            }
          }
        });

    });


}());

(function () {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('EnhancedStreamRestorationCalculate', function($q) {
      return {
        efficiency: {
          n_eff: 0.2,
          p_eff: 0.3,
          s_eff: 0.2
        },
        bankHeightRatio: function(bankHeight, bankfullHeight) {

          var behi = 0;

          if (bankHeight) {
            behi = (bankHeight/bankfullHeight);
          }

          return behi;

        },
        fractionRunoffTreatedByFloodplain: function(fractionInChannel, fractionRunoffTreated) {

          var fraction = 0;

          //
          // =(POWER(D73,2)+0.3*D73-0.98)*POWER(D74,2)+(-2.35*D73+2)*D74
          //
          if (fractionInChannel && fractionRunoffTreated) {
            fraction = (Math.pow(fractionInChannel, 2)+0.2*fractionInChannel-0.98)*Math.pow(fractionRunoffTreated,2)+(-2.35*fractionInChannel+2)*fractionRunoffTreated;
          }

          return fraction;

        },
        plannedNitrogenProtocol2LoadReduction: function(value, loaddata) {

          var self = this,
              bulkDensity = 125,
              nitrogen = 0,
              leftBehi = self.bankHeightRatio(value.project_left_bank_height, value.left_bank_bankfull_height),
              rightBehi = self.bankHeightRatio(value.project_right_bank_height, value.right_bank_bankfull_height),
              leftBank = 0,
              rightBank = 0;

          //
          // Left Bank Modifier
          //
          if (leftBehi < 1.1) {
            leftBank = value.length_of_left_bank_with_improved_connectivity*(value.stream_width_at_mean_base_flow/2+5);
          }

          //
          // Right Bank Modifier
          //
          if (rightBehi < 1.1) {
            rightBank = value.length_of_right_bank_with_improved_connectivity*(value.stream_width_at_mean_base_flow/2+5);
          }

          //
          // =((IF(E64<1.1,E56*(E55/2+5),0)+IF(E65<1.1,E59*(E55/2+5),0))*5*$D63/2000)*0.000195*365
          //
          nitrogen = ((leftBank+rightBank)*5*bulkDensity/2000)*0.000195*365;

          return nitrogen;

        },
        installedNitrogenProtocol2LoadReduction: function(values, loaddata, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (values[$index].measurement_period === 'Planning') {
              planned += self.plannedNitrogenProtocol2LoadReduction(value, loaddata);
            }
            else if (values[$index].measurement_period === 'Installation') {
              installed += self.plannedNitrogenProtocol2LoadReduction(value, loaddata);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        plannedNitrogenProtocol3LoadReduction: function(value, loaddata, readings) {

          var self = this,
              nitrogen = 0,
              preProjectData = null;

          //
          // Before we move on we need to make sure we have the appropriate
          // pre-project data which impacts the rest of the calculation
          //
          angular.forEach(readings, function(value, $index) {
            if (readings[$index].measurement_period === 'Pre-Project') {
              preProjectData = value;
            }
          });

          //
          // =IF(E75>0,(E75-D75)*$B$43*(E71*$B$46+E72*$B$47),"")
          //
          if (preProjectData) {
            var plannedRunoffFraction = parseFloat(self.fractionRunoffTreatedByFloodplain(value.rainfall_depth_where_connection_occurs, value.floodplain_connection_volume)).toFixed(3),
                preprojectRunoffFraction = parseFloat(self.fractionRunoffTreatedByFloodplain(preProjectData.rainfall_depth_where_connection_occurs, preProjectData.floodplain_connection_volume)).toFixed(3);

            nitrogen = (plannedRunoffFraction-preprojectRunoffFraction)*self.efficiency.n_eff*(value.watershed_impervious_area*parseFloat(loaddata.impervious.tn_ual).toFixed(2)+value.watershed_pervious_area*parseFloat(loaddata.pervious.tn_ual).toFixed(2));
          }

          return nitrogen;

        },
        installedNitrogenProtocol3LoadReduction: function(values, loaddata, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (values[$index].measurement_period === 'Planning') {
              planned += self.plannedNitrogenProtocol3LoadReduction(value, loaddata, values);
            }
            else if (values[$index].measurement_period === 'Installation') {
              installed += self.plannedNitrogenProtocol3LoadReduction(value, loaddata, values);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        plannedPhosphorusProtocol3LoadReduction: function(value, loaddata, readings) {

          var self = this,
              phosphorus = 0,
              preProjectData = null;

          //
          // Before we move on we need to make sure we have the appropriate
          // pre-project data which impacts the rest of the calculation
          //
          angular.forEach(readings, function(value, $index) {
            if (readings[$index].measurement_period === 'Pre-Project') {
              preProjectData = value;
            }
          });

          //
          // =IF(E75>0,(E75-D75)*$B$43*(E71*$B$46+E72*$B$47),"")
          //
          if (preProjectData) {
            var plannedRunoffFraction = parseFloat(self.fractionRunoffTreatedByFloodplain(value.rainfall_depth_where_connection_occurs, value.floodplain_connection_volume)).toFixed(3),
                preprojectRunoffFraction = parseFloat(self.fractionRunoffTreatedByFloodplain(preProjectData.rainfall_depth_where_connection_occurs, preProjectData.floodplain_connection_volume)).toFixed(3);

            phosphorus = (plannedRunoffFraction-preprojectRunoffFraction)*self.efficiency.p_eff*(value.watershed_impervious_area*parseFloat(loaddata.impervious.tp_ual).toFixed(2)+value.watershed_pervious_area*parseFloat(loaddata.pervious.tp_ual).toFixed(2));
          }

          return phosphorus;

        },
        installedPhosphorusProtocol3LoadReduction: function(values, loaddata, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (values[$index].measurement_period === 'Planning') {
              planned += self.plannedPhosphorusProtocol3LoadReduction(value, loaddata, values);
            }
            else if (values[$index].measurement_period === 'Installation') {
              installed += self.plannedPhosphorusProtocol3LoadReduction(value, loaddata, values);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        plannedSedimentLoadReduction: function(value, loaddata, readings) {

          var self = this,
              sediment = 0,
              preProjectData = null;

          //
          // Before we move on we need to make sure we have the appropriate
          // pre-project data which impacts the rest of the calculation
          //
          angular.forEach(readings, function(value, $index) {
            if (readings[$index].measurement_period === 'Pre-Project') {
              preProjectData = value;
            }
          });

          //
          // =IF(E75>0,(E75-D75)*$B$43*(E71*$B$46+E72*$B$47),"")
          //
          if (preProjectData) {
            var plannedRunoffFraction = parseFloat(self.fractionRunoffTreatedByFloodplain(value.rainfall_depth_where_connection_occurs, value.floodplain_connection_volume)).toFixed(3),
                preprojectRunoffFraction = parseFloat(self.fractionRunoffTreatedByFloodplain(preProjectData.rainfall_depth_where_connection_occurs, preProjectData.floodplain_connection_volume)).toFixed(3);

            sediment = (plannedRunoffFraction-preprojectRunoffFraction)*self.efficiency.s_eff*(value.watershed_impervious_area*parseFloat(loaddata.impervious.tss_ual).toFixed(2)+value.watershed_pervious_area*parseFloat(loaddata.pervious.tss_ual).toFixed(2))/2000;
          }

          return sediment;

        },
        installedSedimentLoadReduction: function(values, loaddata, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (values[$index].measurement_period === 'Planning') {
              planned += self.plannedSedimentLoadReduction(value, loaddata, values);
            }
            else if (values[$index].measurement_period === 'Installation') {
              installed += self.plannedSedimentLoadReduction(value, loaddata, values);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        milesOfStreambankRestored: function(value) {

          var self = this,
              miles = 0,
              leftBehi = self.bankHeightRatio(value.project_left_bank_height, value.left_bank_bankfull_height),
              rightBehi = self.bankHeightRatio(value.project_right_bank_height, value.right_bank_bankfull_height),
              leftBank = 0,
              rightBank = 0;

          //
          // Left Bank Modifier
          //
          if (leftBehi < 1.1) {
            leftBank = value.length_of_left_bank_with_improved_connectivity;
          }

          //
          // Right Bank Modifier
          //
          if (rightBehi < 1.1) {
            rightBank = value.length_of_right_bank_with_improved_connectivity;
          }

          //
          // =(IF(E64<1.1,E56,0)+IF(E65<1.1,E59,0)+E68)/5280
          //
          console.log('leftBank', leftBank, 'rightBank', rightBank, 'value.stream_length_reconnected_at_floodplain', value.stream_length_reconnected_at_floodplain);
          miles = ((leftBank+rightBank+value.stream_length_reconnected_at_floodplain)/5280);

          return miles;

        },
        milesOfStreambankRestoredInstalled: function(values, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (values[$index].measurement_period === 'Planning') {
              planned += self.milesOfStreambankRestored(value);
            }
            else if (values[$index].measurement_period === 'Installation') {
              installed += self.milesOfStreambankRestored(value);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        acresTreated: function(value) {

          var self = this,
              acres = 0,
              leftBehi = self.bankHeightRatio(value.project_left_bank_height, value.left_bank_bankfull_height),
              rightBehi = self.bankHeightRatio(value.project_right_bank_height, value.right_bank_bankfull_height),
              leftBank = 0,
              rightBank = 0;

          //
          // Left Bank Modifier
          //
          if (leftBehi < 1.1) {
            leftBank = value.length_of_left_bank_with_improved_connectivity;
          }

          //
          // Right Bank Modifier
          //
          if (rightBehi < 1.1) {
            rightBank = value.length_of_right_bank_with_improved_connectivity;
          }

          //
          // =(
          //   IF(E64<1.1,E56*(E55/2+5),0)
          //  +IF(E65<1.1,E59*(E55/2+5),0)
          // )/43560
          //
          acres = (((leftBank*(value.stream_width_at_mean_base_flow/2+5))+(rightBank*(value.stream_width_at_mean_base_flow/2+5))+value.stream_length_reconnected_at_floodplain)/43560);

          return acres;

        },
        acresTreatedInstalled: function(values, format) {

          var installed = 0,
              planned = 0,
              self = this;

          angular.forEach(values, function(value, $index) {
            if (values[$index].measurement_period === 'Planning') {
              planned += self.acresTreated(value);
            }
            else if (values[$index].measurement_period === 'Installation') {
              installed += self.acresTreated(value);
            }
          });

          var percentage_installed = installed/planned;

          return (format === '%') ? (percentage_installed*100) : installed;
        },
        quantityInstalled: function(values, field, format) {

          console.log('quantityInstalled', field, values)

          var planned_total = 0,
              installed_total = 0,
              percentage = 0;

          // Get readings organized by their Type
          angular.forEach(values, function(reading, $index) {
            if (reading.measurement_period === 'Planning') {
              console.log('loop > planned_total', reading[field])
              planned_total += reading[field];
            } else if (reading.measurement_period === 'Installation') {
              console.log('loop > installed_total', reading[field])
              installed_total += reading[field];
            }

          });

          // Divide the Installed Total by the Planned Total to get a percentage of installed
          if (planned_total) {
            console.log('something to show');
            if (format === '%') {
              percentage = (installed_total/planned_total);
              console.log('percentage', (percentage*100));
              return (percentage*100);
            } else {
              console.log('installed_total', installed_total);
              return installed_total;
            }
          }

          return 0;
        }
      };
    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name
   * @description
   */
  angular.module('FieldStack')
    .controller('EnhancedStreamRestorationReportController', function ($rootScope, $scope, $route, $location, $timeout, $http, $q, user, Template, Feature, Field, template, project, site, practice, readings, commonscloud, Storage, Landuse, EnhancedStreamRestorationCalculate, Calculate, StateLoad) {

      //
      // Assign project to a scoped variable
      //
      $scope.project = project;
      $scope.site = site;

      $scope.template = template;

      $scope.practice = practice;
      $scope.practice.practice_type = 'enhanced-stream-restoration';
      $scope.practice.readings = readings;

      $scope.practice_efficiency = {
        n_eff: 0.2,
        p_eff: 0.3,
        s_eff: 0.2
      };

      $scope.storage = Storage[$scope.practice.practice_type];

      $scope.user = user;
      $scope.user.owner = false;
      $scope.user.feature = {};
      $scope.user.template = {};

      $scope.landuse = Landuse;
      $scope.calculate = EnhancedStreamRestorationCalculate;

      Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
        $scope.fields = response;
      });

      //
      // Retrieve State-specific Load Data
      //
      StateLoad.query({
        q: {
          filters: [
            {
              name: 'state',
              op: 'eq',
              val: $scope.site.site_state
            }
          ]
        }
      }, function(response) {
        $scope.loaddata = {};

        angular.forEach(response.response.features, function(feature, $index) {
          $scope.loaddata[feature.developed_type] = {
            tn_ual: feature.tn_ual,
            tp_ual: feature.tp_ual,
            tss_ual: feature.tss_ual
          };
        });

      });


      //
      //
      //
      $scope.GetTotal = function(period) {

        var total = 0;

        for (var i = 0; i < $scope.practice.readings.length; i++) {
          if ($scope.practice.readings[i].measurement_period === period) {
            total++;
          }
        }

        return total;
      };

      $scope.total = {
        preproject: $scope.GetTotal('Pre-Project'),
        planning: $scope.GetTotal('Planning'),
        installation: $scope.GetTotal('Installation'),
        monitoring: $scope.GetTotal('Monitoring')
      };

      console.log('$scope.total', $scope.total);

      //
      // Load Land river segment details
      //
      Feature.GetFeature({
        storage: commonscloud.collections.land_river_segment.storage,
        featureId: $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0].id
      }).then(function(response) {
        $scope.site.type_f9d8609090494dac811e6a58eb8ef4be[0] = response;
      });

      $scope.readings = {
        bufferWidth: function() {
          for (var i = 0; i < $scope.practice.readings.length; i++) {
            if ($scope.practice.readings[i].measurement_period === 'Planning') {
              return $scope.practice.readings[i].average_width_of_buffer;
            }
          }
        },
        add: function(practice, readingType) {

          var reportDate = new Date();

          //
          // Creating a practice reading is a two step process.
          //
          //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
          //     for the Practice Reading table
          //  2. Update the Practice to create a relationship with the Reading created in step 1
          //
          console.log('reportDate', reportDate, angular.isDate(reportDate), typeof reportDate);

          Feature.CreateFeature({
            storage: $scope.storage.storage,
            data: {
              measurement_period: (readingType) ? readingType : null,
              report_date: reportDate,
              owner: $scope.user.id,
              status: 'private'
            }
          }).then(function(reportId) {

            var data = {};
            data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

            //
            // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
            // to submit all relationships that are created and should remain. If we only submit the new
            // ID the system will kick out the sites that were added previously.
            //
            Feature.UpdateFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: practice.id,
              data: data
            }).then(function() {
              //
              // Once the new Reading has been associated with the existing Practice we need to
              // display the form to the user, allowing them to complete it.
              //
              $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
            });
          });
        },
        addReading: function(practice, readingType) {
          //
          // Creating a practice reading is a two step process.
          //
          //  1. Create the new Practice Reading feature, including the owner and a new UserFeatures entry
          //     for the Practice Reading table
          //  2. Update the Practice to create a relationship with the Reading created in step 1
          //
          Feature.CreateFeature({
            storage: $scope.storage.storage,
            data: {
              measurement_period: (readingType) ? readingType : null,
              report_date: new Date(),
              owner: $scope.user.id,
              status: 'private'
            }
          }).then(function(reportId) {

            var data = {};
            data[$scope.storage.storage] = $scope.GetAllReadings(practice.readings, reportId);

            //
            // Create the relationship with the parent, Practice, to ensure we're doing this properly we need
            // to submit all relationships that are created and should remain. If we only submit the new
            // ID the system will kick out the sites that were added previously.
            //
            Feature.UpdateFeature({
              storage: commonscloud.collections.practice.storage,
              featureId: practice.id,
              data: data
            }).then(function() {
              //
              // Once the new Reading has been associated with the existing Practice we need to
              // display the form to the user, allowing them to complete it.
              //
              $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + reportId + '/edit');
            });
          });
        }
      };

      //
      // Setup basic page variables
      //
      $rootScope.page = {
        template: '/modules/components/practices/views/practices--view.html',
        title: $scope.site.site_number + ' « ' + $scope.project.project_title,
        links: [
          {
            text: 'Projects',
            url: '/projects'
          },
          {
            text: $scope.project.project_title,
            url: '/projects/' + $scope.project.id,
          },
          {
            text: $scope.site.site_number,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
          },
          {
            text: $scope.practice.name,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type,
            type: 'active'
          }
        ],
        actions: [
          {
            type: 'button-link new',
            action: function() {
              $scope.readings.add($scope.practice);
            },
            text: 'Add Measurement Data'
          }
        ],
        refresh: function() {
          $route.reload();
        }
      };


      $scope.GetAllReadings = function(existingReadings, readingId) {

        var updatedReadings = [{
          id: readingId // Start by adding the newest relationships, then we'll add the existing sites
        }];

        angular.forEach(existingReadings, function(reading, $index) {
          updatedReadings.push({
            id: reading.id
          });
        });

        return updatedReadings;
      };


      //
      // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
      // backend functionality. Even if the user guesses the URL the API will stop them from editing the
      // actual Feature within the system
      //
      if ($scope.user.id === $scope.project.owner) {
        $scope.user.owner = true;
      } else {
        Template.GetTemplateUser({
          storage: commonscloud.collections.project.storage,
          templateId: $scope.template.id,
          userId: $scope.user.id
        }).then(function(response) {

          $scope.user.template = response;

          //
          // If the user is not a Template Moderator or Admin then we need to do a final check to see
          // if there are permissions on the individual Feature
          //
          if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
            Feature.GetFeatureUser({
              storage: commonscloud.collections.project.storage,
              featureId: $route.current.params.projectId,
              userId: $scope.user.id
            }).then(function(response) {
              $scope.user.feature = response;
              if ($scope.user.feature.is_admin || $scope.user.feature.write) {
              } else {
                $location.path('/projects/' + $route.current.params.projectId);
              }
            });
          }

        });
      }
    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name
   * @description
   */
  angular.module('FieldStack')
    .controller('EnhancedStreamRestorationFormController', function ($rootScope, $scope, $route, $location, user, Template, Field, Feature, Storage, template, project, site, practice, commonscloud) {

      //
      // Assign project to a scoped variable
      //
      $scope.template = template;

      $scope.report = {};

      $scope.project = project;
      $scope.practice = practice;
      $scope.practice.practice_type = 'enhanced-stream-restoration';

      $scope.storage = Storage[$scope.practice.practice_type];

      $scope.site = site;
      $scope.user = user;
      $scope.user.owner = false;
      $scope.user.feature = {};
      $scope.user.template = {};

      $scope.save = function() {
        Feature.UpdateFeature({
          storage: $scope.storage.storage,
          featureId: $scope.report.id,
          data: $scope.report
        }).then(function(response) {
          $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
        }).then(function(error) {
          // Do something with the error
        });
      };

      $scope.delete = function() {

        //
        // Before we can remove the Practice we need to remove the relationship it has with the Site
        //
        //
        angular.forEach($scope.practice[$scope.storage.storage], function(feature, $index) {
          if (feature.id === $scope.report.id) {
            $scope.practice[$scope.storage.storage].splice($index, 1);
          }
        });

        Feature.UpdateFeature({
          storage: commonscloud.collections.practice.storage,
          featureId: $scope.practice.id,
          data: $scope.practice
        }).then(function(response) {

          //
          // Now that the Project <> Site relationship has been removed, we can remove the Site
          //
          Feature.DeleteFeature({
            storage: $scope.storage.storage,
            featureId: $scope.report.id
          }).then(function(response) {
            $location.path('/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type);
          });

        });

      };

      Field.GetPreparedFields($scope.storage.templateId, 'object').then(function(response) {
        $scope.fields = response;
      });

      Feature.GetFeature({
        storage: $scope.storage.storage,
        featureId: $route.current.params.reportId
      }).then(function(report) {

        //
        // Load the reading into the scope
        //
        $scope.report = report;

        console.log('report', report);

        $scope.report.template = $scope.storage.templates.form;

        //
        // Add the reading information to the breadcrumbs
        //
        var page_title = 'Editing the ' + $scope.report.measurement_period + ' Report';

        $rootScope.page.links.push({
          text: page_title,
          url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + $scope.practice.practice_type + '/' + $scope.report.id + '/edit'
        });

        $rootScope.page.title = page_title;

      });

      //
      // Setup basic page variables
      //
      $rootScope.page = {
        template: '/modules/components/practices/views/practices--form.html',
        title: null,
        links: [
          {
            text: 'Projects',
            url: '/projects'
          },
          {
            text: $scope.project.project_title,
            url: '/projects/' + $scope.project.id,
          },
          {
            text: $scope.site.site_number,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id
          },
          {
            text: $scope.practice.name,
            url: '/projects/' + $scope.project.id + '/sites/' + $scope.site.id + '/practices/' + $scope.practice.id + '/' + Feature.MachineReadable($scope.practice.practice_type)
          }
        ],
        actions: [
          {
            type: 'button-link',
            action: function($index) {
              $scope.delete();
            },
            visible: false,
            loading: false,
            text: 'Delete Report'
          },
          {
            type: 'button-link new',
            action: function($index) {
              $scope.save();
              $scope.page.actions[$index].loading = ! $scope.page.actions[$index].loading;
            },
            visible: false,
            loading: false,
            text: 'Save Changes'
          }
        ],
        refresh: function() {
          $route.reload();
        }
      };

      //
      // Determine whether the Edit button should be shown to the user. Keep in mind, this doesn't effect
      // backend functionality. Even if the user guesses the URL the API will stop them from editing the
      // actual Feature within the system
      //
      if ($scope.user.id === $scope.project.owner) {
        $scope.user.owner = true;
      } else {
        Template.GetTemplateUser({
          storage: $scope.storage.storage,
          templateId: $scope.template.id,
          userId: $scope.user.id
        }).then(function(response) {

          $scope.user.template = response;

          //
          // If the user is not a Template Moderator or Admin then we need to do a final check to see
          // if there are permissions on the individual Feature
          //
          if (!$scope.user.template.is_admin || !$scope.user.template.is_moderator) {
            Feature.GetFeatureUser({
              storage: $scope.storage.storage,
              featureId: $scope.report.id,
              userId: $scope.user.id
            }).then(function(response) {
              $scope.user.feature = response;
            });
          }

        });
      }

    });

}());

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.CommonsCloud
 * @description
 * # Site
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .constant('commonscloud', {
    baseurl: 'https://api.commonscloud.org/v2/',
    collections: {
      project: {
        templateId: 121,
        storage: 'type_061edec30db54fa0b96703b40af8d8ca'
      },
      site: {
        templateId: 122,
        storage: 'type_646f23aa91a64f7c89a008322f4f1093'
      },
      practice: {
        templateId: 123,
        storage: 'type_77f5c44516674e8da2532939619759dd'
      },
      land_river_segment: {
        templateId: 272,
        storage: 'type_f9d8609090494dac811e6a58eb8ef4be'
      },
      loaddata: {
        templateId: 282,
        storage: 'type_3fbea3190b634d0c9021d8e67df84187'
      },
      stateloaddata: {
        templateId: 379,
        storage: 'type_053d71f4258746ceb0bef2d914c97876'
      }
    }
  });

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.GeometryService
 * @description
 *   
 */
angular.module('FieldStack')
  .service('commonsGeometry', ['$http', 'commonscloud', 'leafletData', function Navigation($http, commonscloud, leafletData) {
    return {
      drawGeoJSON: function(geojson, featureGroup) {

        var self = this;

        leafletData.getMap().then(function(map) {
          //
          // Reset the FeatureGroup because we don't want multiple parcels drawn on the map
          //
          map.removeLayer(featureGroup);

          //
          // Convert the GeoJSON to a layer and add it to our FeatureGroup
          //
          // $scope.geojsonToLayer(geojson, featureGroup);
          self.geojsonToLayer(geojson, featureGroup);

          //
          // Add the FeatureGroup to the map
          //
          map.addLayer(featureGroup);
        });
      },
      /**
       * Convert a valid GeoJSON object to a valid Leaflet/Mapbox layer so that
       * it can be displayed on a Leaflet Map
       *
       * @param (object) geojsonObject
       *    A valid GeoJson object
       *
       *    @see http://geojson.org/geojson-spec.html#geojson-objects
       *
       * @param (object) targetLayer
       *    A valid Leaflet LayerGroup or FeatureGroup
       *
       *    @see http://leafletjs.com/reference.html#layergroup
       *    @see http://leafletjs.com/reference.html#featuregroup
       *
       * @param (object) layerStyle
       *
       * @param (boolean) appendToLayer
       *    If set to `true` the object will be appended to the Group and keep
       *    all the other objects that alread exist within the provided Group,
       *    defaults to clearning all content from provided Group
       *
       * @return (implicit)
       *    Adds the requested GeoJSON to the provided layer
       *
       * @required This function requires that Leaflet be loaded into this
       *           application and depends on the AngularLeafletDirective
       *
       */
      geojsonToLayer: function(geojsonObject, targetLayer, layerStyle, appendToLayer) {

        //
        // Should this GeoJSON object be appended to all existing Features or
        // should it replace all other objects?
        //
        // Defaults to clearing the layer and adding only the new geojsonObject
        // defined in the function arguments
        //
        if (!appendToLayer) {
          targetLayer.clearLayers();
        }

        //
        // Determine if the user has defined styles to be applied to this layer
        // if not, then use our default polygon outline
        //
        layerStyle = (layerStyle) ? layerStyle: {
          stroke: true,
          fill: false,
          weight: 3,
          opacity: 1,
          color: 'rgb(255,255,255)',
          lineCap: 'square'
        };

        //
        // Make sure the GeoJSON object is added to the layer with appropriate styles
        //
        L.geoJson(geojsonObject, {
          style: layerStyle
        }).eachLayer(function(newLayer) {
          newLayer.addTo(targetLayer);
        });

      },
      /**
       * Retrieve a list of possible matching geometries based on user defined
       * geometry passed from application
       *
       * @param (array) requestedLocation
       *    A simple object containing a longitude and latitude.
       *
       *    @see http://leafletjs.com/reference.html#latlng-l.latlng
       *
       * @return (object) featureCollection
       *    A valid GeoJSON Feature Collection containing a list of matched
       *    addresses and their associated geographic information
       *
       */
      intersects: function(requestedLocation, collection) {

        //
        // Check to make sure that the string is not empty prior to submitting
        // it to the Mapbox Geocoding API
        //
        if (!requestedLocation) {
          return;
        }

        //
        // Created a valid Mapbox Geocoding API compatible URL
        //
        var ccGeometryAPI = commonscloud.baseurl.concat(collection, '/', 'intersects', '.geojson');

        //
        // Send a GET request to the Mapbox Geocoding API containing valid user
        // input
        //
        var promise = $http.get(ccGeometryAPI, {
          params: {
            'callback': 'JSON_CALLBACK',
            'geometry': requestedLocation.lng + ' ' + requestedLocation.lat
          }
        })
          .success(function(featureCollection) {
            return featureCollection;
          })
          .error(function(data) {
            console.error('CommonsCloud Geospatial API could not return any results based on your input', data, requestedLocation);
          });

        //
        // Always return Requests in angular.services as a `promise`
        //
        return promise;
      },
    };
  }]);

'use strict';

/**
 * @ngdoc service
 * @name managerApp.directive:Map
 * @description
 *   Assist Directives in loading templates
 */
angular.module('FieldStack')
  .service('Map', ['mapbox', function (mapbox) {

    var self = this;

    var Map = {
      defaults: {
        scrollWheelZoom: false,
        maxZoom: 19
      },
      layers: {
        baselayers: {
          basemap: {
            name: 'Satellite Imagery',
            url: 'https://{s}.tiles.mapbox.com/v3/' + mapbox.map_id + '/{z}/{x}/{y}.png',
            type: 'xyz',
            layerOptions: {
              attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>'
            }
          }
        }
      },
      center: {
        lng: -76.534, 
        lat: 39.134,
        zoom: 11
      },
      styles: {
        icon: {
          parcel: {
            iconUrl: '/images/pin-l+cc0000.png?access_token=' + mapbox.access_token,
            iconRetinaUrl: '/images/pin-l+cc0000@2x.png?access_token=' + mapbox.access_token,
            iconSize: [35, 90],
            iconAnchor: [18, 44],
            popupAnchor: [0, 0]
          }
        },
        polygon: {
          parcel: {
            stroke: true,
            fill: false,
            weight: 3,
            opacity: 1,
            color: 'rgb(255,255,255)',
            lineCap: 'square'
          },
          canopy: {
            stroke: false,
            fill: true,
            weight: 3,
            opacity: 1,
            color: 'rgb(0,204,34)',
            lineCap: 'square',
            fillOpacity: 0.6
          },
          impervious: {
            stroke: false,
            fill: true,
            weight: 3,
            opacity: 1,
            color: 'rgb(204,0,0)',
            lineCap: 'square',
            fillOpacity: 0.6
          }
        }
      },
      geojson: {}
    };
    
    return Map;
  }]);
'use strict';

/*jshint camelcase: false */

/**
 * @ngdoc directive
 * @name managerApp.directive:mapboxGeocoder
 * @description
 *   The Mapbox Geocoder directive enables developers to quickly add inline
 *   geocoding capabilities to any HTML <input> or <textarea>
 */
angular.module('FieldStack')
  .directive('mapboxGeocoder', ['$compile', '$http', '$templateCache', '$timeout', 'mapbox', 'geocoding', 'TemplateLoader', function ($compile, $http, $templateCache, $timeout, mapbox, geocoding, TemplateLoader) {

    return {
        restrict: 'A',
        scope: {
          mapboxGeocoderDirection: '=?',
          mapboxGeocoderQuery: '=',
          mapboxGeocoderResponse: '=',
          mapboxGeocoderResults: '=?',
          mapboxGeocoderAppend: '=?'
        },
        link: function(scope, element, attrs) {

          //
          // Setup up our timeout and the Template we will use for display the
          // results from the Mapbox Geocoding API back to the user making the
          // Request
          //
          var timeout;

          //
          // Take the template that we loaded into $templateCache and pull
          // out the HTML that we need to create our drop down menu that
          // holds our Mapbox Geocoding API results
          //
          TemplateLoader.get('/modules/shared/mapbox/geocoderResults--view.html')
            .success(function(templateResult) {
              element.after($compile(templateResult)(scope));
            });

          //
          // This tells us if we are using the Forward, Reverse, or Batch
          // Geocoder provided by the Mapbox Geocoding API
          //
          scope.mapboxGeocoderDirection = (scope.mapboxGeocoderDirection) ? scope.mapboxGeocoderDirection: 'forward';

          //
          // Keep an eye on the Query model so that when it's updated we can
          // execute a the Reuqest agains the Mapbox Geocoding API
          //
          scope.$watch('mapboxGeocoderQuery', function(query) {

            var query_ = (scope.mapboxGeocoderAppend) ? query + ' ' + scope.mapboxGeocoderAppend : query;

            //
            // If the user types, make sure we cancel and restart the timeout
            //
            $timeout.cancel(timeout);

            //
            // If the user stops typing for 500 ms then we need to go ahead and
            // execute the query against the Mapbox Geocoding API
            //
            timeout = $timeout(function () {

              //
              // The Mapbox Geocoding Service in our application provides us
              // with a deferred promise with our Mapbox Geocoding API request
              // so that we can handle the results of that request however we
              // need to.
              //
              if (query && !scope.mapboxGeocoderResponse) {
                var results = geocoding[scope.mapboxGeocoderDirection](query_).success(function(results) {
                  scope.mapboxGeocoderResults = results;
                });
              }

            }, 500);

          });

          //
          // Geocoded Address Selection
          //
          scope.address = {
            select: function(selectedValue) {

              //
              // Assign the selected value to back to our scope. The developer
              // should be able to use the results however they like. For
              // instance they may need to use the `Response` from this request
              // to perform a query against another database for geolookup or
              // save this value to the database.
              //
              scope.mapboxGeocoderQuery = selectedValue.place_name;
              scope.mapboxGeocoderResponse = selectedValue;

              //
              // Once we're finished we need to make sure we empty the result
              // list. An empty result list will be hidden.
              //
              scope.mapboxGeocoderResults = null;
            }
          };

        }
    };
  }]);

'use strict';

/**
 * @ngdoc service
 *
 * @name FieldStack.Geocode
 *
 * @description
 *   The Geocode Service provides access to the Mapbox Geocoding API
 *
 * @see https://www.mapbox.com/developers/api/geocoding/
 */
angular.module('FieldStack')
  .service('geocoding', ['$http', 'mapbox', function Navigation($http, mapbox) {
    return {

      /**
       * Retrieve a list of possible geocoded address from the Mapbox Geocoding
       * API, based on user input.
       *
       * @param (string) requestedLocation
       *    A simple string containing the information you wish to check
       *    against the Mapbox Geocoding API
       *
       * @return (object) featureCollection
       *    A valid GeoJSON Feature Collection containing a list of matched
       *    addresses and their associated geographic information
       *
       * @see https://www.mapbox.com/developers/api/geocoding/
       *
       */
      forward: function(requestedLocation) {

        //
        // Check to make sure that the string is not empty prior to submitting
        // it to the Mapbox Geocoding API
        //
        if (!requestedLocation) {
          return;
        }

        //
        // Created a valid Mapbox Geocoding API compatible URL
        //
        var mapboxGeocodingAPI = mapbox.geocodingUrl.concat(requestedLocation, '.json');

        //
        // Send a GET request to the Mapbox Geocoding API containing valid user
        // input
        //
        var promise = $http.get(mapboxGeocodingAPI, {
          params: {
            'callback': 'JSON_CALLBACK',
            'access_token': mapbox.access_token
          },
          headers: {
            'Authorization': 'external'
          }
        })
          .success(function(featureCollection) {
            return featureCollection;
          })
          .error(function(data) {
            console.error('Mapbox Geocoding API could not return any results based on your input', data);
          });

        //
        // Always return Requests in angular.services as a `promise`
        //
        return promise;
      },

      /**
       * Retrieve a list of possible addresses from the Mapbox Geocoding
       * API, based on user input.
       *
       * @param (array) requestedCoordinates
       *    A two value array containing the longitude and latitude respectively
       *    
       *    Example:
       *    [
       *       '<LONGITUDE>',
       *       '<LATITUDE>',
       *    ]
       *
       * @return (object) featureCollection
       *    A valid GeoJSON Feature Collection containing a list of matched
       *    addresses and their associated geographic information
       *
       * @see https://www.mapbox.com/developers/api/geocoding/
       *
       */
      reverse: function(requestedCoordinates) {

        //
        // Check to make sure that the string is not empty prior to submitting
        // it to the Mapbox Geocoding API
        //
        if (!requestedCoordinates) {
          return;
        }

        //
        // Created a valid Mapbox Geocoding API compatible URL
        //
        var mapboxGeocodingAPI = mapbox.geocodingUrl.concat(requestedCoordinates[0], ',', requestedCoordinates[1], '.json');

        //
        // Send a GET request to the Mapbox Geocoding API containing valid user
        // input
        //
        var promise = $http.get(mapboxGeocodingAPI, {
          params: {
            'callback': 'JSON_CALLBACK',
            'access_token': mapbox.access_token
          }
        })
          .success(function(featureCollection) {
            //
            // Return the valid GeoJSON FeatureCollection sent by Mapbox to
            // the module requesting the data with this Service
            //
            return featureCollection;
          })
          .error(function(data) {
            console.error('Mapbox Geocoding API could not return any results based on your input', data);
          });

        //
        // Always return Requests in angular.services as a `promise`
        //
        return promise;
      },

      /**
       * Retrieve a list of possible geocoded address from the Mapbox Geocoding
       * API, based on user input.
       *
       * @param (array) requestedQueries
       *    An array of up to 50 queries to perform. Each individual query
       *    should be a simple string containing the information you wish to
       *    check against the Mapbox Geocoding API
       *
       * @return (object) featureCollection
       *    A valid GeoJSON Feature Collection containing a list of matched
       *    addresses and their associated geographic information
       *
       * @see https://www.mapbox.com/developers/api/geocoding/
       *
       */
      batch: function(requestedQueries) {
        console.warning('Mapbox Geocoding Batch Geocoding not implemented, see https://www.mapbox.com/developers/api/geocoding/ for more information.');
      }
    };

  }]);

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.Site
 * @description
 * # Site
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .constant('mapbox', {
    geocodingUrl: 'https://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/',
    access_token: 'pk.eyJ1IjoiZGV2ZWxvcGVkc2ltcGxlIiwiYSI6IlZGVXhnM3MifQ.Q4wmA49ggy9i1rLr8-Mc-w',
    satellite: 'developedsimple.k105bd34',
    terrain: 'developedsimple.k1054a50',
    street: 'developedsimple.k1057ndn',
  });

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name 
   * @description
   */
  angular.module('FieldStack')
    .service('Account', function (ipCookie, User) {

      var Account = {
        userObject: {}
      };

      Account.getUser = function() {

        var userId = ipCookie('FIELDSTACKIO_CURRENTUSER');

        if (!userId) {
          return false;
        }

        var $promise = User.get({
          id: userId
        });

        return $promise;
      };

      Account.setUserId = function() {
        var $promise = User.me(function(accountResponse) {

          ipCookie('FIELDSTACKIO_CURRENTUSER', accountResponse.id, {
            path: '/',
            expires: 2
          });

          return accountResponse.id;
        });

        return $promise;
      };

      Account.hasToken = function() {
        if (ipCookie('FIELDSTACKIO_CURRENTUSER') && ipCookie('FIELDSTACKIO_SESSION')) {
          return true;
        }

        return false;
      };

      Account.hasRole = function(roleNeeded) {

        var roles = this.userObject.properties.roles;

        if (!roles) {
          return false;
        }

        for (var index = 0; index < roles.length; index++) {
          if (roleNeeded === roles[index].properties.name) {
            return true;
          }
        }

        return false;
      };

      Account.inGroup = function(userId, group) {

            var return_ = false;

            angular.forEach(group, function(member) {
                console.log(member.id, userId);

                if (member.id === userId) {
                    return_ = true;
                }
            });

            return return_;
      };

      Account.canEdit = function(resource) {
        if (Account.userObject && !Account.userObject.id) {
            console.log('Account.userObject', Account.userObject);
            return false;
        }
        
        if (Account.hasRole('admin')) {
            console.log('admin');
            return true;
        } else if (Account.hasRole('manager') && Account.inGroup(resource.properties.account_id, Account.userObject.properties.account)) {
            console.log('manager');
            return true;
        } else if (Account.hasRole('grantee') && (Account.userObject.id === resource.properties.creator_id || Account.inGroup(Account.userObject.id, resource.properties.members))) {
            console.log('grantee');
            return true;
        }

        return false;
      };

      return Account;
    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('Practice', function (environment, Preprocessors, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/practice/:id'), {
        'id': '@id'
      }, {
        'query': {
          'isArray': false
        },
        'update': {
          method: 'PATCH',
          transformRequest: function(data) {
            var feature = Preprocessors.geojson(data);
            return angular.toJson(feature);
          }
        },
        'urbanHomeowner': {
          'method': 'GET',
          'url': environment.apiUrl.concat('/v1/data/practice/:id/readings_urban_homeowner'),
          'isArray': false
        }
      });
    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('PracticeUrbanHomeowner', function (environment, Preprocessors, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/bmp-urban-homeowner/:id'), {
        'id': '@id'
      }, {
        'query': {
          isArray: false
        },
        'update': {
          method: 'PATCH',
          transformRequest: function(data) {
            var feature = Preprocessors.geojson(data);
            return angular.toJson(feature);
          }
        }
      });
    });

}());

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

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('Security', function(environment, ipCookie, $http, $resource) {

      var Security = $resource(environment.apiUrl.concat('/login'), {}, {
        save: {
          method: 'POST',
          url: environment.apiUrl.concat('/v1/auth/remote'),
          params: {
            response_type: 'token',
            client_id: environment.clientId,
            redirect_uri: environment.siteUrl.concat('/authorize'),
            scope: 'user',
            state: 'json'
          }
        },
        register: {
          method: 'POST',
          url: environment.apiUrl.concat('/v1/user/register')
        },
        reset: {
          method: 'POST',
          url: environment.apiUrl.concat('/reset')
        }
      });

      Security.has_token = function() {
        return (ipCookie('FIELDSTACKIO_SESSION')) ? true: false;
      };

      return Security;
    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('Site', function (environment, Preprocessors, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/site/:id'), {
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
        practices: {
          method: 'GET',
          isArray: false,
          url: environment.apiUrl.concat('/v1/data/site/:id/practices')
        }
      });
    });

}());

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('Segment', function (environment, Preprocessors, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/segment/:id'), {
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
        }
      });
    });

}());

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.application
 * @description
 * # application
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .provider('Application', function application() {
    
    this.$get = ['$resource', '$location', '$rootScope', function($resource, $location, $rootScope) {

      var base_resource_url = '//api.commonscloud.org/v2/applications/:id.json';

      var Application = $resource(base_resource_url, {}, {
        query: {
          method: 'GET',
          isArray: true,
          transformResponse: function(data, headersGetter) {

            var applications = angular.fromJson(data);

            return applications.response.applications;
          }
        },
        collaborators: {
          url: '//api.commonscloud.org/v2/applications/:id/users.json',
          method: 'GET',
          isArray: false
        },
        permission: {
          url: '//api.commonscloud.org/v2/applications/:id/users/:userId.json',
          method: 'GET',
          isArray: false
        },
        permissionUpdate: {
          url: '//api.commonscloud.org/v2/applications/:id/users/:userId.json',
          method: 'PATCH'
        },
        collaborator: {
          url: '//api.commonscloud.org/v2/users/:userId.json',
          method: 'GET',
          isArray: false
        },
        update: {
          method: 'PATCH'
        }
      });

      Application.GetApplication = function(applicationId) {

        //
        // Get the single application that the user wants to view
        //
        var promise = Application.get({
            id: applicationId
          }).$promise.then(function(response) {
            return response.response;
          }, function(error) {
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind reloading the page? It looks like we couldn\'t get that Application for you.'
            });
          });

        return promise;
      };

      Application.GetCollaborators = function(applicationId) {

        //
        // Get the single application that the user wants to view
        //
        var promise = Application.collaborators({
            id: applicationId
          }).$promise.then(function(response) {
            return response.response.users;
          }, function(error) {
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind reloading the page? It looks like we couldn\'t get that Application for you.'
            });
          });

        return promise;
      };

      Application.GetCollaborator = function(applicationId, userId) {

        //
        // Get the single application that the user wants to view
        //
        var promise = Application.collaborator({
            id: applicationId,
            userId: userId
          }).$promise.then(function(response) {
            return response.response;
          }, function(error) {
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind reloading the page? It looks like we couldn\'t get that Application for you.'
            });
          });

        return promise;
      };

      Application.GetCollaboratorPermissions = function(applicationId, userId) {

        //
        // Get the single application that the user wants to view
        //
        var promise = Application.permission({
            id: applicationId,
            userId: userId
          }).$promise.then(function(response) {
            return response;
          }, function(error) {
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind reloading the page? It looks like we couldn\'t get that Application for you.'
            });
          });

        return promise;
      };

      return Application;
    }];
  });

'use strict';

/**
 * @ngdoc service
 * @name
 * @description
 */
angular.module('FieldStack')
  .provider('Efficiency', function () {
    this.$get = ['$resource', function ($resource) {
      return $resource('//api.commonscloud.org/v2/type_056e01e3bbf44359866b4861cde24808.json', {}, {
        query: {
          method: 'GET',
          isArray: false,
        }
      });
    }];
  });

'use strict';

/**
 * @ngdoc service
 * @name cleanWaterCommunitiesApp.ImperviousSurfaceResource
 * @description
 * # ImperviousSurfaceResource
 * Service in the managerApp.
 */
angular.module('FieldStack')
  .service('Load', ['$resource', 'commonscloud', function ($resource, commonscloud) {
    return $resource(commonscloud.baseurl + commonscloud.collections.loaddata.storage + '/:id.geojson', {
      id: '@id'
    }, {
      query: {
        isArray: false
      },
    });
  }]);

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name
   * @description
   */
  angular.module('FieldStack')
    .service('UALStateLoad', function (environment, Preprocessors, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/urban-ual-state/:id'), {
        id: '@id'
      }, {
        query: {
          isArray: false
        }
      });
    });

}());

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.attachment
 * @description
 * # attachment
 * Service in the FieldStack.
 */
angular.module('FieldStack')
  .provider('Attachment', function attachment() {

    this.$get = ['$resource', function ($resource) {

      var Attachment = $resource('//api.commonscloud.org/v2/:storage/:featureId/:attachmentStorage/:attachmentId.json', {

      }, {
        delete: {
          method: 'DELETE'
        }
      });

      return Attachment;
    }];

  });

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.feature
 * @description
 * # feature
 * Provider in the FieldStack.
 */
angular.module('FieldStack')
  .provider('Feature', function () {


    this.$get = ['$resource', '$rootScope', 'Template', function ($resource, $rootScope, Template) {

      var Feature = $resource('//api.commonscloud.org/v2/:storage.json', {

      }, {
        query: {
          method: 'GET',
          isArray: false,
          transformResponse: function (data, headersGetter) {
            return angular.fromJson(data);
          }
        },
        relationship: {
          method: 'GET',
          isArray: false,
          url: '//api.commonscloud.org/v2/:storage/:featureId/:relationship.json',
          transformResponse: function (data, headersGetter) {
            return angular.fromJson(data);
          }
        },
        postFiles: {
          method: 'PUT',
          url: '//api.commonscloud.org/v2/:storage/:featureId.json',
          transformRequest: angular.identity,
          headers: {
            'Content-Type': undefined
          }
        },
        user: {
          method: 'GET',
          url: '//api.commonscloud.org/v2/:storage/:featureId/users/:userId.json'
        },
        createUser: {
          method: 'POST',
          url: '//api.commonscloud.org/v2/:storage/:featureId/users/:userId.json'
        },
        removeUser: {
          method: 'DELETE',
          url: '//api.commonscloud.org/v2/:storage/:featureId/users/:userId.json'
        },
        users: {
          method: 'GET',
          url: '//api.commonscloud.org/v2/:storage/:featureId/users.json'
        },
        get: {
          method: 'GET',
          url: '//api.commonscloud.org/v2/:storage/:featureId.json'
        },
        update: {
          method: 'PATCH',
          url: '//api.commonscloud.org/v2/:storage/:featureId.json'
        },
        delete: {
          method: 'DELETE',
          url: '//api.commonscloud.org/v2/:storage/:featureId.json'
        }
      });

      Feature.GetPaginatedFeatures = function(templateId, page) {

        var promise = Feature.GetTemplate(templateId, page).then(function(options) {
          return Feature.GetFeatures(options);
        });

        return promise;
      };

      Feature.GetSingleFeatures = function(templateId, featureId) {

        var promise = Feature.GetTemplateSingleFeature(templateId, featureId).then(function(options) {
          return Feature.GetFeature(options);
        });

        return promise;
      };

      Feature.GetTemplate = function(templateId, page) {

        var promise = Template.get({
            templateId: templateId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return {
              storage: response.response.storage,
              page: page
            };
          });

        return promise;
      };

      Feature.GetTemplateSingleFeature = function(templateId, featureId) {

        var promise = Template.get({
            templateId: templateId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return {
              storage: response.response.storage,
              featureId: featureId
            };
          });

        return promise;
      };

      Feature.GetFeatures = function(options) {

        var defaults = options.location;
        var getFilters = Feature.buildFilters(options.fields, defaults);

        var filters = {
          page: (defaults.page) ? defaults.page : null,
          results_per_page: (defaults.results_per_page) ? defaults.results_per_page : null,
          callback: (defaults.callback) ? defaults.callback : null,
          selected: getFilters,
          available: getFilters
        };

        var promise = Feature.query({
            storage: options.storage,
            page: (options.page === undefined || options.page === null) ? 1: options.page,
            q: {
              filters: Feature.getFilters(filters),
              order_by: [
                {
                  field: 'created',
                  direction: 'desc'
                }
              ]
            },
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return response;
          });

        return promise;
      };

      Feature.GetRelatedFeatures = function(options) {



        var promise = Feature.relationship({
            storage: options.storage,
            relationship: options.relationship,
            featureId: options.featureId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return response.response.features;
          });

        return promise;
      };

      Feature.MachineReadable = function(name) {

        if (name) {
          var removeDashes = name.replace(/-/g, ''),
              removeSpaces = removeDashes.replace(/ /g, '-'),
              convertLowerCase = removeSpaces.toLowerCase();

          return convertLowerCase;
        }

        return null;
      };

      Feature.HumanReadable = function(name) {
        return Feature.CapitalizeEachWord(name.replace('-', ' '));
      };

      Feature.CapitalizeEachWord = function(str) {
        return str.replace(/\w\S*/g, function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      };

      //
      // Search a specified Feature Collection
      //
      //    storage (string) The storage string for the Feature Collection you wish to search
      //    criteria (object) An object of filters, order by, and other statements
      //    page (integer) The page number
      //
      //
      Feature.SearchFeatures = function(storage, criteria, page) {

        var promise = Feature.query({
            storage: storage,
            page: (page === undefined || page === null) ? 1: page,
            q: criteria,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return response;
          });

        return promise;
      };

      Feature.GetFeature = function(options) {

        var promise = Feature.get({
            storage: options.storage,
            featureId: options.featureId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return response.response;
          }, function(error) {
            $rootScope.alerts = [];
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind trying that again? We couldn\'t find the Feature you were looking for.'
            });
          });

        return promise;
      };

      Feature.CreateFeature = function(options) {

        console.log(options);

        var promise = Feature.save({
            storage: options.storage
          }, options.data).$promise.then(function(response) {

            var feature_id = response.resource_id;

            //
            // Before we return the values we should also add the owner of the new Feature
            // to the Users list by given them project specific permissions
            //
            Feature.AddUser({
              storage: options.storage,
              featureId: feature_id,
              userId: options.data.owner,
              data: {
                read: true,
                write: true,
                is_admin: true
              }
            });

            return feature_id;
          }, function(error) {
            $rootScope.alerts = [];
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind trying that again? We couldn\'t find the Feature you were looking for.'
            });
          });

        return promise;
      };


      Feature.UpdateFeature = function(options) {

        var promise = Feature.update({
            storage: options.storage,
            featureId: options.featureId
          }, options.data).$promise.then(function(response) {
            return response;
          }, function(error) {
            $rootScope.alerts = [];
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind trying that again? We couldn\'t find the Feature you were looking for.'
            });
          });

        return promise;
      };

      Feature.DeleteFeature = function(options) {

        var promise = Feature.delete({
            storage: options.storage,
            featureId: options.featureId
          }).$promise.then(function(response) {
            return response;
          }, function(error) {
            $rootScope.alerts = [];
            $rootScope.alerts.push({
              'type': 'error',
              'title': 'Uh-oh!',
              'details': 'Mind trying that again? We couldn\'t find the Feature you were looking for.'
            });
          });

        return promise;
      };

      //
      // User Specific Permissions or User Lists for a specific Feature
      //
      Feature.GetFeatureUsers = function(options) {

        var promise = Feature.users({
          storage: options.storage,
          featureId: options.featureId
        }).$promise.then(function(response) {
          return response.response.users;
        });

        return promise;

      };

      Feature.GetFeatureUser = function(options) {

        var promise = Feature.user({
          storage: options.storage,
          featureId: options.featureId,
          userId: options.userId
        }).$promise.then(function(response) {
          return response.response;
        });

        return promise;

      };

      Feature.AddUser = function(options) {

        var promise = Feature.createUser({
          storage: options.storage,
          featureId: options.featureId,
          userId: options.userId
        }, options.data).$promise.then(function(response) {
          return response;
        });

        return promise;

      };

      Feature.RemoveUser = function(options) {

        var promise = Feature.removeUser({
          storage: options.storage,
          featureId: options.featureId,
          userId: options.userId
        }).$promise.then(function(response) {
          return response;
        });

        return promise;

      };

      //
      // From an Angular $location.search() object we need to parse it
      // so that we can produce an appropriate URL for our API
      //
      // Our API can accept a limited number of keywords and values this
      // functions is meant to act as a middleman to process it before
      // sending it along to the API. This functionality will grant us the
      // ability to use 'saved searches' and direct URL input from the user
      // and retain appropriate search and pagination functionality
      //
      // Keywords:
      //
      // results_per_page (integer) The number of results per page you wish to return, not to be used like limit/offset
      // page (integer) The page number of results to return
      // callback (string) Wrap response in a Javascript function with the name of the string
      // q (object) An object containing the following attributes and values
      //   filters (array) An array of filters (i.e., {"name": <fieldname>, "op": <operatorname>, "val": <argument>})
      //   disjunction (boolean) Processed as AND or OR statement, default is False or AND
      //   limit (integer) Number of Features to limit a single call to return
      //   offset (integer) Number of Features to offset the current call
      //   order_by (array) An array of order by clauses (i.e., {"field": <fieldname>, "direction": <directionname>})
      //
      //
      // Feature.getSearchParameters = function(search_parameters) {
      //   console.log('search_parameters', search_parameters);

      //   //
      //   // We need to convert the JSON from a string to a JSON object that our application can use
      //   //
      //   var q_ = angular.fromJson(search_parameters.q);

      //   return {
      //     results_per_page: search_parameters.results_per_page,
      //     page: search_parameters.page,
      //     callback: search_parameters.callback,
      //     q: q_
      //   };
      // };


      //
      // Prepare Filters for submission via an HTTP request
      //
      Feature.getFilters = function(filters) {

        var filters_ = [];

        angular.forEach(filters.available, function(filter, $index) {

          //
          // Each Filter can have multiple criteria such as single ilike, or
          // a combination of gte and lte. We need to create an individual filter
          // for each of the criteria, even if it's for the same field.
          //
          angular.forEach(filter.filter, function(criteria, $index) {
            if (criteria.value !== null) {
              filters_.push({
                name: filter.field,
                op: criteria.op,
                val: (criteria.op === 'ilike') ? '%' + criteria.value + '%' : criteria.value
              });
            }
          });

        });

        return filters_;
      };

      //
      // Build a list of Filters based on a Template Field list passed in through the fields parameter
      //
      // fields (array) An array of fields specific to a template, these need to be in the default
      //                CommonsCloudAPI's Field list format [1]
      //
      // @see [1] https://api.commonscloud.org/v2/templates/:templateId/fields.json for an example
      //
      Feature.buildFilters = function(fields, defaults) {

        //
        // Default, empty Filters list
        //
        var filters = [],
            types = {
              text: ['text', 'textarea', 'list', 'email', 'phone', 'url'],
              number: ['float', 'whole_number'],
              date: ['date', 'time']
            },
            q_ = angular.fromJson(defaults.q);

        angular.forEach(fields, function(field, $index) {
          if (Feature.inList(field.data_type, types.text)) {
            filters.push({
              label: field.label,
              field: field.name,
              type: 'text',
              active: (Feature.getDefault(field, 'ilike', q_)) ? true: false,
              filter: [
                {
                  op: 'ilike',
                  value: Feature.getDefault(field, 'ilike', q_)
                }
              ]
            });
          }
          else if (Feature.inList(field.data_type, types.number)) {
            filters.push({
              label: field.label,
              field: field.name,
              type: 'number',
              active: false,
              filter: [
                {
                  op: 'gte',
                  value: Feature.getDefault(field, 'gte', q_)
                },
                {
                  op: 'lte',
                  value: Feature.getDefault(field, 'lte', q_)
                }
              ]
            });
          }
          else if (Feature.inList(field.data_type, types.date)) {
            filters.push({
              label: field.label,
              field: field.name,
              type: 'date',
              active: false,
              filter: [
                {
                  op: 'gte',
                  value: Feature.getDefault(field, 'gte', q_)
                },
                {
                  op: 'lte',
                  value: Feature.getDefault(field, 'lte', q_)
                }
              ]
            });
          }
        });

        return filters;
      };

      //
      // Check if a property is in an object and then select a default value
      //
      Feature.getDefault = function(field, op, defaults) {

        var value = null;

        if (defaults && defaults.filters !== undefined) {
          angular.forEach(defaults.filters, function(default_value, $index) {
            if (field.name === default_value.name && op === default_value.op) {
              if (default_value.op === 'ilike') {
                // Remove the % from the string
                value = default_value.val.replace(/%/g, '');
              } else {
                value = default_value.val;
              }
              // console.log('default found for', default_value.name, default_value.op, default_value.val);
            }
          });
        }

        return value;
      };

      //
      // Check if a value is in a list of values
      //
      Feature.inList = function(search_value, list) {

        var $index;

        for ($index = 0; $index < list.length; $index++) {
          if (list[$index] === search_value) {
            return true;
          }
        }

        return false;
      };

      return Feature;
    }];

  });

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.field
 * @description
 * # field
 * Provider in the FieldStack.
 */
angular.module('FieldStack')
  .provider('Field', function () {

    this.$get = ['$resource', function ($resource) {

      var Field = $resource('//api.commonscloud.org/v2/templates/:templateId/fields/:fieldId.json', {

      }, {
        query: {
          method: 'GET',
          isArray: true,
          url: '//api.commonscloud.org/v2/templates/:templateId/fields.json',
          transformResponse: function (data, headersGetter) {

            var fields = angular.fromJson(data);

            return fields.response.fields;
          }
        },
        save: {
          method: 'POST',
          url: '//api.commonscloud.org/v2/templates/:templateId/fields.json'
        },
        update: {
          method: 'PATCH'
        },
        delete: {
          method: 'DELETE',
          url: '//api.commonscloud.org/v2/templates/:templateId/fields/:fieldId.json'
        }

      });

      Field.PrepareFields = function(fields) {

        var processed_fields = [];

        angular.forEach(fields, function(field, index) {

          if (field.data_type === 'list') {
            field.options = field.options.split(',');
          }

          processed_fields.push(field);
        });

        return processed_fields;
      };

      Field.PrepareFieldsObject = function(fields) {

        var processed_fields = {};

        angular.forEach(fields, function(field, index) {

          if (field.data_type === 'list') {
            field.options = field.options.split(',');
          }

          processed_fields[field.name] = field;
        });

        return processed_fields;
      };

      Field.GetPreparedFields = function(templateId, returnAs) {

        var promise = Field.query({
            templateId: templateId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            if (returnAs && returnAs === 'object') {
              return Field.PrepareFieldsObject(response);
            } else {
              return Field.PrepareFields(response);
            }
          });

        return promise;
      };


      Field.GetFields = function(templateId) {

        var promise = Field.query({
            templateId: templateId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return response;
          });

        return promise;
      };

      Field.GetField = function(templateId, fieldId) {

        var promise = Field.get({
            templateId: templateId,
            fieldId: fieldId,
            updated: new Date().getTime()
          }).$promise.then(function(response) {
            return response.response;
          });

        return promise;
      };

      return Field;
    }];

  });

(function () {

    'use strict';

    /**
     * @ngdoc function
     * @name
     * @description
     */
     angular.module('FieldStack')
       .service('Preprocessors', function ($resource) {

         return {
           geojson: function(raw) {

             var self = this;

             if (raw && raw.id && !raw.properties) {
               return {
                 id: parseInt(raw.id)
               };
             }
             else if (raw && !raw.id && !raw.properties) {
               return;
             }

             var feature = {};

             //
             // Process all of the object, array, string, numeric, and boolean
             // fields; Adding them to the main feature object;
             //
             angular.forEach(raw.properties, function(attribute, index) {

               var value = null;

               if (angular.isArray(attribute)) {
                 var newArray = [];

                 angular.forEach(attribute, function (childObject) {
                   newArray.push(self.geojson(childObject));
                 });

                 value = newArray;
               }
               else if (angular.isObject(attribute)) {
                 value = self.geojson(attribute);
               }
               else {
                 value = attribute;
               }
               feature[index] = value;
             });

             //
             // If a `geometry` attribute is present add it to the main feature
             // object;
             //
             if (raw.geometry) {
               feature.geometry = raw.geometry;
             }

             return feature;
           }
         };

       });

}());

'use strict';

/**
 * @ngdoc service
 * @name FieldStack.template
 * @description
 * # template
 * Provider in the FieldStack.
 */
angular.module('FieldStack')
  .service('Utility', function () {

    return {
      machineName: function(name) {
        if (name) {
          var removeDashes = name.replace(/-/g, ''),
              removeSpaces = removeDashes.replace(/ /g, '-'),
              convertLowerCase = removeSpaces.toLowerCase();

          return convertLowerCase;
        }

        return null;
      }
    };

  });

(function() {

  'use strict';

  /**
   * @ngdoc service
   * @name 
   * @description
   */
  angular.module('FieldStack')
    .service('User', function (environment, $resource) {
      return $resource(environment.apiUrl.concat('/v1/data/user/:id'), {
        id: '@id'
      }, {
        query: {
          isArray: false
        },
        update: {
          method: 'PATCH'
        },
        groups: {
          method: 'GET',
          isArray: false,
          url: environment.apiUrl.concat('/v1/data/user/:id/groups')
        },
        getOrganizations: {
          method: 'GET',
          isArray: false,
          url: environment.apiUrl.concat('/v1/data/user/:id/organization')
        },
        me: {
          method: 'GET',
          url: environment.apiUrl.concat('/v1/data/user/me')
        },
        classifications: {
          method: 'GET',
          isArray: false,
          url: environment.apiUrl.concat('/v1/data/user/:id/classifications')
        }
      });
    });

}());

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:imageResize
 * @description
 * # imageResize
 * Directive of the FieldStack
 */
angular.module('FieldStack')
  .directive('imageResize', ['$parse', function($parse) {
      return {
        link: function(scope, elm, attrs) {
          var imagePercent;
          imagePercent = $parse(attrs.imagePercent)(scope);
          return elm.one('load', function() {
            var canvas, ctx, neededHeight, neededWidth;
            neededHeight = elm.height() * imagePercent / 100;
            neededWidth = elm.width() * imagePercent / 100;
            canvas = document.createElement('canvas');
            canvas.width = neededWidth;
            canvas.height = neededHeight;
            ctx = canvas.getContext('2d');
            ctx.drawImage(elm[0], 0, 0, neededWidth, neededHeight);
            return elm.attr('src', canvas.toDataURL('image/jpeg'));
          });
        }
      };
  }]);

(function() {

  'use strict';

  angular.module('FieldStack')
    .directive('relationship', function ($http, $timeout) {
      return {
        scope: {
          table: '=',
          model: '=',
          multiple: '=',
          placeholder: '='
        },
        templateUrl: '/modules/shared/directives/relationship/relationship.html',
        restrict: 'E',
        link: function (scope, el, attrs) {

          var container = el.children()[0],
              input = angular.element(container.children[0]),
              dropdown = angular.element(container.children[1]),
              timeout;

          scope.relationship_focus = false;
          console.log('multiple', scope.multiple);
          console.log('placeholder', scope.placeholder);

          var getFilteredResults = function(table){
            var url = '//api.commonscloud.org/v2/' + table + '.json';

            $http({
              method: 'GET',
              url: url,
              params: {
                'q': {
                  'filters':
                  [
                    {
                      'name': 'name',
                      'op': 'ilike',
                      'val': scope.searchText + '%'
                    }
                  ]
                },
                'results_per_page': 25
              }
            }).success(function(data){
              //assign feature objects to scope for use in template
              scope.features = data.response.features;
            });
          };

          var set = function(arr) {
            return arr.reduce(function (a, val) {
              if (a.indexOf(val) === -1) {
                  a.push(val);
              }
              return a;
            }, []);
          };

          //search with timeout to prevent it from firing on every keystroke
          scope.search = function(){
            $timeout.cancel(timeout);

            timeout = $timeout(function () {
              getFilteredResults(scope.table);
            }, 200);
          };

          scope.addFeatureToRelationships = function(feature){

            if (angular.isArray(scope.model)) {
              scope.model.push(feature);
            } else {
              scope.model = [];
              scope.model.push(feature);
            }

            scope.model = set(scope.model);

            // Clear out input field
            scope.searchText = '';
            scope.features = [];
          };

          scope.removeFeatureFromRelationships = function(index) {
            scope.model.splice(index, 1);
          };

          scope.resetField = function() {
            scope.searchText = '';
            scope.features = [];
            scope.relationship_focus = false;
            console.log('Field reset');
          };

        }
      };
  });

}());

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.toAcres
 * @description
 * # toAcres
 * Controller of the FieldStack
 */
angular.module('FieldStack')
  .filter('toAcres', [function(){

    /**
     * Convert the given whole number (assuming square feet) to acres
     *
     * @param (number) squareFeet
     *    The number of square feet you wish to convert to acres
     *
     * @return (number) acres
     *    The conversion result in acres
     *
     * @see https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=acres%20to%20square%20feet
     */
    return function(squareFeet) {
      var acres = (squareFeet/43560);
      return acres;
    };

  }]);

'use strict';

/**
 * @ngdoc function
 * @name FieldStack.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the FieldStack
 */
angular.module('FieldStack')
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