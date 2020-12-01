(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name FieldDoc.authorizationInterceptor
     * @description
     * # authorizationInterceptor
     * Service in the FieldDoc.
     */
    angular.module('FieldDoc')
        .factory('AuthorizationInterceptor', function($location, $q, ipCookie, $log) {

            return {
                request: function(config) {

                    var sessionCookie = ipCookie('FIELDDOC_SESSION');

                    //
                    // Configure our headers to contain the appropriate tags
                    //

                    config.headers = config.headers || {};

                    if (config.headers['Authorization-Bypass'] === true) {

                        delete config.headers['Authorization-Bypass'];

                        return config || $q.when(config);

                    }

                    if (sessionCookie) {

                        config.headers.Authorization = 'Bearer ' + sessionCookie;

                    } else if (!sessionCookie &&
                        $location.path() !== '/register' &&
                        $location.path() !== '/reset' &&
                        $location.path().lastIndexOf('/dashboard', 0) !== 0) {
                        /**
                         * Remove all cookies present for authentication
                         */
                        ipCookie.remove('FIELDDOC_SESSION');
                        ipCookie.remove('FIELDDOC_SESSION', {
                            path: '/'
                        });

                        ipCookie.remove('FIELDDOC_CURRENTUSER');
                        ipCookie.remove('FIELDDOC_CURRENTUSER', {
                            path: '/'
                        });

                        $location.path('/login').search('');

                    }

                    config.headers['Cache-Control'] = 'no-cache, max-age=0, must-revalidate';

                    //
                    // Configure or override parameters where necessary
                    //
                    config.params = (config.params === undefined) ? {} : config.params;

                    console.log('SecurityInterceptor::Request', config || $q.when(config));

                    return config || $q.when(config);

                },
                response: function(response) {

                    console.log(
                        'AuthorizationInterceptor::Response',
                        response || $q.when(response)
                    );

                    return response || $q.when(response);

                },
                responseError: function(response) {

                    console.log(
                        'AuthorizationInterceptor::ResponseError',
                        response || $q.when(response)
                    );

                    if (response.status === 401 || response.status === 403) {

                        $location.path('/logout');
                        
                    }

                    return $q.reject(response);

                }
            };

        }).config(function($httpProvider) {

            $httpProvider.interceptors.push('AuthorizationInterceptor');

        });

}());