(function() {

    'use strict';

    angular.module('FieldDoc')
        .directive('memberRoleDialog', [
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
                        'parentType': '@',
                        'visible': '=?'
                    },
                    templateUrl: function(elem, attrs) {

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'dialog/member/role/',
                            // Directive file
                            'memberRoleDialog--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function(scope, element, attrs) {

                        console.log(
                            'memberRoleDialog:parentType:',
                            scope.parentType
                        );

                        if (scope.parentType !== 'organization' &&
                            scope.parentType !== 'project') {

                            throw 'Unsupported `parent-type` setting.';

                        }

                        scope.activeRadio = {};

                        if (typeof scope.resetType === 'undefined') {

                            scope.resetType = true;

                        }

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        scope.closeChildModal = function(refresh) {

                            console.log(
                                'memberRoleDialog:closeChildModal:'
                            );

                            scope.visible = false;

                            scope.setRole(scope.feature.role);

                            if (refresh && scope.callback) scope.callback();

                        };

                        scope.changeRole = function(role) {

                            console.log('m', Membership);

                            var data = scope.feature;

                            data.role = role;

                            Membership.update({
                                id: scope.feature.id,
                                type: scope.parentType
                            }, data).$promise.then(function(successResponse) {

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': 'Role changed.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                                scope.closeChildModal(true);

                            }, function(errorResponse) {

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': 'Unable to change role.',
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.setRole = function(role) {

                            console.log(
                                'memberRoleDialog:role:',
                                scope.role
                            );

                            scope.role = role;

                            scope.activeRadio = {};

                            scope.activeRadio[role] = true;

                            console.log(
                                'memberRoleDialog:role[2]:',
                                scope.role
                            );

                        };

                        scope.$watch('feature', function (newVal) {

                            if (newVal && newVal.role) {

                                scope.activeRadio = {};

                                scope.activeRadio[newVal.role] = true;

                            }

                        });

                    }

                };

            }

        ]);

}());