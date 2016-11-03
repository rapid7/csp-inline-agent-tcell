"use strict";

module.exports = function (grunt) {

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
    grunt.loadNpmTasks('grunt-preprocess'); //needed?
    grunt.loadNpmTasks('grunt-anonymous');

    grunt.loadTasks('tasks');

    var src_files= function(path){
        return ["<%= dirs.build %>/.tmp/"+ path +"/asmcrypto.js",
                "<%= dirs.build %>/.tmp/"+ path +"/api.js",
                "<%= dirs.build %>/.tmp/"+ path +"/sha256.js",
                "<%= dirs.build %>/.tmp/"+ path +"/safeguards.js",
                "<%= dirs.build %>/.tmp/"+ path +"/utilities.js",
                "<%= dirs.build %>/.tmp/"+ path +"/override.js",
                "<%= dirs.build %>/.tmp/"+ path +"/scriptsignature.js",
                "<%= dirs.build %>/.tmp/"+ path +"/session.js",
                "<%= dirs.build %>/.tmp/"+ path +"/configuration.js",
                "<%= dirs.build %>/.tmp/"+ path +"/event_handler.js",
                "<%= dirs.build %>/.tmp/"+ path +"/agent.js"];};

    grunt.initConfig({

        // Define Directory
        dirs: {
            js: "src",
            lib: "lib",
            build: "dist"
        },

        // Metadata
        pkg: grunt.file.readJSON("package.json"),

        banner: "\n" +
        "/*\n" +
        " * -------------------------------------------------------\n" +
        " * Project: <%= pkg.title %>\n" +
        " * Version: <%= pkg.version %>\n" +
        " *\n" +
        " * Author:  <%= pkg.author.name %>\n" +
        " * Site:     <%= pkg.author.url %>\n" +
        " * Contact: <%= pkg.author.email %>\n" +
        " *\n" +
        " *\n" +
        " * Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>\n" +
        " * -------------------------------------------------------\n" +
        " */\n" +
        "\n",

        anonymous: {
           dist: {
            options: {
            },
            files: {
              '<%= dirs.build %>/.tmp/anon-csp-jsagent.<%= pkg.version %>.js': src_files('prod'),
            }
           }
        },
        // Minify and Concat archives
        uglify: {
            options: {
                mangle: false,
                ASCIIOnly: true
            },
            preprod: {
                options: {
                    compress: {
                        drop_console: true //Removes console.* calls
                    },
                    beautify: true
                },
                files: {
                  '<%= dirs.build %>/.tmp/beau-tcellagent.<%= pkg.version %>.js': ["<%= dirs.build %>/.tmp/anon-csp-jsagent.<%= pkg.version %>.js"],
                }
            },
            prod: {
                options: {
                    banner: "/*! JsCSPAgent (c) 2016 tCell.io, https://opensource.org/licenses/BSD-3-Clause */"
                    +"/*! asmCrypto, (c) 2013 Artem S Vybornov, opensource.org/licenses/MIT */"
                    +"/* Sha256 Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009."
                    +" Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet"
                    +" Distributed under the BSD License"
                    +" See http://pajhome.org.uk/crypt/md5 for details."
                    +" Also http://anmar.eu.org/projects/jssha2/*/",
                    compress: {
                        drop_console: true //Removes console.* calls
                    }
                },
                files: {
                    "<%= dirs.build %>/js-csp-agent.<%= pkg.version %>.min.js": ["<%= dirs.build %>/.tmp/beau-tcellagent.<%= pkg.version %>.js"],
                    "<%= dirs.build %>/js-csp-agent.min.js": ["<%= dirs.build %>/.tmp/beau-tcellagent.<%= pkg.version %>.js"]
                }
            },
            test: {
                options: {
                    banner: "/*! asmCrypto, (c) 2013 Artem S Vybornov, opensource.org/licenses/MIT */",
                    beautify: true
                },
                files: {
                    "<%= dirs.build %>/js-csp-agent.test.js": src_files('test')
                }
            },
            debug: {
                options: {
                    banner: "/*! JsCSPAgent (c) 2016 tCell.io, https://opensource.org/licenses/BSD-3-Clause  */"
                    +"/*! asmCrypto, (c) 2013 Artem S Vybornov, opensource.org/licenses/MIT */",
                    beautify: true
                },
                files: {
                    "<%= dirs.build %>/js-csp-agent.debug.js": src_files('debug')
                }
            },

        },

        // Notifications
        notify: {
            js: {
                options: {
                    title: "Javascript - <%= pkg.title %>",
                    message: "Minified and validated with success!"
                }
            }
        },

        gzip: {
            agent: {
                files: {
                    "<%= dirs.build %>/js-csp-agent.<%= pkg.version %>.min.js.gz": ["<%= dirs.build %>/js-csp-agent.<%= pkg.version %>.min.js"],
                    "<%= dirs.build %>/js-csp-agent.min.js.gz": ["<%= dirs.build %>/js-csp-agent.<%= pkg.version %>.min.js"]

                }
            }
        },

        preprocess: {
            options: {
                inline: false,
                context: {
                    PROD: true,
                    TCELL_AGENT_VERSION: '<%= pkg.version %>',
                }
            },
            jsProd: {
                options: {
                    context: {
                        PROD: true,
                    }
                },
                files: [
                    {
                        expand: true,
                        cwd: "<%= dirs.js %>",
                        src: "*.js",
                        dest: "<%= dirs.build %>/.tmp/prod/",
                        ext: ".js"
                    }
                ]
            },
            jsTest: {
                options: {
                    context: {
                        PROD: false,
                        TEST: true,
                    }
                },
                files: [
                    {
                        expand: true,
                        cwd: "<%= dirs.js %>",
                        src: "*.js",
                        dest: "<%= dirs.build %>/.tmp/test/",
                        ext: ".js"
                    }
                ]
            },
            jsDebug: {
                options: {
                    context: {
                        PROD: false,
                    }
                },
                files: [
                    {
                        expand: true,
                        cwd: "<%= dirs.js %>",
                        src: "*.js",
                        dest: "<%= dirs.build %>/.tmp/debug/",
                        ext: ".js"
                    }
                ]
            }

        },

        // Test settings
        karma: {
            options: {
                configFile: 'test/karma.conf.js'
            },
            unit: {
                singleRun: true
            },
            server: {
                autoWatch: false
            }
        }

});


    // Register Tasks
    // --------------------------

    // Observe changes, concatenate, minify and validate files
    grunt.registerTask("default", function () {
        grunt.task.run(['preprocess:jsProd', "anonymous:dist"]); //prod
        grunt.task.run(['preprocess:jsProd', "uglify:preprod"]); //prod
        grunt.task.run(['preprocess:jsProd', "uglify:prod", "gzip"]); //prod
        grunt.task.run(['preprocess:jsTest', "uglify:test"]); //test
        grunt.task.run(['preprocess:jsDebug', "uglify:debug"]); //test

        grunt.task.run("notify:js");

    });

    grunt.registerTask('build_debug', ['preprocess:jsDebug', 'uglify:debug']);
    grunt.registerTask('build_test', ['preprocess:jsTest', 'uglify:test']);

    grunt.registerTask('test', [
      'karma:unit'
    ]);
};
