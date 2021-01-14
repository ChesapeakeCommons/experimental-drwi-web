'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    //
    // To get this working with the most recent 0.8.0 angular generator we needed to following the tips
    // at the following links and SO articles
    //
    // @see https://gist.github.com/nnarhinen/7719157#comment-1318658
    // @see http://stackoverflow.com/questions/24283653/angularjs-html5mode-using-grunt-connect-grunt-0-4-5?answertab=votes#tab-top
    //
    var modRewrite = require('connect-modrewrite');

    // Configurable paths for the application
    var appConfig = {
        app: require('./bower.json').appPath || 'app',
        dist: 'dist'
    };

    var environment = grunt.option('environment') || 'local';

    var version = Date.now();

    // Define the configuration for all the tasks
    grunt.initConfig({

        //
        // Environment Specific Variables
        //
        ngconstant: {
            options: {
                space: '  ',
                wrap: '"use strict";\n\n {%= __ngModule %}',
                name: 'config'
            },
            local: {
                options: {
                    dest: '<%= yeoman.app %>/config/environment.js'
                },
                constants: {
                    environment: {
                        name: 'local',
                        apiUrl: 'http://127.0.0.1:5000',
                        castUrl: 'http://127.0.0.1:4000',
                        dnrUrl: 'http://127.0.0.1:4000',
                        siteUrl: 'http://127.0.0.1:9000',
                        clientId: 'sL3yMmmnSNszktuQGVBCasZ6mCy7DahS',
                        version: version
                    }
                }
            },
            development: {
                options: {
                    dest: '<%= yeoman.app %>/config/environment.js'
                },
                constants: {
                    environment: {
                        name: 'development',
                        apiUrl: 'https://multi.api.fielddoc.org',
                        castUrl: 'https://dev.cast.fielddoc.chesapeakecommons.org',
                        dnrUrl: 'https://dev.dnr.fielddoc.chesapeakecommons.org',
                        siteUrl: 'https://multiprogram.fielddoc.org',
                        clientId: 'iwN6fjRffe1RUmSfiJL3FPZA7WVwrA8B',
                        version: version
                    }
                }
            },
            livedev: {
                options: {
                    dest: '<%= yeoman.app %>/config/environment.js'
                },
                constants: {
                    environment: {
                        name: 'livedev',
                        apiUrl: 'https://dev.api.fielddoc.org',
                        castUrl: 'https://dev.cast.fielddoc.chesapeakecommons.org',
                        dnrUrl: 'https://dev.dnr.fielddoc.chesapeakecommons.org',
                        siteUrl: 'http://127.0.0.1:9000',
                        clientId: 'sL3yMmmnSNszktuQGVBCasZ6mCy7DahS',
                        version: version
                    }
                }
            },
            staging: {
                options: {
                    dest: '<%= yeoman.app %>/config/environment.js'
                },
                constants: {
                    environment: {
                        name: 'staging',
                        apiUrl: 'https://api.drwi.chesapeakecommons.org',
                        castUrl: 'https://cast.fielddoc.chesapeakecommons.org',
                        dnrUrl: 'https://dnr.fielddoc.chesapeakecommons.org',
                        siteUrl: 'https://drwi.chesapeakecommons.org',
                        clientId: 'lynCelX7eoAV1i7pcltLRcNXHvUDOML405kXYeJ1',
                        version: version
                    }
                }
            },
            production: {
                options: {
                    dest: '<%= yeoman.app %>/config/environment.js'
                },
                constants: {
                    environment: {
                        name: 'production',
                        apiUrl: 'https://api.fielddoc.org',
                        siteUrl: 'https://www.fielddoc.org',
                        clientId: 'lynCelX7eoAV1i7pcltLRcNXHvUDOML405kXYeJ1',
                        version: version
                    }
                }
            },
            production_local: {
                options: {
                    dest: '<%= yeoman.app %>/config/environment.js'
                },
                constants: {
                    environment: {
                        name: 'production_local',
                        apiUrl: 'https://api.fielddoc.org',
                        siteUrl: 'http://127.0.0.1:9000',
                        clientId: 'sL3yMmmnSNszktuQGVBCasZ6mCy7DahS',
                        version: version
                    }
                }
            }
        },

        // Project settings
        yeoman: appConfig,

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep']
            },
            js: {
                files: [
                    '<%= yeoman.app %>/modules/**/*.js',
                    '<%= yeoman.app %>/modules/components/**/*.js',
                    '<%= yeoman.app %>/modules/shared/**/*.js',
                    '<%= yeoman.app %>/modules/config/**/*.js'
                ],
                tasks: ['newer:jshint:all'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            jsTest: {
                files: [
                    '<%= yeoman.app %>/modules/**/*.js',
                    '<%= yeoman.app %>/modules/components/**/*.js',
                    '<%= yeoman.app %>/modules/shared/**/*.js',
                    '<%= yeoman.app %>/modules/config/**/*.js'
                ],
                tasks: []
            },
            compass: {
                files: ['<%= yeoman.app %>/styles/**/*.{scss,sass}'],
                tasks: ['compass:server', 'autoprefixer']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/**/*.html',
                    '<%= yeoman.app %>/modules/components/**/*.html',
                    '<%= yeoman.app %>/modules/shared/**/*.html',
                    '<%= yeoman.app %>/styles/**/*.css',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    middleware: function(connect) {
                        return [
                            modRewrite(['^[^\\.]*$ /index.html [L]']),
                            connect.static('.tmp'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            test: {},
            dist: {
                options: {
                    open: true,
                    base: '<%= yeoman.dist %>'
                }
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.app %>/modules/**/*.js'
                ]
            },
            test: {}
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                options: {
                    force: true
                },
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            server: {
                options: {
                    force: true
                },
                files: [{
                    src: [

                    ]
                }]
            }
        },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            server: {
                options: {
                    map: true,
                },
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            }
        },

        // Automatically inject Bower components into the app
        wiredep: {
            app: {
                src: ['<%= yeoman.app %>/index.html'],
                ignorePath: /\.\.\//
            },
            sass: {
                src: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
                ignorePath: /(\.\.\/){1,2}bower_components\//
            }
        },

        // Compiles Sass to CSS and generates necessary files if requested
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '.tmp/styles',
                generatedImagesDir: '.tmp/images/generated',
                imagesDir: '<%= yeoman.app %>/images',
                javascriptsDir: '<%= yeoman.app %>/modules',
                fontsDir: '<%= yeoman.app %>/fonts',
                importPath: './bower_components',
                httpImagesPath: '/images',
                httpGeneratedImagesPath: '/images/generated',
                httpFontsPath: '/fonts',
                relativeAssets: false,
                assetCacheBuster: false,
                raw: 'Sass::Script::Number.precision = 10\n'
            },
            dist: {
                options: {
                    generatedImagesDir: '<%= yeoman.dist %>/images/generated'
                }
            },
            server: {
                options: {
                    sourcemap: true
                }
            }
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= yeoman.dist %>/modules/**/*.js',
                    '<%= yeoman.dist %>/modules/components/**/*.js',
                    '<%= yeoman.dist %>/modules/shared/**/*.js',
                    '<%= yeoman.dist %>/modules/config/**/*.js',
                    '<%= yeoman.dist %>/scripts/**/*.js',
                    '<%= yeoman.dist %>/styles/{,*/}*.css',
                    '<%= yeoman.dist %>/fonts/{,*/}*.*'
                ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['concat'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/**/*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                assetsDirs: [
                    '<%= yeoman.dist %>',
                    '<%= yeoman.dist %>/images',
                    '<%= yeoman.dist %>/styles',
                    '<%= yeoman.dist %>/fonts'
                ]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: true,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: ['*.html', '**/*.html'],
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/concat/modules',
                    src: '*.js',
                    dest: '.tmp/concat/modules'
                }]
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        '**/*.html',
                        'config/{,*/}*.*',
                        'images/{,*/}*.*',
                        'styles/{,*/}*.css',
                        'fonts/{,*/}*.*'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }]
            },
            styles: {
                expand: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },

        // Run some tasks in parallel to speed up the build process
        concurrent: {
            server: [
                'compass:server'
            ],
            test: [],
            dist: [
                'compass:dist'
            ]
        }

    });

    grunt.registerTask('serve', 'Compile then start a connect web server', function(target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'ngconstant:' + environment,
            'wiredep',
            'concurrent:server',
            'autoprefixer:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function(target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });

    //
    // BUILD TASKS
    //
    // These are Grunt tasks that are run when `grunt build` is executed at the
    // command prompt
    //
    var buildTasks = [
        'clean:dist',
        'ngconstant:' + environment,
        'wiredep',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'ngAnnotate',
        'copy:dist',
        'cssmin',
        'filerev',
        'usemin'
    ];

    grunt.registerTask('build', buildTasks);

    grunt.registerTask('default', [
        'newer:jshint',
        'build'
    ]);
};