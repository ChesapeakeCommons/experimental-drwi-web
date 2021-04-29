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
        .factory('AuthorizationInterceptor', function($location, $q, ipCookie,
                                                      $log, environment) {

            function inspectDeferralState(config, path, params) {

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState'
                );

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'config',
                    config
                );

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'path',
                    path
                );

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'params',
                    params
                );

                params = (params === undefined) ? {} : params;

                var cond1 = path.indexOf('atlas/') >= 0;

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'cond1',
                    cond1
                );

                var atlasId = path.split('/').pop();

                var cond2 = Number.isInteger(parseInt(atlasId, 10));

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'cond2',
                    cond2
                );

                var cond3 = typeof params.access_token === 'string';

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'cond3',
                    cond3
                );

                var cond4 = (
                    config.url.indexOf('module') >= 0 ||
                    config.url.indexOf('template') >= 0 ||
                    config.url.indexOf('fielddoc.org') > 0 ||
                    config.url.indexOf('waterreporter.org') > 0
                );

                console.log(
                    'AuthorizationInterceptor::inspectDeferralState:',
                    'cond4',
                    cond4
                );

                return cond1 && cond2 && cond3 && cond4;

                // if (typeof config.url === 'string') {
                //
                //     console.log(
                //         'AuthorizationInterceptor::inspectDeferralState:',
                //         'config.url',
                //         config.url
                //     );
                //
                //     if (config.url.indexOf('html') > 0 &&
                //         config.url.indexOf('atlasSnapshot') > 0) {
                //
                //         return true;
                //
                //     }
                //
                // }

                // console.log(
                //     'AuthorizationInterceptor::inspectDeferralState:',
                //     'config.params',
                //     config.params
                // );
                //
                // if (config.params &&
                //     (config.params.defer || config.params.access_token)) {
                //
                //     return true;
                //
                // }
                //
                // return false;

            }

            return {
                request: function(config) {

                    var sessionCookie = ipCookie('FIELDDOC_SESSION');

                    var path = $location.path();

                    var params = $location.search();

                    //
                    // Configure our headers to contain the appropriate tags
                    //

                    config.headers = config.headers || {};

                    if (inspectDeferralState(config, path, params)) {

                        console.log(
                            'AuthorizationInterceptor::Deferral',
                            'Aborting standard auth.',
                            config
                        );

                        config.headers['Authorization-Deferral'] = environment.authDeferralKey;

                        return config || $q.when(config);

                    }

                    if (config.headers['Authorization-Bypass'] === true ||
                        path.indexOf('membership-confirmation') >= 0) {

                        delete config.headers['Authorization-Bypass'];

                        return config || $q.when(config);

                    }

                    console.log(
                        'AuthorizationInterceptor::Request',
                        'No bypass, standard auth.',
                        config
                    );

                    if (sessionCookie) {

                        config.headers.Authorization = 'Bearer ' + sessionCookie;

                    } else if (!sessionCookie &&
                        path !== '/register' &&
                        path !== '/reset' &&
                        path.lastIndexOf('/dashboard', 0) !== 0) {
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

                    var commonsUrl = (
                        config.url.indexOf('fielddoc.org') > 0 ||
                        config.url.indexOf('waterreporter.org') > 0
                    );

                    if (commonsUrl) {

                        config.headers['Cache-Control'] = 'no-cache, max-age=0, must-revalidate';

                    }

                    //
                    // Configure or override parameters where necessary
                    //
                    config.params = (config.params === undefined) ? {} : config.params;

                    console.log(
                        'AuthorizationInterceptor::Request[2]',
                        config || $q.when(config));

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