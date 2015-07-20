/* jshint camelcase:false */
//var common = require('./gulp/common.js');
//var merge = require('merge-stream');
var gulp = require('gulp');
var del = require('del');
var pkg = require('./package.json');
var $ = require('gulp-load-plugins')();
var args = require('yargs').argv;


//var rs = require('run-sequence');

//var env = plug.util.env;

var config = require('./gulp.config')();


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

gulp.task('clean-sass', function (done) {
    del(config.temp, done);
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

gulp.task('inject', ['sass'],
    function () {
        log('Injecting JS, CSS');

        return gulp
            .src(config.index)

            .pipe(inject(config.jslib, 'inject-vendor'))
            .pipe(inject(config.js, '', config.jsOrder))

            .pipe(inject(config.csslib, 'inject-vendor'))
            .pipe(inject(config.css))

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
 * @return {Stream}
 */
gulp.task('test', ['vet'], function (done) {
    startTests(true /*singleRun*/, done);
});

/**
 * Run specs and wait.
 * Watch for file changes and re-run tests on each change
 */
gulp.task('test:auto', function (done) {
    startTests(false /*singleRun*/, done);
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
            .watch(config.watchhtml)
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

    karma.start({
        configFile: __dirname + '/karma.conf.js',
        exclude: excludeFiles,
        singleRun: !!singleRun
    }, karmaCompleted);

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