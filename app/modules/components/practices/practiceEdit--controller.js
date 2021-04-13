'use strict';

/**
 * @ngdoc function
 * @name
 * @description
 */
angular.module('FieldDoc')
    .controller('PracticeEditController',
        function(Account,  Image, $log, $location, Media, Practice,
                 PracticeType, practice, $q, $rootScope,
                 $route, $scope, $timeout, $interval, site, user, Project, Utility) {

            var self = this;

            $rootScope.toolbarState = {
                'edit': true
            };

            $rootScope.page = {};

            self.status = {
                loading: true,
                processing: true
            };

            self.alerts = [];

            function closeAlerts() {

                self.alerts = [];

            }

            function closeRoute() {

                if (self.practice.site !== null) {
                    $location.path(self.practice.links.site.html);
                } else {
                    $location.path("/projects/" + self.practice.project.id);
                }

            }

            function railsRedirection(){
                window.location.replace("/practices/"+self.practice.id+"/location");
            }

            self.showElements = function() {

                $timeout(function() {

                    self.status.loading = false;

                    self.status.processing = false;

                }, 500);

            };

            self.loadSite = function() {

                site.$promise.then(function(successResponse) {

                    console.log('self.site', successResponse);

                    self.site = successResponse;

                  //  self.loadPractice();

                }, function(errorResponse) {

                    //

                });

            };

            self.loadPractice = function() {

                practice.$promise.then(function(successResponse) {

                    console.log('self.practice', successResponse);

                    self.practice = successResponse;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                        return;

                    }

                    self.permissions.can_edit = successResponse.permissions.write;
                    self.permissions.can_delete = successResponse.permissions.write;

                    self.project_id = successResponse.project_id;

                    if (successResponse.practice_type) {

                        self.practiceType = successResponse.practice_type;

                    }

                    if (successResponse.site_id){
                        self.site = successResponse.site;
                    }

                    $rootScope.page.title = self.practice.name ? self.practice.name : 'Un-named Practice';

                    self.loadSites();

                    self.processSetup(self.practice.setup);

                    //
                    // Load practice types
                    //

                   self.loadProject(self.project_id);

                    self.showElements();
                    /*
                    console.log("self.practice.project -->",self.practice.project);

                    PracticeType.collection({
                        program: self.practice.project.program_id,
                        limit: 500,
                        group: 'alphabet',
                        minimal: true,
                        program_only: true
                    }).$promise.then(function(successResponse) {

                        console.log('self.practiceTypes', successResponse);

                        self.practiceTypes = successResponse.features.groups;

                        self.summary = successResponse.summary;

                        self.letters = successResponse.features.letters;

                        self.showElements();

                    }, function(errorResponse) {

                        //

                        self.showElements();

                    });
                    */
                }, function(errorResponse) {

                    //
                    self.showElements();

                });

            };

            /*START Practice Type list creation*/


            /*processFeature is a helper function for LoadProject*/
            self.processFeature = function(data) {

                self.project = data;

                if (self.project.program) {

                    self.program = self.project.program;

                }

                self.tempPartners = self.project.partners;

                self.status.processing = false;

            };
            self.loadProject = function(projectId){

                var exclude = [
                    'centroid',
                    'creator',
                    'dashboards',
                    'extent',
                    'geometry',
                    'members',
                    'metric_types',
                    // 'partners',
                    'practices',
                    'practice_types',
                    'properties',
                    'tags',
                    'targets',
                    'tasks',
                    'sites'
                ].join(',');

                //
                // Assign project to a scoped variable
                //
                Project.getSingle({
                    id: projectId,
                    exclude: exclude
                }).$promise.then(function(successResponse) {

                    console.log("self.project-->",successResponse);

                    self.project = successResponse;

                    self.projectPrograms = self.project.programs;

                    if (!successResponse.permissions.read &&
                        !successResponse.permissions.write) {

                        self.makePrivate = true;

                    } else {

                        self.processFeature(successResponse);

                        self.permissions.can_edit = successResponse.permissions.write;
                        self.permissions.can_delete = successResponse.permissions.write;

                        $rootScope.page.title = 'Edit Project';

                    }

                    console.log("Project Programs -->", self.projectPrograms)

                    self.status.loading = false;

                    self.loadPracticeTypes(self.projectPrograms);

                    self.showElements();

                }, function(errorResponse) {

                    console.log('Unable to load request project');

                    self.status.loading = false;

                    self.showElements();

                });
            }

            self.loadPracticeTypes = function(program_arr){

                self.practiceTypeSets = [];

                let i = 1;

                console.log("program_arr-->", program_arr);

                /*Let's first loop over the program arr recieved from the
                * project*/

                program_arr.forEach(function(program){

                    /*for each program, we're going to create an object
                    * to store the data we'll need later. Part of of this object
                    * are set as empty arrays, and will be filled by the return results*/

                    let set = {
                        'program_id' : program.id,
                        'program_name' : program.name,
                        'practiceTypes' : [],
                        'letters' : [],
                        'summary' : []
                    };

                    PracticeType.collection({
                        program: program.id,
                        group: 'alphabet'
                    }).$promise.then(function(successResponse) {

                        /*Now lets populate our locally scoped program object
                        * with the return results*/

                        set.practiceTypes = successResponse.features.groups;

                        set.letters = successResponse.features.letters;

                        set.summary = successResponse.summary;

                        self.practiceTypeSets.push(set);

                        /*Here we're going to check the length of our new array of against
                        * the length of the original array.
                        * This is to overcome latency of requests and javascript's asychronis threads
                        * Only after the array lengths match, will we call the method
                        * needed to start reconciling them.
                        * */

                        if(i == program_arr.length){

                            console.log( "self.practiceTypeSets",  self.practiceTypeSets);

                            self.processPracticeTypes(self.practiceTypeSets);

                        }

                        i=i+1;

                    }, function(errorResponse) {

                        console.log('errorResponse', errorResponse);

                    });

                   // console.log( "XXX self.practiceTypeSets",  self.practiceTypeSets);
                });

            };

            self.processPracticeTypes = function(program_arr){

                console.log( "self.practiceTypeSets",  program_arr);

                /* practiceType_arr is expected to have the following structure:
                *   Array (self)
                *   ↳ Object (program group)
                *   ↳↳ Array (letter group)
                *   ↳↳↳ Object (practice type)
                * */

                /*self.practiceTypes is an object of arrays*/
                self.practiceTypes = {}

                /*self.summary is a simple object*/
                self.summary = {}

                /*self.letters is a simple array*/
                self.letters = []


                /*  Practice Type Letters
                * Okay, so we're going to loop over the program array
                * we then concat all the letter arrays into one.

                * */

                let tempLetters = [];
            //    let tempSummary = 0;

                program_arr.forEach(function(program){

                    console.log("program.letters", program.letters);

                    tempLetters = tempLetters.concat(program.letters);

               //     tempSummary = program.summary.matches + tempSummary;

                });

                /*We then convert the concatenated array of letters to set,
                * eliminating duplicates.
                * We then convert it back to an array, and sort
                * to arrange it alphabetically.*/

                tempLetters = new Set(tempLetters);

                tempLetters = Array.from(tempLetters);

                tempLetters.sort();

                self.letters = tempLetters;

                /*Now we reduce the letter array to an object of empty arrays*/

                self.practiceTypes = tempLetters.reduce((acc,curr)=> (acc[curr]=[],acc),{});

               /*Okay, so first let copy (not reference) our practiceType list
               * so we get an object of letters each set to an empty array, yay!*/

                let allPracticeTypes = Object.assign({}, self.practiceTypes);

                /*Now, loop over our programs*/

                program_arr.forEach(function(program){

                    /*loop through the simple letter array*/

                    self.letters.forEach(function(letter){

                        /*Check if the current letter exists in the program, if it does
                        * concat the array to our allPracticeTypes array for the letter */

                        if(program.practiceTypes[letter]){

                            allPracticeTypes[letter] = allPracticeTypes[letter].concat(program.practiceTypes[letter]);

                        }

                    });

                });

                /*Now, lets make a new copy (not reference) of our letter object with empty arrays.
                * This is so we have a data structure ready to put our culled items into*/

                let tempPracticeTypes = Object.assign({}, self.practiceTypes);

                /*And we loop over the letters again*/

                self.letters.forEach(function(letter){

                    /*And then loop over list of all practices types for that letter*/

                    allPracticeTypes[letter].forEach(function(item,index){

                        /*We set a flag, assuming no duplicate name has been found*/

                        let found = false;

                        /*Okay, so, remember that ready data structure,
                        * well, now we're going to check if the current letter group array has any elements.
                        * If it doesn't, we push the current item from the allPracticeTypes letter group into it (see else{} below)
                        */

                        if(tempPracticeTypes[letter].length > 0){

                        /* If it does have length, the we need to compare the value of 'name'
                            from the current item from the allPracticeTypes list to every item in our
                            subject data structure. We do this with a loop.
                        */

                            tempPracticeTypes[letter].forEach(function(addedItem, index2){

                                /*Check the name value, if true, it's been found.*/

                                if(addedItem.name == allPracticeTypes[letter][index].name){

                                    found = true;

                                }

                            });

                            /*If found remains false after our loop over added items, we push
                            * the item from the allPracticeType list into our data struct*/

                            if(found === false){

                                tempPracticeTypes[letter].push(allPracticeTypes[letter][index]);

                            }

                        }else{

                            tempPracticeTypes[letter].push(allPracticeTypes[letter][index]);

                        }

                    });

                });
                    

                console.log(' self.practiceTypes-->', self.practiceTypes);

            };

            /*END Practice Type list creation*/


            /*START STATE CALC*/

            self.processSetup = function(setup){

                const next_action = setup.next_action;

                self.states = setup.states;

                self.next_action = next_action;

                console.log("self.states",self.states);

                console.log("self.next_action",self.next_action);

                console.log("self.next_action_lable",self.next_action_lable);

            };

            /*END STATE CALC*/

            self.loadSites = function() {

                console.log('self.loadSites --> Starting...');

                Project.sites({
                    id: self.practice.project.id,
                    t: Date.now()
                }).$promise.then(function(successResponse) {

                    console.log('Project sites --> ', successResponse);

                    var sites = [];

                    successResponse.features.forEach(function(item) {

                        var data = item.properties;

                        if (typeof data.name === 'string' &&
                            data.name.length) {

                            sites.push(data);

                        }

                    });

                    self.sites = sites;

                }, function(errorResponse) {

                    console.log('loadSites.errorResponse', errorResponse);

                });

            };

            self.scrubFeature = function(feature) {

                var excludedKeys = [
                    'allocations',
                    'creator',
                    'dashboards',
                    'geographies',
                    'geometry',
                    'images',
                    'last_modified_by',
                    'members',
                    'metrics',
                    'metric_types',
                    'organization',
                    'partners',
                    'partnerships',
                    'practices',
                    'practice_types',
                    'program',
                    'project',
                    'reports',
                    'sites',
                    'status',
                    'tags',
                    'tasks',
                    'users'
                ];

                var reservedProperties = [
                    'links',
                    'map_options',
                    'permissions',
                    '$promise',
                    '$resolved'
                ];

                excludedKeys.forEach(function(key) {

                    if (feature.properties) {

                        delete feature.properties[key];

                    } else {

                        delete feature[key];

                    }

                });

                reservedProperties.forEach(function(key) {

                    delete feature[key];

                });

            };

            self.savePractice = function() {

                self.status.processing = true;

                self.scrubFeature(self.practice);

                if (self.practiceType) {

                    self.practice.practice_type_id = self.practiceType.id;

                }

                var invalid = [];

                self.invalidType = false;
                self.invalidName = false;

                if (typeof self.practice.name === 'undefined') {

                    console.log("self.practice.name", self.practice.name);

                    invalid.push("Name");

                    self.invalidName = true;

                }

                if (typeof self.practice.practice_type_id === 'undefined') {

                    console.log("self.practiceType", self.practiceType);

                    invalid.push("Practice Type");

                    self.invalidType = true;

                }

                if (invalid.length > 0) {

                    self.status.processing = false;

                    console.log("invalid",invalid);

                    self.alerts = [{
                        'type': 'success',
                        'flag': 'Success!',
                        'msg': 'One or more required fields are missing!',
                        'prompt': 'OK'
                    }];

                    $timeout(closeAlerts, 2000);

                } else {

                    Practice.update({
                        id: self.practice.id
                    }, self.practice).then(function(successResponse) {

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practice changes saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        if (self.practice.geometry === null) {
                            $timeout(railsRedirection,3000);
                        }

                        self.showElements();

                    }).catch(function(errorResponse) {

                        // Error message

                        self.alerts = [{
                            'type': 'success',
                            'flag': 'Success!',
                            'msg': 'Practice changes could not be saved.',
                            'prompt': 'OK'
                        }];

                        $timeout(closeAlerts, 2000);

                        self.showElements();

                    });

                }

            };

            /*END STATE CALC*/

            self.setPracticeType = function($item, $model, $label) {

                console.log('self.practiceType', $item);

                self.practiceType = $item;

                self.practice.practice_type_id = $item.id;

            };

            self.setSite = function($item) {

                console.log('self.site', $item);

                self.site = $item;

                self.practice.site_id = $item.id;

            };

            //
            // Verify Account information for proper UI element display
            //

            if (Account.userObject && user) {

                user.$promise.then(function(userResponse) {

                    $rootScope.user = Account.userObject = userResponse;

                    self.user = Account.userObject = userResponse;

                    self.permissions = {
                        can_edit: false
                    };

//                    self.loadProject();

                    self.loadPractice();
                });

            } else {

                $location.path('/logout');

            }

        });