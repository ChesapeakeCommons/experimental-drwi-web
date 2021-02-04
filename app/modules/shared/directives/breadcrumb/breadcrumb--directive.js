(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('breadcrumb', [
            'environment',
            '$timeout',
            function (environment, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'metric': '=?',
                        'organization': '=?',
                        'pad': '=?',
                        'practice': '=?',
                        'practiceType': '=?',
                        'program': '=?',
                        'project': '=?',
                        'report': '=?',
                        'rootPath': '@',
                        'site': '=?',
                        'tail': '@',
                        'territory': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'breadcrumb/breadcrumb--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        //
                        // Additional scope vars.
                        //

                        scope.calcAvailWidth = function () {

                            var parent = document.querySelector(
                                '.breadcrumb');

                            var parentWidth;

                            if (parent) {

                                parentWidth = (parent.clientWidth * 0.90);

                            }

                            var anchorEls = document.querySelectorAll(
                                '.anchor');

                            var anchorWidth = 0;

                            for (var i = 0; i < anchorEls.length; i++) {

                                var el = anchorEls[i];

                                anchorWidth += el.clientWidth;

                            }

                            return parentWidth - anchorWidth;

                        };

                        scope.setBasis = function () {

                            //
                            // The following conditions are abortive.
                            //

                            if (scope.report && !scope.practice) return;

                            if (scope.practice && !scope.project) return;

                            if (scope.site && !scope.project) return;

                            $timeout(function () {

                                var collapseEls = document.querySelectorAll(
                                    '.breadcrumb div:not(.anchor)');

                                var count = collapseEls.length;

                                scope.basis = Math.floor(scope.calcAvailWidth() / count);

                                console.log(
                                    'scope.basis',
                                    scope.basis
                                );

                            }, 50)

                        };

                        scope.$watch('report', function (newVal) {

                            scope.setBasis();

                        });

                        scope.$watch('practice', function (newVal) {

                            scope.setBasis();

                        });

                        scope.$watch('metric', function (newVal) {

                            scope.setBasis();

                        });

                        scope.$watch('practiceType', function (newVal) {

                            scope.setBasis();

                        });

                        scope.$watch('site', function (newVal) {

                            scope.setBasis();

                        });

                        scope.$watch('program', function (newVal) {

                            scope.setBasis();

                        });

                        scope.$watch('project', function (newVal) {

                            scope.setBasis();

                        });

                    }

                };

            }

        ]);

}());