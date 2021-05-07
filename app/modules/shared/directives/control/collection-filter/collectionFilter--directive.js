(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('collectionFilter', [
            '$window',
            'environment',
            'QueryParamManager',
            function($window, environment, QueryParamManager) {
                return {
                    restrict: 'EA',
                    scope: {
                        'collection': '@collection',
                        'displayStates': '=?',
                        'dropdownMinWidth': '=?',
                        'features': '=?',
                        'params': '=?',
                        'trackName': '=?',
                        'update': '&'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'control/collection-filter/collectionFilter--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        if (typeof scope.trackName === 'undefined') {

                            scope.trackName = true;

                        }

                        if (typeof scope.dropdownMinWidth !== 'number') {

                            scope.dropdownMinWidth = 240;

                        }

                        scope.modalVisible = false;

                        scope.toggleModal = function (filterValue, resetFilter) {

                            resetFilter = resetFilter || false;

                            var collection = scope.collection;

                            console.log(
                                'toggleModal:collection:',
                                collection
                            );

                            scope.modalVisible = !scope.modalVisible;

                            // var visible = scope.displayStates[collection] || false;

                            console.log(
                                'toggleModal:visible:',
                                scope.visible
                            );

                            // scope.displayStates = {};
                            //
                            // scope.displayStates[collection] = !visible;

                            // console.log(
                            //     'toggleModal:displayStates:',
                            //     scope.displayStates
                            // );

                            if (resetFilter) {

                                if (filterValue && filterValue !== 0 &&
                                    filterValue !== 'all') {

                                    scope.params[scope.collection] = filterValue;

                                } else {

                                    delete scope.params[scope.collection];

                                }

                                scope.params.page = 1;

                                QueryParamManager.setParams(scope.params);

                                scope.update({
                                    params: scope.params
                                });

                            }

                            console.log(
                                'toggleModal:params:',
                                scope.params
                            );

                        };

                        scope.$watch('params', function (newVal) {

                            if (newVal) {

                                scope.params = newVal;

                            }

                        });

                        scope.$on('globalClick', function (event, target) {

                            console.log(
                                'globalClick:tableView:event:',
                                event
                            );

                            console.log(
                                'globalClick:collectionFilter:target:',
                                target
                            );

                            if (!element[0].contains(target)) {

                                scope.$apply(function () {

                                    console.log(
                                        'globalClick:collectionFilter:event:$apply'
                                    );

                                    scope.modalVisible = false;

                                });

                            }

                        });

                    }

                };

            }

        ]);

}());