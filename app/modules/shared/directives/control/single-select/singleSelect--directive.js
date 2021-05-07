(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('singleSelect', [
            '$window',
            'environment',
            'QueryParamManager',
            function($window, environment, QueryParamManager) {
                return {
                    restrict: 'EA',
                    scope: {
                        'allowSearch': '=?',
                        'attrKey': '@',
                        'noop': '&',
                        'noopLabel': '@',
                        'options': '=?',
                        'placeholder': '@placeholder',
                        'postSelect': '&',
                        'selection': '=?',
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'control/single-select/singleSelect--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        scope.modalDisplay = {};

                        scope.preparedOptions = [];

                        scope.toggleModal = function (key) {

                            var visible = scope.modalDisplay[key];

                            scope.modalDisplay[key] = !visible;

                        };

                        scope.filterOptions = function (query) {

                            if (!query) {

                                return scope.preparedOptions;

                            }

                            return scope.preparedOptions.filter(function(option) {
                                return option.label.toLowerCase().indexOf(query.toLowerCase()) >= 0;
                            });

                        };

                        scope.setSelection = function (token, noop) {

                            console.log(
                                'singleSelect:setSelection:token:',
                                token
                            );

                            scope.toggleModal('select');

                            scope.selection = token;

                            console.log(
                                'singleSelect:setSelection:postSelect:',
                                scope.postSelect
                            );

                            if (scope.postSelect) {

                                scope.postSelect({
                                    token: token
                                });

                            }

                            if (noop && scope.noop) {

                                scope.noop({});

                            }

                        };

                        scope.$watch('options', function (newVal) {

                            if (Array.isArray(newVal)) {

                                console.log(
                                    'singleSelect:options:',
                                    newVal
                                );

                                console.log(
                                    'singleSelect:attrKey:',
                                    scope.attrKey
                                );

                                var cp = JSON.parse(JSON.stringify(newVal));

                                if (typeof scope.attrKey === 'string') {

                                    var key = scope.attrKey;

                                    // var cp = JSON.parse(JSON.stringify(newVal));

                                    var options = [];

                                    cp.forEach(function (item) {

                                        if (item.hasOwnProperty(key)) {

                                            options.push(item[key]);

                                        }

                                    });

                                    if (options.length === newVal.length) {

                                        scope.preparedOptions = options;

                                    }

                                } else {

                                    scope.preparedOptions = cp;

                                }

                            }

                        });

                        scope.$watch('selection', function (newVal, oldVal) {

                            if (typeof newVal !== 'string' &&
                                typeof scope.noopLabel === 'string') {

                                scope.selection = scope.noopLabel;

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

                                    scope.modalDisplay = {};

                                });

                            }

                        });

                    }

                };

            }

        ]);

}());