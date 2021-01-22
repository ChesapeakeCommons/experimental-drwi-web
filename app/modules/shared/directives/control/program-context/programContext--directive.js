(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('programContext', [
            '$window',
            'environment',
            'QueryParamManager',
            function($scope,$window, environment) {
                return {
                    restrict: 'EA',
                    scope: {
                        'collection': '@collection',
                        'features': '=?',
                        'antecedent': '=?',
                        'displayStates': '=?',
                        'controllerMethod' : '='
                    },

                    templateUrl: function(scope, elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'control/program-context/programContext--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs, ctrl) {

                        if (typeof scope.trackName === 'undefined') {

                            scope.trackName = true;

                        }

                        scope.modalVisible = false;

                        scope.toggleModal = function (filterValue, resetFilter) {

                            console.log("TOGGLE MODAL");

                            resetFilter = resetFilter || false;

                            var collection = scope.collection;

                            console.log(
                                'toggleModal:collection:',
                                collection
                            );

                            scope.modalVisible = !scope.modalVisible;

                            console.log(
                                'toggleModal:visible:',
                                scope.visible
                            );






                        };



                    }

                };

            }

        ]);

}());