(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('invitationDialog', [
            'environment',
            '$routeParams',
            '$filter',
            '$parse',
            '$location',
            'SearchService',
            'Membership',
            '$timeout',
            function(environment, $routeParams, $filter, $parse,
                     $location, SearchService, Membership, $timeout) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'modalDisplay': '=?',
                        'target': '=?',
                        'targetType': '@',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/invitation/invitationDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        if (typeof scope.resetType === 'undefined') {

                            scope.resetType = true;

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function() {

                            scope.visible = false;

                        };

                        scope.sendInvitation = function(email) {

                            if (!email || typeof email === 'undefined') return;

                            var data = {
                                'target_type': scope.targetType,
                                'target_id': scope.target.id,
                                'member_email': email
                            };

                            Membership.invite(
                                data
                            ).$promise.then(function(successResponse) {

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Invitation sent.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                                scope.closeChildModal();

                            }, function(errorResponse) {

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Something went wrong while attempting to send the invitation.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });

                        };

                    }

                };

            }

        ]);

}());