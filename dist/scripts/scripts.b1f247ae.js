"use strict";angular.module("practiceMonitoringAssessmentApp",["ngResource","ngRoute","ngSanitize","ngTouch","ipCookie","ui.gravatar","leaflet-directive","angularFileUpload","geolocation","angular-loading-bar","monospaced.elastic"]).config(["$routeProvider","$locationProvider","$httpProvider",function(a,b){var c="/views/main.html",d={templateId:121,storage:"type_061edec30db54fa0b96703b40af8d8ca"};a.when("/",{templateUrl:"/views/main.html",controller:"IndexCtrl",resolve:{user:["User",function(a){return a.getUser()}]}}).when("/authorize",{templateUrl:"/views/authorize.html",controller:"AuthorizeCtrl"}).when("/logout",{templateUrl:"/views/logout.html",controller:"LogoutCtrl"}).when("/users",{templateUrl:c,controller:"UsersCtrl",resolve:{user:["User",function(a){return a.getUser()}]}}).when("/projects",{templateUrl:c,controller:"ProjectsCtrl",reloadOnSearch:!1,resolve:{user:["User",function(a){return a.getUser()}],template:["Template","$route",function(a){return a.GetTemplate(d.templateId)}],fields:["Field","$route",function(a){return a.GetPreparedFields(d.templateId)}],storage:function(){return d.storage}}}).when("/projects/:projectId",{templateUrl:c,controller:"ProjectViewCtrl",resolve:{user:["User",function(a){return a.getUser()}],template:["Template","$route",function(a){return a.GetTemplate(d.templateId)}],fields:["Field","$route",function(a){return a.GetPreparedFields(d.templateId,"object")}],project:["Feature","$route",function(a,b){return a.GetFeature({storage:d.storage,featureId:b.current.params.projectId})}],storage:function(){return d.storage}}}).when("/projects/:projectId/edit",{templateUrl:c,controller:"ProjectEditCtrl",resolve:{user:["User",function(a){return a.getUser()}],template:["Template","$route",function(a){return a.GetTemplate(d.templateId)}],fields:["Field","$route",function(a){return a.GetPreparedFields(d.templateId,"object")}],project:["Feature","$route",function(a,b){return a.GetFeature({storage:d.storage,featureId:b.current.params.projectId})}],storage:function(){return d.storage}}}).when("/projects/:projectId/users",{templateUrl:c,controller:"ProjectUsersCtrl",resolve:{user:["User","$route",function(a,b){return a.getUser({featureId:b.current.params.projectId,templateId:d.templateId})}],users:["User",function(a){return a.GetUsers()}],projectUsers:["Feature","$route",function(a,b){return a.GetFeatureUsers({storage:d.storage,featureId:b.current.params.projectId})}],template:["Template","$route",function(a){return a.GetTemplate(d.templateId)}],fields:["Field","$route",function(a){return a.GetPreparedFields(d.templateId,"object")}],project:["Feature","$route",function(a,b){return a.GetFeature({storage:d.storage,featureId:b.current.params.projectId})}],storage:function(){return d.storage}}}).when("/sites",{templateUrl:c,controller:"SitesCtrl",resolve:{user:["User",function(a){return a.getUser()}]}}).when("/practices",{templateUrl:c,controller:"PracticesCtrl",resolve:{user:["User",function(a){return a.getUser()}]}}).when("/metrics",{templateUrl:c,controller:"MetricsCtrl",resolve:{user:["User",function(a){return a.getUser()}]}}).when("/reports",{templateUrl:c,controller:"ReportsCtrl",resolve:{user:["User",function(a){return a.getUser()}]}}).otherwise({templateUrl:"/views/errors/404.html"}),b.html5Mode(!0)}]),angular.module("practiceMonitoringAssessmentApp").controller("AuthorizeCtrl",["$scope","$rootScope","$location","ipCookie",function(a,b,c,d){var e=d("COMMONS_SESSION");a.saveAuthorization=function(){var a=c.hash(),b=a.substring(0,a.indexOf("&")),e=b.replace("access_token=",""),f={path:"/",expires:2};d("COMMONS_SESSION",e,f),c.hash(""),c.path("/projects")},a.verifyAuthorization=function(){e&&void 0!==e&&"undefined"!==e?(c.hash(""),c.path("/projects")):(d.remove("COMMONS_SESSION"),d.remove("COMMONS_SESSION",{path:"/"}),a.saveAuthorization())}}]),angular.module("practiceMonitoringAssessmentApp").controller("LogoutCtrl",["$scope","ipCookie","$location",function(a,b,c){console.log("LogoutCtrl"),a.logout=function(){b.remove("COMMONS_SESSION"),b.remove("COMMONS_SESSION",{path:"/"}),c.hash(),c.path("/")}}]),angular.module("practiceMonitoringAssessmentApp").controller("IndexCtrl",["$rootScope","$scope","ipCookie","$location","$window","user",function(a,b,c,d){var e=c("COMMONS_SESSION");b.page={template:"/views/index.html",title:"NFWF Grant Monitoring and Assessment",back:"/",header:{hidden:!0}},b.setupLoginPage=function(){var a=d.host();b.login_url="localhost"===a||"127.0.0.1"===a?"//api.commonscloud.org/oauth/authorize?response_type=token&client_id=qXadujeb96VrZogGGd6zE6wTtzziBZJnxPfM8ZPu&redirect_uri=http%3A%2F%2F127.0.0.1%3A9000%2Fauthorize&scope=user applications":"//api.commonscloud.org/oauth/authorize?response_type=token&client_id=MbanCzYpm0fUW8md1cdSJjUoYI78zTbak2XhZ2hQ&redirect_uri=http%3A%2F%2Fnfwf.viableindustries.com%2Fauthorize&scope=user applications"},e&&void 0!==e&&"undefined"!==e?(d.hash(""),d.path("/projects")):(c.remove("COMMONS_SESSION"),c.remove("COMMONS_SESSION",{path:"/"}),b.setupLoginPage())}]),angular.module("practiceMonitoringAssessmentApp").controller("MainCtrl",["$rootScope","$scope",function(a,b){b.page={template:"/views/index.html",title:"Welcome",back:"/"}}]),angular.module("practiceMonitoringAssessmentApp").controller("ProjectsCtrl",["$rootScope","$scope","$route","$routeParams","$location","$timeout","Feature","template","fields","storage","user",function(a,b,c,d,e,f,g,h,i,j,k){var l;a.page={template:"views/projects.html",title:"Projects",display_title:!0,back:"/",links:[{type:"button-link new",click:"create",text:"Create project"}],refresh:function(){c.reload()}},b.user=k,b.template=h,b.defaults=e.search(),g.GetFeatures({storage:j,page:c.current.params.page,q:c.current.params.q,location:b.defaults,fields:i}).then(function(a){b.projects=a});var m=g.buildFilters(i,b.defaults);b.filters={page:b.defaults.page?b.defaults.page:null,results_per_page:b.defaults.results_per_page?b.defaults.results_per_page:null,callback:b.defaults.callback?b.defaults.callback:null,selected:m,available:m},b.filters.select=function(a){b.filters.available[a].active=!0},b.filters.remove=function(a){b.filters.available[a].active=!1,angular.forEach(b.filters.available[a].filter,function(c,d){b.filters.available[a].filter[d].value=null}),b.search.execute()},b.search={},b.search.projects=function(){f.cancel(l),l=f(function(){b.search.execute()},1e3)},b.search.execute=function(a){var c=g.getFilters(b.filters);console.log("Q",c),b.filters.page=a,g.query({storage:b.template.storage,q:{filters:c,order_by:[{field:"created",direction:"desc"}]},page:b.filters.page?b.filters.page:null,results_per_page:b.filters.results_per_page?b.filters.results_per_page:null,callback:b.filters.callback?b.filters.callback:null,updated:(new Date).getTime()}).$promise.then(function(a){b.projects=a;var d=null;c.length&&(d=angular.toJson({filters:c})),e.search({q:d,page:b.filters.page?b.filters.page:null,results_per_page:b.filters.results_per_page?b.filters.results_per_page:null,callback:b.filters.callback?b.filters.callback:null})})},b.search.paginate=function(a){b.search.execute(a),console.log("Go to page",a)},b.project={},b.project.create=function(){g.CreateFeature({storage:j,data:{project_title:"Untitled Project",owner:b.user.id,status:"private"}}).then(function(a){console.log("New Project",a),e.path("/projects/"+a+"/edit")})}}]),angular.module("practiceMonitoringAssessmentApp").controller("ProjectViewCtrl",["$rootScope","$scope","$route","$location","Template","Feature","project","storage","user","template",function(a,b,c,d,e,f,g,h,i,j){b.template=j,b.project=g,b.user=i,b.user.owner=!1,b.user.feature={},b.user.template={},a.page={template:"views/project-view.html",title:b.project.project_title,display_title:!1,back:"/",links:[{text:"Projects",url:"/projects"},{text:b.project.project_title,url:"/projects/"+b.project.id,type:"active"}],refresh:function(){c.reload()}},b.user.id===b.project.owner?b.user.owner=!0:e.GetTemplateUser({storage:h,templateId:b.template.id,userId:b.user.id}).then(function(a){b.user.template=a,b.user.template.is_admin&&b.user.template.is_moderator||f.GetFeatureUser({storage:h,featureId:b.project.id,userId:b.user.id}).then(function(a){b.user.feature=a,b.user.feature.is_admin||b.user.feature.write||d.path("/projects/"+b.project.id)})})}]),angular.module("practiceMonitoringAssessmentApp").controller("ProjectEditCtrl",["$rootScope","$scope","$route","$location","project","Template","Feature","Field","template","fields","storage","user",function(a,b,c,d,e,f,g,h,i,j,k,l){b.template=i,b.fields=j,b.project=e,b.user=l,b.user.owner=!1,b.user.feature={},b.user.template={},a.page={template:"views/project-edit.html",title:b.project.project_title,display_title:!1,editable:!0,back:"/",links:[{text:"Projects",url:"/projects"},{text:b.project.project_title,url:"/projects/"+b.project.id},{text:"Edit",url:"/projects/"+b.project.id+"/edit",type:"active"}],refresh:function(){c.reload()}},b.project.save=function(){g.UpdateFeature({storage:k,featureId:b.project.id,data:b.project}).then(function(){a.page.refresh()}).then(function(){})},b.user.id===b.project.owner?b.user.owner=!0:f.GetTemplateUser({storage:k,templateId:b.template.id,userId:b.user.id}).then(function(a){b.user.template=a,b.user.template.is_admin&&b.user.template.is_moderator||g.GetFeatureUser({storage:k,featureId:b.project.id,userId:b.user.id}).then(function(a){b.user.feature=a,b.user.feature.is_admin||b.user.feature.write||d.path("/projects/"+b.project.id)})})}]),angular.module("practiceMonitoringAssessmentApp").controller("ProjectUsersCtrl",["$rootScope","$scope","$route","$location","project","Template","Feature","Field","template","fields","storage","user","users","projectUsers",function(a,b,c,d,e,f,g,h,i,j,k,l,m,n){b.template=i,b.fields=j,b.project=e,b.project.users=n,b.project.users_edit=!1,b.modals={open:function(a){b.modals.windows[a].visible=!0},close:function(a){b.modals.windows[a].visible=!1},windows:{inviteUser:{title:"Add a collaborator",body:"",visible:!1}}},b.user=l,b.user.owner=!1,b.user.feature={},b.user.template={},b.users={list:m,search:null,invite:function(a){b.invite.push(a),this.search=null},add:function(){angular.forEach(b.invite,function(a){g.AddUser({storage:k,featureId:b.project.id,userId:a.id,data:{read:!0,write:!0,is_admin:!1}}).then(function(){b.modals.close("inviteUser"),b.page.refresh()})})},remove:function(a){var c=b.project.users.indexOf(a);g.RemoveUser({storage:k,featureId:b.project.id,userId:a.id}).then(function(){b.project.users.splice(c,1)})},remove_confirm:!1},b.invite=[],a.page={template:"views/project-users.html",title:b.project.project_title+" Users",display_title:!1,editable:!0,back:"/",links:[{text:"Projects",url:"/projects"},{text:b.project.project_title,url:"/projects/"+b.project.id},{text:"Users",url:"/projects/"+b.project.id+"/users",type:"active"}],actions:[{type:"button-link edit",action:function(a){b.project.users_edit=!b.project.users_edit,b.page.actions[a].visible=!b.page.actions[a].visible},visible:!1,text:"Edit collaborators",alt:"Done Editing"},{type:"button-link new",action:function(){console.log("modal"),b.modals.open("inviteUser")},text:"Add a collaborator"}],refresh:function(){c.reload()}},b.user.id===b.project.owner?b.user.owner=!0:f.GetTemplateUser({storage:k,templateId:b.template.id,userId:b.user.id}).then(function(a){b.user.template=a,b.user.template.is_admin&&b.user.template.is_moderator||g.GetFeatureUser({storage:k,featureId:b.project.id,userId:b.user.id}).then(function(a){b.user.feature=a,b.user.feature.is_admin||b.user.feature.write||d.path("/projects/"+b.project.id)})})}]),angular.module("practiceMonitoringAssessmentApp").controller("SitesCtrl",["$rootScope","$scope",function(a,b){b.page={template:"/views/sites.html",title:"Sites",back:"/"}}]),angular.module("practiceMonitoringAssessmentApp").controller("PracticesCtrl",["$rootScope","$scope",function(a,b){b.page={template:"/views/practices.html",title:"Practices",back:"/"}}]),angular.module("practiceMonitoringAssessmentApp").controller("MetricsCtrl",["$rootScope","$scope",function(a,b){b.page={template:"/views/metrics.html",title:"Metrics",back:"/"}}]),angular.module("practiceMonitoringAssessmentApp").controller("ReportsCtrl",["$rootScope","$scope",function(a,b){b.page={template:"/views/reports.html",title:"Reports",back:"/"}}]),angular.module("practiceMonitoringAssessmentApp").controller("UsersCtrl",["$rootScope","$scope",function(a,b){b.page={template:"/views/users.html",title:"Users",back:"/"}}]),angular.module("practiceMonitoringAssessmentApp").service("Site",function(){var a={};return a.settings=function(){return{services:{mapbox:{access_token:"pk.eyJ1IjoiZGV2ZWxvcGVkc2ltcGxlIiwiYSI6IlZGVXhnM3MifQ.Q4wmA49ggy9i1rLr8-Mc-w",satellite:"developedsimple.k105bd34",terrain:"developedsimple.k1054a50",street:"developedsimple.k1057ndn"}},links:[{rel:"canonical",href:"http://www.nfwf-ma.org/"}],meta:[{name:"viewport",content:"width=device-width, initial-scale=1.0"},{name:"og:locale",content:"en_US"},{name:"og:type",content:"website"},{name:"og:site_name",content:"NFWF Monitoring and Assessment"},{name:"keywords",content:""}],partners:[]}},a}),angular.module("practiceMonitoringAssessmentApp").service("Navigation",[function(){var a={};return a.settings=function(){return{contextual:[]}},a}]),angular.module("practiceMonitoringAssessmentApp").provider("Application",function(){this.$get=["$resource","$location","$rootScope",function(a,b,c){var d="//api.commonscloud.org/v2/applications/:id.json",e=a(d,{},{query:{method:"GET",isArray:!0,transformResponse:function(a){var b=angular.fromJson(a);return b.response.applications}},collaborators:{url:"//api.commonscloud.org/v2/applications/:id/users.json",method:"GET",isArray:!1},permission:{url:"//api.commonscloud.org/v2/applications/:id/users/:userId.json",method:"GET",isArray:!1},permissionUpdate:{url:"//api.commonscloud.org/v2/applications/:id/users/:userId.json",method:"PATCH"},collaborator:{url:"//api.commonscloud.org/v2/users/:userId.json",method:"GET",isArray:!1},update:{method:"PATCH"}});return e.GetApplication=function(a){var b=e.get({id:a}).$promise.then(function(a){return a.response},function(){c.alerts.push({type:"error",title:"Uh-oh!",details:"Mind reloading the page? It looks like we couldn't get that Application for you."})});return b},e.GetCollaborators=function(a){var b=e.collaborators({id:a}).$promise.then(function(a){return a.response.users},function(){c.alerts.push({type:"error",title:"Uh-oh!",details:"Mind reloading the page? It looks like we couldn't get that Application for you."})});return b},e.GetCollaborator=function(a,b){var d=e.collaborator({id:a,userId:b}).$promise.then(function(a){return a.response},function(){c.alerts.push({type:"error",title:"Uh-oh!",details:"Mind reloading the page? It looks like we couldn't get that Application for you."})});return d},e.GetCollaboratorPermissions=function(a,b){var d=e.permission({id:a,userId:b}).$promise.then(function(a){return a},function(){c.alerts.push({type:"error",title:"Uh-oh!",details:"Mind reloading the page? It looks like we couldn't get that Application for you."})});return d},e}]}),angular.module("practiceMonitoringAssessmentApp").provider("Attachment",function(){this.$get=["$resource",function(a){var b=a("//api.commonscloud.org/v2/:storage/:featureId/:attachmentStorage/:attachmentId.json",{},{"delete":{method:"DELETE"}});return b}]}),angular.module("practiceMonitoringAssessmentApp").provider("Feature",function(){this.$get=["$resource","$rootScope","Template",function(a,b,c){var d=a("//api.commonscloud.org/v2/:storage.json",{},{query:{method:"GET",isArray:!1,transformResponse:function(a){return angular.fromJson(a)}},postFiles:{method:"PUT",url:"//api.commonscloud.org/v2/:storage/:featureId.json",transformRequest:angular.identity,headers:{"Content-Type":void 0}},user:{method:"GET",url:"//api.commonscloud.org/v2/:storage/:featureId/users/:userId.json"},createUser:{method:"POST",url:"//api.commonscloud.org/v2/:storage/:featureId/users/:userId.json"},removeUser:{method:"DELETE",url:"//api.commonscloud.org/v2/:storage/:featureId/users/:userId.json"},users:{method:"GET",url:"//api.commonscloud.org/v2/:storage/:featureId/users.json"},get:{method:"GET",url:"//api.commonscloud.org/v2/:storage/:featureId.json"},update:{method:"PATCH",url:"//api.commonscloud.org/v2/:storage/:featureId.json"},"delete":{method:"DELETE",url:"//api.commonscloud.org/v2/:storage/:featureId.json"}});return d.GetPaginatedFeatures=function(a,b){var c=d.GetTemplate(a,b).then(function(a){return d.GetFeatures(a)});return c},d.GetSingleFeatures=function(a,b){var c=d.GetTemplateSingleFeature(a,b).then(function(a){return d.GetFeature(a)});return c},d.GetTemplate=function(a,b){var d=c.get({templateId:a,updated:(new Date).getTime()}).$promise.then(function(a){return{storage:a.response.storage,page:b}});return d},d.GetTemplateSingleFeature=function(a,b){var d=c.get({templateId:a,updated:(new Date).getTime()}).$promise.then(function(a){return{storage:a.response.storage,featureId:b}});return d},d.GetFeatures=function(a){var b=a.location,c=d.buildFilters(a.fields,b),e={page:b.page?b.page:null,results_per_page:b.results_per_page?b.results_per_page:null,callback:b.callback?b.callback:null,selected:c,available:c},f=d.query({storage:a.storage,page:void 0===a.page||null===a.page?1:a.page,q:{filters:d.getFilters(e),order_by:[{field:"created",direction:"desc"}]},updated:(new Date).getTime()}).$promise.then(function(a){return a});return f},d.SearchFeatures=function(a,b,c){var e=d.query({storage:a,page:void 0===c||null===c?1:c,q:b,updated:(new Date).getTime()}).$promise.then(function(a){return a});return e},d.GetFeature=function(a){var c=d.get({storage:a.storage,featureId:a.featureId,updated:(new Date).getTime()}).$promise.then(function(a){return a.response},function(){b.alerts=[],b.alerts.push({type:"error",title:"Uh-oh!",details:"Mind trying that again? We couldn't find the Feature you were looking for."})});return c},d.CreateFeature=function(a){console.log(a);var c=d.save({storage:a.storage},a.data).$promise.then(function(b){var c=b.resource_id;return d.AddUser({storage:a.storage,featureId:c,userId:a.data.owner,data:{read:!0,write:!0,is_admin:!0}}),c},function(){b.alerts=[],b.alerts.push({type:"error",title:"Uh-oh!",details:"Mind trying that again? We couldn't find the Feature you were looking for."})});return c},d.UpdateFeature=function(a){var c=d.update({storage:a.storage,featureId:a.featureId},a.data).$promise.then(function(a){return a},function(){b.alerts=[],b.alerts.push({type:"error",title:"Uh-oh!",details:"Mind trying that again? We couldn't find the Feature you were looking for."})});return c},d.GetFeatureUsers=function(a){var b=d.users({storage:a.storage,featureId:a.featureId}).$promise.then(function(a){return a.response.users});return b},d.GetFeatureUser=function(a){var b=d.user({storage:a.storage,featureId:a.featureId,userId:a.userId}).$promise.then(function(a){return a.response});return b},d.AddUser=function(a){console.log("options",a);var b=d.createUser({storage:a.storage,featureId:a.featureId,userId:a.userId},a.data).$promise.then(function(a){return a});return b},d.RemoveUser=function(a){console.log("options",a);var b=d.removeUser({storage:a.storage,featureId:a.featureId,userId:a.userId}).$promise.then(function(a){return a});return b},d.getFilters=function(a){var b=[];return angular.forEach(a.available,function(a){angular.forEach(a.filter,function(c){null!==c.value&&b.push({name:a.field,op:c.op,val:"ilike"===c.op?"%"+c.value+"%":c.value})})}),b},d.buildFilters=function(a,b){var c=[],e={text:["text","textarea","list","email","phone","url"],number:["float","whole_number"],date:["date","time"]},f=angular.fromJson(b.q);return angular.forEach(a,function(a){d.inList(a.data_type,e.text)?c.push({label:a.label,field:a.name,type:"text",active:d.getDefault(a,"ilike",f)?!0:!1,filter:[{op:"ilike",value:d.getDefault(a,"ilike",f)}]}):d.inList(a.data_type,e.number)?c.push({label:a.label,field:a.name,type:"number",active:!1,filter:[{op:"gte",value:d.getDefault(a,"gte",f)},{op:"lte",value:d.getDefault(a,"lte",f)}]}):d.inList(a.data_type,e.date)&&c.push({label:a.label,field:a.name,type:"date",active:!1,filter:[{op:"gte",value:d.getDefault(a,"gte",f)},{op:"lte",value:d.getDefault(a,"lte",f)}]})}),c},d.getDefault=function(a,b,c){var d=null;return c&&void 0!==c.filters&&angular.forEach(c.filters,function(c){a.name===c.name&&b===c.op&&(d="ilike"===c.op?c.val.replace(/%/g,""):c.val)}),d},d.inList=function(a,b){var c;for(c=0;c<b.length;c++)if(b[c]===a)return!0;return!1},d}]}),angular.module("practiceMonitoringAssessmentApp").provider("Field",function(){this.$get=["$resource",function(a){var b=a("//api.commonscloud.org/v2/templates/:templateId/fields/:fieldId.json",{},{query:{method:"GET",isArray:!0,url:"//api.commonscloud.org/v2/templates/:templateId/fields.json",transformResponse:function(a){var b=angular.fromJson(a);return b.response.fields}},save:{method:"POST",url:"//api.commonscloud.org/v2/templates/:templateId/fields.json"},update:{method:"PATCH"},"delete":{method:"DELETE",url:"//api.commonscloud.org/v2/templates/:templateId/fields/:fieldId.json"}});return b.PrepareFields=function(a){var b=[];return angular.forEach(a,function(a){"list"===a.data_type&&(a.options=a.options.split(",")),b.push(a)}),b},b.PrepareFieldsObject=function(a){var b={};return angular.forEach(a,function(a){"list"===a.data_type&&(a.options=a.options.split(",")),b[a.name]=a}),b},b.GetPreparedFields=function(a,c){var d=b.query({templateId:a,updated:(new Date).getTime()}).$promise.then(function(a){return c&&"object"===c?b.PrepareFieldsObject(a):b.PrepareFields(a)});return d},b.GetFields=function(a){var c=b.query({templateId:a,updated:(new Date).getTime()}).$promise.then(function(a){return a});return c},b.GetField=function(a,c){var d=b.get({templateId:a,fieldId:c,updated:(new Date).getTime()}).$promise.then(function(a){return a.response});return d},b}]}),angular.module("practiceMonitoringAssessmentApp").provider("Template",function(){this.$get=["$resource",function(a){var b=a("//api.commonscloud.org/v2/templates/:templateId.json",{},{activity:{method:"GET",url:"//api.commonscloud.org/v2/templates/:templateId/activity.json"},user:{method:"GET",url:"//api.commonscloud.org/v2/templates/:templateId/users/:userId.json"},users:{method:"GET",url:"//api.commonscloud.org/v2/templates/:templateId/users.json"},get:{method:"GET",url:"//api.commonscloud.org/v2/templates/:templateId.json"},query:{method:"GET",isArray:!0,url:"//api.commonscloud.org/v2/applications/:applicationId/templates.json",transformResponse:function(a){var b=angular.fromJson(a);return b.response.templates}},save:{method:"POST",url:"//api.commonscloud.org/v2/applications/:applicationId/templates.json"},update:{method:"PATCH"}});return b.GetTemplate=function(a){var c=b.get({templateId:a,updated:(new Date).getTime()}).$promise.then(function(a){return a.response});return c},b.GetTemplateList=function(a){var c=b.query({applicationId:a,updated:(new Date).getTime()}).$promise.then(function(a){return a});return c},b.GetActivities=function(a){var c=b.activity({templateId:a,updated:(new Date).getTime()}).$promise.then(function(a){return a.response.activities});return c},b.GetTemplateUsers=function(a){var c=b.users({storage:a.storage,templateId:a.templateId}).$promise.then(function(a){return a.response});return c},b.GetTemplateUser=function(a){var c=b.user({storage:a.storage,templateId:a.templateId,userId:a.userId}).$promise.then(function(a){return a.response});return c},b}]}),angular.module("practiceMonitoringAssessmentApp").provider("User",function(){this.$get=["$resource","$rootScope","$location","$q","ipCookie","$timeout",function(a,b,c,d,e){var f=a("//api.commonscloud.org/v2/user/me.json",{},{query:{method:"GET",url:"//api.commonscloud.org/v2/users.json",isArray:!1,transformResponse:function(a){return angular.fromJson(a)}}});return f.GetUsers=function(){var a=f.query().$promise.then(function(a){return a.response.users});return a},f.getUser=function(){var a=f.get().$promise.then(function(a){b.user=a.response;var c=a.response;return c},function(a){if(401===a.status||403===a.status){console.error("Couldn't retrieve user information from server., need to redirect and clear cookies");var d=e("COMMONS_SESSION");d&&void 0!==d&&"undefined"!==d&&(e.remove("COMMONS_SESSION"),e.remove("COMMONS_SESSION",{path:"/"}),b.alerts=b.alerts?b.alerts:[],b.alerts.push({type:"info",title:"Please sign in again",details:"You may only sign in at one location at a time"}),c.hash(""),c.path("/"))}});return a},f}]}),angular.module("practiceMonitoringAssessmentApp").factory("AuthorizationInterceptor",["$rootScope","$q","ipCookie","$location",function(a,b,c,d){return{request:function(a){if("external"===a.headers.Authorization)return delete a.headers.Authorization,a||b.when(a);var e=c("COMMONS_SESSION");return"/views/authorize.html"===a.url||"undefined"!==e&&void 0!==e?(a.headers=a.headers||{},e&&(a.headers.Authorization="Bearer "+e),a.headers["Cache-Control"]="no-cache, max-age=0, must-revalidate",console.debug("AuthorizationInterceptor::Request",a||b.when(a)),a||b.when(a)):(d.hash(""),d.path("/"),a||b.when(a))},response:function(a){return console.debug("AuthorizationInterceptor::Response",a||b.when(a)),a||b.when(a)},responseError:function(a){return!a||401!==a.status&&403!==a||console.error("Couldn't retrieve user information from server., need to redirect and clear cookies"),a&&a.status>=404&&console.log("ResponseError",a),a&&a.status>=500&&console.log("ResponseError",a),b.reject(a)}}}]).config(["$httpProvider",function(a){a.interceptors.push("AuthorizationInterceptor")}]),angular.module("practiceMonitoringAssessmentApp").filter("toArray",function(){return function(a){var b=[];return angular.forEach(a,function(a){b.push(a)}),b}});