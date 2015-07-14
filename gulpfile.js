/* jshint camelcase:false */
//var common = require('./gulp/common.js');
//var merge = require('merge-stream');
var gulp = require('gulp');
var del = require('del');
var pkg = require('./package.json');
var plug = $ = require('gulp-load-plugins')();
var rs = require('run-sequence');

//var env = plug.util.env;

var config = require('./gulp.config')();

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

gulp.task('serve:dev', ['inject'],
    function () {
        serve(true);
    }
);

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