(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('revokeMemberDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'Membership',
            '$timeout',
            function(environment, $routeParams, $filter, $parse,
                     $location, Membership, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'feature': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/member/revoke/',
                            // Directive file
                            'revokeMemberDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function(refresh) {

                            scope.processing = false;

                            scope.deletionError = null;

                            scope.visible = false;

                            if (refresh && scope.callback) scope.callback();

                        };

                        scope.deleteFeature = function() {

                            var targetId;

                            if (scope.feature.properties) {

                                targetId = scope.feature.properties.id;

                            } else {

                                targetId = scope.feature.id;

                            }

                            Membership.delete({
                                id: +targetId
                            }).$promise.then(function(data) {

                                scope.alerts.push({
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Successfully revoked this membership.',
                                    'prompt': 'OK'
                                });

                                scope.closeChildModal(true);

                                $timeout(closeAlerts, 2000);

                            }).catch(function(errorResponse) {

                                console.log(
                                    'scope.deleteFeature.errorResponse',
                                    errorResponse);

                                if (errorResponse.status === 409) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Unable to revoke membership.',
                                        'prompt': 'OK'
                                    }];

                                } else if (errorResponse.status === 403) {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'You don’t have permission to revoke this membership.',
                                        'prompt': 'OK'
                                    }];

                                } else {

                                    scope.alerts = [{
                                        'type': 'error',
                                        'flag': 'Error!',
                                        'msg': 'Something went wrong while attempting to revoke this membership.',
                                        'prompt': 'OK'
                                    }];

                                }

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.$watch('visible', function (newVal) {

                            console.log(
                                'revokeMemberDialog:visible',
                                newVal
                            );

                        });

                    }

                };

            }

        ]);

}());