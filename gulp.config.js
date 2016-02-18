var path = require('path');
var bowerFiles = require('main-bower-files');

module.exports = function () {
    'use strict';

    /* var client = './src/client/';
    var server = './src/server/';
    var clientApp = client + 'app/';
    var specRunnerFile = 'specs.html';
    var wiredep = require('wiredep'); */

    var bowerModules = './lib/';

    var root = path.resolve('./');
    var src = './src/'; // source files
    var build = './build/'; // build target, suitable for usage as a dev server
    var dist = './dist/'; // contains packaged builds (ex: tgz and zip)
    var app = src + 'app/';
    var tmp = '.tmp/';

    var report = './report/';

    var bowerdir = './lib/';
    var nodedir = './node_modules/';

    var config = {

        index: [
            src + 'index-many.html',
            src + 'index-one.html',
            src + 'index-wet.html'
        ],
        indexProtractor: src + 'index-protractor.html',

        js: [
            app + '*/**/*.js',
            app + 'app.module.js',
            '!' + app + '**/*.spec.js'
        ],
        jsOrder: [
            '**/app.module.js',
            '**/*.module.js',
            '**/!(app-seed).js',
            '**/*.js',
            '**/app-seed.js'
        ],

        // please rename if there are better shorter names
        jsSingleFile: 'app.js',
        jsSingleFilePath: build + 'app.js', // too annoying to hoist jsSingleFile
        jsLibFile: 'lib.js',
        jsLibFilePath: build + 'lib.js',

        scss: src + 'content/styles/main.scss',
        css: build + 'main.css',
        csslib: [ ],
        csserror: src + 'content/styles/_error.css',

        // all html template files
        htmltemplates: app + '**/*.html',

        // angular template cache file to be injected
        templates: tmp + 'templates.js',

        jsInjectorFile: app + 'injector.js',
        jsInjectorFilePath: build + 'injector.js',

        jsCoreFile: 'core.js',

        specHelpers: [src + 'test/*.js'], // bind-polyfill,
        specs: [app + '**/*.spec.js'],

        staticAssets: [
            src + 'content/images/**',
            src + 'content/fake_data.json',
            src + 'config*.json'
        ],

        vetjs: [src + '**/*.js', '*.js', 'e2e-test/**/*.js', 'test/**/*.js', 'docs/app/js/app.js',
            'docs/config/**/*.js', '!docs/config/templates/*.js', '!docs/config/tag-defs/*.js'],

        watchsass: src + 'content/styles/**/*.scss',
        watchjs: src + '**/*.js',
        watchhtml: src + '**/*.html',
        watchconfig: src + '*.json',

        plato: {
            js: app + '**/*.js'
        },

        /**
         * Template cache settings.
         */
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.templates',
                root: 'app/',
                standAlone: false
            }
        },

        app: app,
        src: src,
        build: build,
        dist: dist,
        root: root,
        tmp: tmp,
        report: report,
        libdir: bowerdir,

        // alljs: [
        //    './src/**/*.js',
        //    './*.js'
        // ],
        // build: './build/',
        // client: client,
        // fonts: bowerdir + 'font-awesome/fonts/**/*.*',
        // images: client + 'images/**/*.*',
        // // app js, with no specs

        // optimized: {
        //    app: 'app.js',
        //    lib: 'lib.js'
        // },

        // browserReloadDelay: 1000,

        // packages: [
        //    './package.json',
        //    './bower.json'
        // ],

        defaultPort: '6001'
    };

    config.karma = getKarmaOptions();

    function getKarmaOptions() {
        var options = {
            files: [].concat(
                bowerFiles(),
                nodedir + 'babel-core/browser-polyfill.js',
                bowerModules + 'angular-mocks/angular-mocks.js',
                bowerModules + 'sinon/index.js',
                bowerModules + 'bardjs/dist/bard.js',

                app + '**/*module*.js',
                app + '**/!(injector).js', // excluding injector
                app + 'app-seed.js',
                config.templates,

                config.specs,
                config.specHelpers
                ),
            coverage: {
                dir: report + 'coverage',
                reporters: [

                    // reporters not supporting the `file` property
                    { type: 'html', subdir: 'report-html' },
                    { type: 'lcov', subdir: 'report-lcov' },
                    { type: 'text-summary' } // , subdir: '.', file: 'text-summary.txt'}
                ]
            },
            preprocessors: {}
        };

        options.preprocessors[app + '**/*.js'] = ['coverage', 'babel'];

        return options;
    }

    return config;
};
