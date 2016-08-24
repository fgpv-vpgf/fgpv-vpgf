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
    var libBuild = build + 'lib/';
    var sampleBuild = build + 'samples/';
    var dist = './dist/'; // contains packaged builds (ex: tgz and zip)
    var app = src + 'app/';
    var tmp = '.tmp/';

    var report = './report/';

    var bowerdir = './lib/';
    // var nodedir = './node_modules/';

    var config = {

        index: [
            src + 'index-many.html',
            src + 'index-one.html',
            src + 'index-wet.html',
            src + 'index-jso.html',
            src + 'index-fgp-en.html',
            src + 'index-fgp-fr.html',
            src + 'bookmark-decode.html'
        ],
        indexProtractor: src + 'index-protractor.html',

        js: [
            app + '*/**/*.js',
            app + 'app.module.js',
            '!' + app + '**/*.spec.js'
        ],
        jsOrder: [
            'lib.js',
            'global-registry.js',
            'app.js',
            'templates.js',
            'app-seed.js'
        ],
        injectorOrder: [
            'polyfills.js',
            'bootstrap.js'
        ],

        jsPolyfills: src + 'polyfill/es7-*.js',
        jsPolyfillsFile: 'polyfills.js',

        jsIePolyfills: src + 'polyfill/ie-*.js',
        jsIePolyfillsFile: 'ie-polyfills.js',

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

        jsAppSeed: app + 'app-seed.js', // initializes viewer instances
        jsGlobalRegistry: app + 'global-registry.js', // create global registry; loads gapi, etc.

        jsInjectorFile: app + 'bootstrap.js',
        jsInjectorDest: 'bootstrap.js',
        jsInjectorFilePath: libBuild + 'bootstrap.js',

        jsCoreFile: 'core.js',

        specHelpers: [src + 'test/*.js'], // bind-polyfill,
        specs: [app + '**/*.spec.js'],

        staticAssets: [src + 'config*.json'],

        svgCache: `${src}content/svgCache`,

        schema: src + 'schema.json',

        vetjs: [src + '**/*.js', '*.js', 'e2e-test/**/*.js', 'test/**/*.js', 'docs/app/js/app.js',
            'docs/config/**/*.js', '!docs/config/templates/*.js', '!docs/config/tag-defs/*.js'],

        watchsass: `${src}content/styles/**/*.scss`,
        watchjs: `${src}**/*.js`,
        watchhtml: `${src}**/*.html`,
        watchconfig: `${src}*.json`,
        xslt: `${src}content/metadata/xstyle_default_i18n.xsl`,

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

        app,
        src,
        libBuild,
        sampleBuild,
        dist,
        root,
        tmp,
        report,
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

    // jscs:disable maximumLineLength
    config.iconCache = [
        { file: 'content/images/iconsets/default-icons.svg', prefix: 'default', icons: 'check'.split(' '), isDefault: true },
        { file: 'content/images/iconsets/action-icons.svg', prefix: 'action', icons: 'search home history description delete settings info visibility visibility_off zoom_in zoom_out check_circle open_in_new print shopping_cart opacity'.split(' ') },
        { file: 'content/images/iconsets/alert-icons.svg', prefix: 'alert', icons: 'error'.split(' ') },
        { file: 'content/images/iconsets/communication-icons.svg', prefix: 'communication', icons: 'location_on'.split(' ') },
        { file: 'content/images/iconsets/mdi-icons.svg', prefix: 'community', icons: 'filter chevron-double-left emoticon-sad emoticon-happy vector-square table-large map-marker-off'.split(' ') },
        { file: 'content/images/iconsets/content-icons.svg', prefix: 'content', icons: 'create add remove'.split(' ') },
        { file: 'content/images/iconsets/editor-icons.svg', prefix: 'editor', icons: 'insert_drive_file drag_handle'.split(' ') },
        { file: 'content/images/iconsets/file-icons.svg', prefix: 'file', icons: 'file_upload cloud'.split(' ') },
        { file: 'content/images/iconsets/hardware-icons.svg', prefix: 'hardware', icons: 'keyboard_arrow_right keyboard_arrow_down'.split(' ') },
        { file: 'content/images/iconsets/image-icons.svg', prefix: 'image', icons: 'tune photo'.split(' ') },
        { file: 'content/images/iconsets/maps-icons.svg', prefix: 'maps', icons: 'place layers my_location map layers_clear'.split(' ') },
        { file: 'content/images/iconsets/navigation-icons.svg', prefix: 'navigation', icons: 'menu check more_vert close more_horiz refresh'.split(' ') },
        { file: 'content/images/iconsets/social-icons.svg', prefix: 'social', icons: 'person'.split(' ') }
    ];
    // jscs:enable maximumLineLength
    config.svgSources = config.svgCache + '/*.svg';

    function getKarmaOptions() {
        var options = {
            files: [].concat(
                config.specHelpers, // order matters
                bowerModules + 'jquery/dist/jquery.js',
                bowerModules + 'datatables.net/js/jquery.dataTables.js',
                bowerFiles(),
                src + 'polyfill/*.js',
                bowerModules + 'angular-mocks/angular-mocks.js',
                bowerModules + 'sinon/index.js',
                bowerModules + 'bardjs/dist/bard.js',

                app + '**/*module*.js',
                app + '**/!(app-seed|injector).js', // excluding injector
                config.templates,

                config.specs
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
