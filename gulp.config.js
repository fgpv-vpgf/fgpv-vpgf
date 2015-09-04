module.exports = function () {
    var client = './src/client/';
    var server = './src/server/';
    var clientApp = client + 'app/';
    //var specRunnerFile = 'specs.html';
    //var wiredep = require('wiredep');

    var nodeModules = './node_modules/';
    var bowerModules = './lib/';

    var root = './';
    var src = './src/'
    var build = './dist/';
    var app = src + 'app/';

    var temp = './.tmp/';
    var report = './report/';

    var bowerdir = './lib/';

    var config = {

        index: src + 'index.html',
        indexProtractor: src + 'index-protractor.html',

        js: [
            app + '**/*module*.js',
            app + '**/*.js',
            app + 'app-seed.js',
            '!' + app + '**/*.spec.js'
        ],
        jsOrder: [
            '**/app.module.js',
            '**/*.module.js',
            '**/!(app-seed).js',
            '**/*.js',
            '**/app-seed.js'
        ],
        jslib: [
            bowerdir + 'angular/angular.js',
            bowerdir + 'angular-animate/angular-animate.js',
            bowerdir + 'angular-aria/angular-aria.js',
            bowerdir + 'angular-ui-router/release/angular-ui-router.js',
            bowerdir + 'angular-material/angular-material.js',
            bowerdir + 'angular-sanitize/angular-sanitize.js',
            bowerdir + 'angular-translate/angular-translate.js',
            bowerdir + 'angular-translate-loader-static-files/angular-translate-loader-static-files.js'
        ],

        scss: src + 'content/styles/main.scss',
        css: temp + 'main.css',
        csslib: [

        ],

        // all html template files
        htmltemplates: app + '**/*.html',
        // angular template cache file to be injected
        templates: temp + 'templates.js',

        specHelpers: [src + 'test/*.js'], // bind-polyfill,
        specs: [app + '**/*.spec.js'],

        vetjs: [src + '**/*.js'],

        watchsass: src + 'content/styles/**/*.scss',
        watchjs: src + '**/*.js',
        watchhtml: src + '**/*.html',

        plato: {
            js: app + '**/*.js'
        },

        /**
         * Template cache settings.
         */
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.core',
                root: 'app/',
                standAlone: false
            }
        },

        app: app,
        src: src,
        temp: temp,
        build: build,
        root: root,
        report: report,

        //alljs: [
        //    './src/**/*.js',
        //    './*.js'
        //],
        //build: './build/',
        //client: client,
        //fonts: bowerdir + 'font-awesome/fonts/**/*.*',
        //images: client + 'images/**/*.*',
        //// app js, with no specs

        //optimized: {
        //    app: 'app.js',
        //    lib: 'lib.js'
        //},

        //browserReloadDelay: 1000,

        //packages: [
        //    './package.json',
        //    './bower.json'
        //],

        defaultPort: '6001'
    };

    config.karma = getKarmaOptions();

    function getKarmaOptions() {
        var options = {
            files: [].concat(
                config.jslib,
                bowerModules + 'angular-mocks/angular-mocks.js',
                bowerModules + 'sinon/index.js',
                bowerModules + 'bardjs/dist/bard.js',

                app + '**/*module*.js',
                app + '**/*.js',
                app + 'app-seed.js',

                config.specs,
                config.specHelpers
                ),
            coverage: {
                dir: report + 'coverage',
                reporters: [
                    // reporters not supporting the `file` property
                    { type: 'html', subdir: 'report-html' },
                    { type: 'lcov', subdir: 'report-lcov' },
                    { type: 'text-summary' } //, subdir: '.', file: 'text-summary.txt'}
                ]
            },
            preprocessors: {}
        };

        options.preprocessors[app + '**/!(*.spec)+(.js)'] = ['coverage'];

        return options;
    }

    return config;
};
