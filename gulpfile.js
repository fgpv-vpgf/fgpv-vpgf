/* jshint camelcase:false */
var gulp = require('gulp');
var glob = require('glob');
var del = require('del');
var pkg = require('./package.json');
var $ = require('gulp-load-plugins')({ lazy: true });
var args = require('yargs').argv;

var config = require('./gulp.config')();

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
gulp.task('vet', function () {
    log('Analyzing source with JSHint and JSCS');

    return gulp
        .src(config.vetjs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe($.jshint.reporter('fail'))
        .pipe($.jscs());
});

/**
 * Create a visualizer report
 */
gulp.task('plato', function (done) {
    log('Analyzing source with Plato');
    log('Browse to /report/plato/index.html to see Plato results');

    startPlatoVisualizer(done);
});

/**
 * Create $templateCache from the html templates
 * @return {Stream}
 */
gulp.task('templatecache', ['clean-templates'], function() {
    log('Creating an AngularJS $templateCache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.if(args.verbose, $.bytediff.start()))
        .pipe($.minifyHtml({empty: true}))
        .pipe($.if(args.verbose, $.bytediff.stop(bytediffFormatter)))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
});

/**
 * Remove all files from the build, temp, and reports folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', function (done) {
    var delconfig = [].concat(config.build, config.temp, config.report);
    log('Cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

/**
 * Remove all styles from the temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-sass', function (done) {
    del(config.css, done);
});

/**
 * Remove all templates from the temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-templates', function (done) {
    del(config.templates, done);
});

gulp.task('sass', ['clean-sass'],
    function () {
        log('Compiling SASS --> CSS');

        return gulp
            .src(config.scss)
            .pipe($.sass().on('error', $.sass.logError))
            .pipe($.autoprefixer('last 2 version', '> 5%'))

            .pipe(gulp.dest(config.temp))

            .pipe($.connect.reload())
        ;
    }
);

gulp.task('inject', ['sass', 'templatecache'],
    function () {
        log('Injecting JS, CSS');

        return gulp
            .src(config.index)

            .pipe(inject(config.jslib, 'inject-vendor'))
            .pipe(inject(config.js, '', config.jsOrder))

            .pipe(inject(config.csslib, 'inject-vendor'))
            .pipe(inject(config.css))

            .pipe(inject(config.templates, 'templates'))

            .pipe(gulp.dest(config.src))
        ;
    }
);

/**
 * Serves the app.
 * -- test  : run Karma auto tests in parallel
 */
gulp.task('serve:dev', ['vet', 'inject'],
    function () {
        // run karma tests parallel with serve
        if (args.test) {
            startTests(false);
        }

        serve(true);
    }
);

/**
 * Run specs once and exit
 * -- coverage  : generate test coverage info
 * @return {Stream}
 */
gulp.task('test', ['vet'], function (done) {
    startTests(true /*singleRun*/, done);
});

/**
 * Run specs and wait.
 * -- coverage  : generate test coverage info
 * Watch for file changes and re-run tests on each change
 */
gulp.task('test:auto', function (done) {
    startTests(false /*singleRun*/, done);
});

/**
 * Generates the changelog from commit messages.
 * releseCount 0 regenerates all releases.
 */
gulp.task('changelog', function () {
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
            .watch(config.watchjs)
            .on('change', reload)
        ;

        gulp
            .watch(config.watchhtml, ['templatecache'])
            .on('change', reload)
        ;
    }
}

/**
 * Start the tests using karma.
 * @param  {boolean} singleRun - True means run once and end (CI), or keep running (dev)
 * @param  {Function} done - Callback to fire when karma is done
 * @return {undefined}
 */
function startTests(singleRun, done) {
    var child;
    var excludeFiles = [];
    var fork = require('child_process').fork;
    var karma = require('karma').server;

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
    log('Running Plato');

    var files = glob.sync(config.plato.js);
    var plato = require('plato');
    var excludeFiles = /.*\.spec\.js/;

    var options = {
        title: 'Plato Inspections Report',
        exclude: excludeFiles
    };
    var outputDir = config.report + '/plato';


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
 * Reloads gulp-connect with whatever file has changed.
 *
 */
function reload(event) {
    logWatch(event);

    gulp
        .src(event.path)
        .pipe($.connect.reload())
    ;
}

function logWatch(event) {
    log('*** File ' + event.path + ' was ' + event.type + ', running tasks...');
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} path   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    var options = { read: false };
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
        .pipe($.if(order, $.order(order)))
    ;
}

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
}

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
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}