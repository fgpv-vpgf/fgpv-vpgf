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
            bowerdir + 'angular-material/angular-material.js'
        ],

        scss: src + 'content/styles/main.scss',
        css: temp + 'main.css',
        csslib: [

        ],

        specHelpers: [ src + 'test/*.js' ], // bind-polyfill, 
        specs: [ app + '**/*.spec.js' ],

        vetjs: [ src + '**/*.js' ],

        watchsass: src + 'content/styles/**/*.scss',
        watchjs: src + '**/*.js',
        watchhtml: src + '**/*.html',

        app: app,
        src: src,
        temp: temp,
        build: build,
        root: root,

        //alljs: [
        //    './src/**/*.js',
        //    './*.js'
        //],
        //build: './build/',
        //client: client,
        //fonts: bowerdir + 'font-awesome/fonts/**/*.*',
        //htmltemplates: clientApp + '**/*.html',
        //images: client + 'images/**/*.*',
        //// app js, with no specs

        //report: report,
        //root: root,
        //server: server,
        //source: 'src/',

        //optimized: {
        //    app: 'app.js',
        //    lib: 'lib.js'
        //},

        //plato: { js: clientApp + '**/*.js' },

        //browserReloadDelay: 1000,

        //templateCache: {
        //    file: 'templates.js',
        //    options: {
        //        module: 'app.core',
        //        root: 'app/',
        //        standAlone: false
        //    }
        //},

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
            )
        };

        return options;
    }


    return config;
};
