(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name
     * @description
     */
    angular.module('FieldDoc')
        .service('Account', function(ipCookie, User) {

            var Account = {
                userObject: {}
            };

            Account.getUser = function() {

                var userId = ipCookie('FIELDDOC_CURRENTUSER');

                if (!userId) {
                    return false;
                }

                var $promise = User.me();

                return $promise;

            };

            Account.setUserId = function() {
                var $promise = User.me(function(accountResponse) {

                    ipCookie('FIELDDOC_CURRENTUSER', accountResponse.id, {
                        path: '/',
                        expires: 2
                    });

                    return accountResponse.id;
                });

                return $promise;

            };

            Account.hasToken = function() {
                if (ipCookie('FIELDDOC_CURRENTUSER') && ipCookie('FIELDDOC_SESSION')) {
                    return true;
                }

                return false;
            };

            Account.hasRole = function(roleNeeded) {

                var roles = this.userObject.properties.roles;

                if (!roles) {
                    return false;
                }

                for (var index = 0; index < roles.length; index++) {
                    if (roleNeeded === roles[index]) {
                        return true;
                    }
                }

                return false;
            };

            Account.inGroup = function(userId, group) {

                var return_ = false;

                angular.forEach(group, function(member) {
                    if (member.id === userId) {
                        return_ = true;
                    }
                });

                return return_;
            };

            Account.canEdit = function(resource) {
                if (Account.userObject && !Account.userObject.id) {
                    return false;
                }

                if (Account.hasRole('admin')) {
                    return true;
                } else if (Account.hasRole('manager') && (Account.userObject.id === resource.properties.creator_id || Account.inGroup(resource.properties.organization_id, Account.userObject.properties.account) || Account.inGroup(Account.userObject.id, resource.properties.members))) {
                    return true;
                } else if (Account.hasRole('grantee') && (Account.userObject.id === resource.properties.creator_id || Account.inGroup(Account.userObject.id, resource.properties.members))) {
                    return true;
                }

                return false;
            };

            Account.canDelete = function(resource) {
                if (Account.userObject && !Account.userObject.id) {
                    return false;
                }

                if (Account.hasRole('admin')) {
                    return true;
                } else if (Account.hasRole('manager') && (Account.userObject.id === resource.properties.creator_id || Account.inGroup(Account.userObject.id, resource.properties.members))) {
                    return true;
                } else if (resource && resource.properties && Account.hasRole('grantee') && (Account.userObject.id === resource.properties.creator_id || Account.inGroup(Account.userObject.id, resource.properties.members))) {
                    return true;
                }

                return false;
            };

            return Account;
        });

}());