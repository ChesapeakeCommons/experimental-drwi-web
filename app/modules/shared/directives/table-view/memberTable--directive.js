(function () {

    'use strict';

    angular.module('FieldDoc')
        .directive('memberTable', [
            'environment',
            '$window',
            '$timeout',
            '$location',
            'AnchorScroll',
            'Membership',
            function (environment, $window, $timeout, $location, AnchorScroll, Membership) {
                return {
                    restrict: 'EA',
                    scope: {
                        'alerts': '=?',
                        'callback': '&',
                        'featureType': '@',
                        'includeMod': '=?',
                        'index': '=?',
                        'parentType': '@',
                        'permissions': '=?',
                        'visible': '=?'
                    },
                    templateUrl: function (elem, attrs) {

                        console.log(
                            'memberTable:attrs:',
                            attrs
                        );

                        return [
                            // Base path
                            'modules/shared/directives/',
                            // Directive path
                            'table-view/views/',
                            // Template file
                            attrs.featureType + 'Table--view.html',
                            // Query string
                            '?t=' + environment.version
                        ].join('');

                    },
                    link: function (scope, element, attrs) {

                        if (scope.parentType !== 'organization' &&
                            scope.parentType !== 'project') {

                            throw 'Unsupported `parent-type` setting.';

                        }

                        $window.scrollTo(0, 0);

                        function closeAlerts() {

                            scope.alerts = [];

                        }

                        //
                        // Additional scope vars.
                        //

                        scope.tipManager = {};

                        scope.modalManager = {
                            action: undefined
                        };

                        scope.dialogManager = {
                            dialog: undefined
                        };

                        scope.resetTip = function (key, membershipId) {

                            var existing = scope.tipManager[key];

                            scope.modalManager = {};

                            scope.tipManager = {};

                            if (existing === membershipId) return;

                            if (key && membershipId) {
                                scope.tipManager[key] = membershipId;
                            }

                        };

                        scope.toggleActionModal = function (membershipId) {

                            var existing = scope.modalManager.action;

                            scope.tipManager = {};

                            scope.modalManager = {};

                            if (existing === membershipId) return;

                            if (membershipId) {
                                scope.modalManager.action = membershipId;
                            }

                        };

                        scope.presentDialog = function (membership, action) {

                            console.log(
                                'memberTable:presentDialog',
                                membership,
                                action
                            );

                            scope.membership = membership;

                            scope.modalManager = {};

                            scope.dialogManager = {};

                            scope.dialogManager[action] = true;

                            console.log(
                                'memberTable:presentDialog:dialogManager',
                                scope.dialogManager
                            );

                        };

                        scope.archiveMembership = function (membership, archived) {

                            archived = archived || false;

                            var data = {
                                archived: archived,
                                private: membership.private ? membership.private : false
                            };

                            var successMsg,
                                errorMsg;

                            if (archived) {

                                successMsg = 'Membership moved to archive.';

                                errorMsg = 'Something went wrong and the membership was not archived.';

                            } else {

                                successMsg = 'Membership restored from archive.';

                                errorMsg = 'Something went wrong and the membership was not restored from the archive.';

                            }

                            Membership.update({
                                id: membership.id
                            }, data).$promise.then(function(successResponse) {

                                scope.callback();

                                scope.alerts = [{
                                    'type': 'success',
                                    'flag': 'Success!',
                                    'msg': successMsg,
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            }).catch(function(error) {

                                // Do something with the error

                                scope.alerts = [{
                                    'type': 'error',
                                    'flag': 'Error!',
                                    'msg': errorMsg,
                                    'prompt': 'OK'
                                }];

                                $timeout(closeAlerts, 2000);

                            });

                        };

                        scope.$on('globalClick', function (event, target) {

                            console.log(
                                'globalClick:memberTable:event:',
                                event
                            );

                            console.log(
                                'globalClick:memberTable:target:',
                                target
                            );

                            if (!element[0].contains(target)) {

                                console.log(
                                    'globalClick:memberTable:contains(target):',
                                    element[0].contains(target)
                                );

                                scope.$apply(function () {

                                    console.log(
                                        'globalClick:memberTable:event:$apply'
                                    );

                                    if (typeof scope.tipManager.confirmed !== 'undefined') {

                                        console.log(
                                            'globalClick:memberTable:event:$apply:closeTip',
                                            scope.tipManager
                                        );

                                        scope.tipManager = {};

                                    }

                                    if (typeof scope.modalManager.action !== 'undefined') {

                                        console.log(
                                            'globalClick:memberTable:event:$apply:closeModal',
                                            scope.modalManager
                                        );

                                        scope.modalManager = {
                                            action: undefined
                                        };

                                    }

                                });

                            }

                        });

                    }

                };

            }

        ]);

}());