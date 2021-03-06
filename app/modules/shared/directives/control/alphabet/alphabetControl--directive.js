(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('alphabetCtrl', [
            '$window',
            'environment',
            'AnchorScroll',
            function($window, environment, AnchorScroll) {
                return {
                    restrict: 'EA',
                    scope: {
                        'center': '=?',
                        'forceTop': '@',
                        'hiddenKeys': '=?',
                        'letters': '=?',
                        'orientation': '@orientation',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'control/alphabet/alphabetControl--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        scope.justifyContent = scope.center ? 'center' : 'flex-start';

                        scope.scrollManager = AnchorScroll;

                        scope.scrollTop = (scope.forceTop === 'true');

                        scope.resetScroll = function () {

                            $window.scrollTo(0, 0);

                        };

                    }

                };

            }

        ]);

}());