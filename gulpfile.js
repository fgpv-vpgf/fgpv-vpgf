/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
/* jshint camelcase:false */
/* global -$ */
'use strict';

var gulp = require('gulp');
var glob = require('glob');
var del = require('del');
/* var pkg = require('./package.json'); */
var $ = require('gulp-load-plugins')({ lazy: true });
var args = require('yargs').argv;
var bowerFiles = require('main-bower-files');
var config = require('./gulp.config')();

require('gulp-help')(gulp);

/**
 * yargs variables can be passed in to alter the behavior, when present.
 * Example: gulp serve:dev
 *
 * --verbose  : Various tasks will produce more output to the console.
 * --nosync   : Don't launch the browser with browser-sync when serving code.
 * --debug    : Launch debugger with node-inspector.
 * --debug-brk: Launch debugger and break on 1st line with node-inspector.
 * --test     : run Karma auto tests in parallel
 */

/**
 * vet the code and create coverage report
 *  -- verbose: verbose
 * @return {Stream}
 */
gulp.task('vet', 'Checks code against style guidelines', function () {
    log('Analyzing source with JSHint and JSCS');

    return gulp
        .src(config.vetjs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jshint())
        .pipe($.jscs())
        .pipe($.jscsStylish.combineWithHintResults())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe($.jshint.reporter('fail'));
});

/**
 * Create a visualizer report
 */
gulp.task('plato', 'Generate visualizer report', function (done) {
    log('Analyzing source with Plato');
    log('Browse to /report/plato/index.html to see Plato results');

    startPlatoVisualizer(done);
});

/**
 * Create $templateCache from the html templates
 * @return {Stream}
 */
gulp.task('templatecache', 'Create a cache of HTML templates', ['clean-templates'], function () {
    log('Creating an AngularJS $templateCache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.if(args.verbose, $.bytediff.start()))
        .pipe($.minifyHtml({ empty: true }))
        .pipe($.if(args.verbose, $.bytediff.stop(bytediffFormatter)))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.build));
});

/**
 * Remove all files from the build, temp, and reports folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', 'Delete all build and report files', ['clean-sass', 'clean-templates'],
    function (done) {
        var delconfig = [].concat(config.build, config.report);
        log('Cleaning: ' + $.util.colors.blue(delconfig));
        del(delconfig, done);
    });

/**
 * Remove all styles from the temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-sass', false, function (done) {
    del(config.css, done);
});

/**
 * Remove all templates from the temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-templates', false, function (done) {
    del(config.templates, done);
});

gulp.task('sass', 'Generate CSS from SASS', ['clean-sass'],
    function () {
        log('Compiling SASS --> CSS');

        return gulp
            .src(config.scss)
            .pipe($.sass().on('error', $.sass.logError))
            .pipe($.autoprefixer('last 2 version', '> 5%'))

            .pipe(gulp.dest(config.build))

            .pipe($.connect.reload());
    }
);

gulp.task('jsbuild', 'Annotate, transpile and concat JS development files',
    function () {
        injectError(false);

        return gulp
            .src(config.js)
            .pipe($.sourcemaps.init())
            .pipe($.plumber({ errorHandler: injectError}))
            .pipe($.babel())
            .pipe($.plumber.stop())
            .pipe($.ngAnnotate({
                remove: true,
                add: true,
                single_quotes: true
            }))
            .pipe($.angularFilesort())
            .pipe($.concat(config.jsSingleFile))
            .pipe($.sourcemaps.write('.'))
            .pipe(gulp.dest(config.build));
    });

// inject error css file into the index page if babel parser errors
function injectError(error) {
    var injector = '';
    if (error) {
        injector = '<link rel="stylesheet" href=".' + config.csserror + '">';
        $.util.log(error);
    }

    return gulp
        .src(config.build + '/index*.html')
        .pipe($.replace(/<!-- inject:error -->([\s\S]*?)<!-- endinject -->/gi, '<!-- inject:error -->' + injector + '<!-- endinject -->'))
        .pipe(gulp.dest(config.build));
}

gulp.task('libbuild', 'Concat bower dependencies',
    function () {
        return gulp.src(bowerFiles())
            .pipe($.concat(config.jsLibFile))
            .pipe(gulp.dest(config.build));
    });

gulp.task('assetcopy', 'Copy fixed assets to the build directory',
    function () {
        return gulp.src(config.staticAssets, {base:config.src})
            .pipe(gulp.dest(config.build));
    });

gulp.task('inject', 'Adds configured dependencies to the HTML page',
    ['sass', 'templatecache', 'jsbuild', 'libbuild', 'assetcopy'],
    function () {
        var index = config.index;
        var js = config.js;

        log('Injecting JS, CSS');

        if (args.protractor) {
            index = config.indexProtractor;
            js.push('!' + config.app + 'app-seed.js'); // remove app-seed from injectables
        }

        return gulp
            .src(index)

            .pipe(inject(config.jsLibFilePath, 'vendor'))
            .pipe(inject(config.jsSingleFilePath, ''))

            .pipe(inject(config.csslib, 'vendor'))
            .pipe(inject(config.css))

            .pipe(inject(config.templates, 'templates'))

            .pipe(gulp.dest(config.build));
    }
);

/**
 * Serves the app.
 * -- test  : run Karma auto tests in parallel
 * -- protractor: prepare index-protractor page and do not inject app-seed
 */
gulp.task('serve:dev', 'Build the application and start a local development server',
    ['vet', 'inject'],
    function () {
        // run karma tests parallel with serve
        if (args.test) {
            startTests(false);
        }
        serve(true);
    }, {
        aliases: ['serve']
    });

/**
 * Run specs once and exit
 * -- coverage  : generate test coverage info
 * @return {Stream}
 */
gulp.task('test', 'Run style checks and unit tests', ['vet', 'templatecache'], function (done) {
    startTests(true, done);
});

/**
 * Run specs and wait.
 * -- coverage  : generate test coverage info
 * Watch for file changes and re-run tests on each change
 */
gulp.task('test:auto', 'Run unit tests and keep watching for changes', function (done) {
    startTests(false, done);
});

/**
 * Generates the changelog from commit messages.
 * releseCount 0 regenerates all releases.
 */
gulp.task('changelog', 'Generate a changelog based on commit history', function () {
    return gulp.src('CHANGELOG.md')
        .pipe($.conventionalChangelog({
            preset: 'angular',
            releaseCount: 0
        }))
        .pipe(gulp.dest('./'));
});

function serve(isDev) {
    $.connect.server({
        root: config.root,
        livereload: true,
        port: config.defaultPort,

        // fallback option doesn't seem to work well with index page reload
        //fallback: isDev ? config.src + 'index.html' : config.build + 'index.html'
    });

    if (isDev) {
        gulp
            .watch(config.watchsass, ['sass'])
            .on('change', logWatch)
        ;

        gulp
            .watch(config.watchjs, ['reloadapp'])
            .on('change', logWatch)
        ;

        gulp
            .watch(config.watchhtml, ['reloadcache'])
            .on('change', logWatch)
        ;
    }
}

/**
 * Reloads app.js file on source files changes. Do not call directly.
 * @return {Stream}
 */
gulp.task('reloadapp', 'Repackaging app...', ['jsbuild'], function () {
    return gulp
        .src(config.jsSingleFilePath)
        .pipe($.connect.reload())
    ;
});

/**
 * Reloads template cache on template files changes. Do not call directly.
 * @return {Stream}
 */
gulp.task('reloadcache', 'Repackaging templates...', ['templatecache'], function () {
    return gulp
        .src(config.jsSingleFilePath)
        .pipe($.connect.reload())
    ;
});

/**
 * Start the tests using karma.
 * @param  {boolean} singleRun - True means run once and end (CI), or keep running (dev)
 * @param  {Function} done - Callback to fire when karma is done
 * @return {undefined}
 */
function startTests(singleRun, done) {
    var child;
    var excludeFiles = [];
    var karma = require('karma').server;
    /* var fork = require('child_process').fork; */

    var karmaConfig = {
        configFile: __dirname + '/karma.conf.js',
        exclude: excludeFiles,
        singleRun: !!singleRun
    };

    // add coverage reporter
    if (args.coverage) {
        karmaConfig.reporters = ['progress', 'coverage'];
    }

    karma.start(karmaConfig, karmaCompleted);

    ////////////////

    function karmaCompleted(karmaResult) {
        log('Karma completed');
        if (child) {
            log('shutting down the child process');
            child.kill();
        }
        if (karmaResult === 1) {
            done('karma: tests failed with code ' + karmaResult);
        } else {
            done();
        }
    }
}

/**
 * Start Plato inspector and visualizer
 */
function startPlatoVisualizer(done) {
    var files = glob.sync(config.plato.js);
    var plato = require('plato');
    var excludeFiles = /.*\.spec\.js/;

    var options = {
        title: 'Plato Inspections Report',
        exclude: excludeFiles
    };
    var outputDir = config.report + '/plato';

    log('Running Plato');

    plato.inspect(files, outputDir, options, platoCompleted);

    function platoCompleted(report) {
        var overview = plato.getOverviewReport(report);
        if (args.verbose) {
            log(overview.summary);
        }
        if (done) { done(); }
    }
}

/**
 * Log an event to the console.
 * @param  {Object} event
 */
function logWatch(event) {
    log('*** File ' + event.path + ' was ' + event.type + ', running tasks...');
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @param   {Boolean} relative   default is true
 * @returns {Stream}   The stream
 */
function inject(src, label, order, relative) {
    var options = { read: false, relative: relative };

    if (typeof relative === 'undefined') {
        relative = true;
    }

    if (label) {
        options.name = 'inject:' + label;
    }

    return $.inject(orderSrc(src, order), options);
}

/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc(src, order) {
    //order = order || ['**/*'];

    return gulp
        .src(src)
        .pipe($.if(order, $.order(order)));
}

/* function removeMatch(originalArray, regex) {
    var j = 0;
    while (j < originalArray.length) {
        if (regex.test(originalArray[j])) {
            originalArray.splice(j, 1);
        } else {
            j++;
        }
    }
    return originalArray;
} */

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
/* function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
} */

/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' +
        (data.endSize / 1000).toFixed(2) + ' kB and is ' +
        formatPercent(1 - data.percent, 2) + '%' + difference;
}

/**
 * Format a number as a percentage
 * @param  {Number} num       Number to format as a percent
 * @param  {Number} precision Precision of the decimal
 * @return {String}           Formatted perentage
 */
function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
    var item;

    if (typeof (msg) === 'object') {
        for (item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
