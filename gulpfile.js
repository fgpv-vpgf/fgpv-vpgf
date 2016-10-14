/* globals -$ */
'use strict';
const gulp = require('gulp');
const del = require('del');
const yargs = require('yargs');
const args = yargs.argv;
const runSequence = require('run-sequence');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const babelify = require('babelify');
const pkg = require('./package.json');
const $ = require('gulp-load-plugins')({ lazy: true });
const Dgeni = require('dgeni');

require('gulp-help')(gulp);

let PROD_MODE = args.prod;

/**
 * --prod: generate source maps and uglify code; this is turned on when running 'gulp dist'
 * --guts: skip style checks
 */

gulp.task('clean', 'Remove dist folder', function () {
    del.sync('dist');
});

gulp.task('check', 'Checks code against style guidelines', function (done) {
    if (args.guts) {
        return done();
    }

    return gulp
        .src(['src/**/*.js', '*.js'])
        .pipe($.jshint())
        .pipe($.jscs())
        .pipe($.jscsStylish.combineWithHintResults())   // combine with jshint results
        .pipe($.jshint.reporter('jshint-stylish', { verbose:true }))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('tgz', 'Generate tarball for distribution', ['build'], function () {
    return gulp
        .src(['dist/*.js', 'dist/*.map'])
        .pipe($.tar('geoapi-' + pkg.version + '.tgz'))
        .pipe($.gzip({ append: false }))
        .pipe(gulp.dest('dist'));
});

gulp.task('zip', 'Generate zip for distribution', ['build'], function () {
    return gulp
        .src(['dist/*.js', 'dist/*.map'])
        .pipe($.zip('geoapi-' + pkg.version + '.zip'))
        .pipe(gulp.dest('dist'));
});

// gulp.task('dist', 'Generate tgz and zip files for distribution', ['zip', 'tgz']);

gulp.task('dist', 'Generate tgz and zip files for distribution', done => {
    // turn on --prod flag to enable minification
    runSequence('prod', 'check', ['zip', 'tgz'], done);
});

gulp.task('build', 'Transpile and concatenate the code', ['clean'], function () {
    var b = browserify({ entries: 'src/index.js', standalone: 'geoapi' }).transform(babelify);
    return b.bundle()
        .pipe(source('gapi.js'))
        .pipe(buffer())
        .pipe($.derequire())
        .pipe($.if(PROD_MODE, $.sourcemaps.init()))
        /* .pipe($.babel()) */
        .pipe($.concat('geoapi.js'))
        /* .pipe(gulp.dest('dist/v' + pkg.version)) */
        .pipe(gulp.dest('dist'))
        .pipe($.if(PROD_MODE, $.rename('geoapi.min.js'))) // do not create a minified file unless --prod is provided
        .pipe($.if(PROD_MODE, $.uglify()))
        .pipe($.if(PROD_MODE, $.sourcemaps.write('.')))
        .pipe($.if(PROD_MODE, gulp.dest('dist')));
});

gulp.task('prod', 'Sets production mode', () => PROD_MODE = true);

gulp.task('test', 'Run unit tests in jasmine', ['check', 'build'], function () {
    return gulp
        .src('spec/*Spec.js')
        .pipe($.jasmine({ verbose: true }));
});

gulp.task('default', 'Check style and unit tests', ['check', 'test']);

gulp.task('serve', ['check', 'build'], function () {
    $.connect.server({ root:'.', port:6002 });
});

/**
 * Remove dgeni generated docs
 */
gulp.task('docs-clean', function (done) {
    return del([
        'dist/docs/**'
        ], done);
});

/**
 * Build docs
 */
gulp.task('docs-build', ['docs-clean'], function () {
    var dgeni = new Dgeni([require('./docs/config/dgeni-conf')]);
    return dgeni.generate();
});

// important task: copy site resources to the app folder; images, styles, app.js
// !myDgeni/docs/app/js/**/*.txt is for exclusion.
gulp.task('docs-resources', ['docs-build'], function () {
    return gulp.src(['docs/app/**/*', '!docs/app/js/**/*.txt'])
    .pipe(gulp.dest('dist/docs/app'));
});

/**
 * Serves the app.
 * -- test  : run Karma auto tests in parallel
 * -- protractor: prepare index-protractor page and do not inject app-seed
 */
gulp.task('serve:docs', 'Build the docs and start a local development server', ['dgeni'],
    function () {
        $.connect.server({
            root: './dist/docs/app/',
            livereload: true,
            port: '6002'
        });
    });

// run doc generation
gulp.task('dgeni', ['docs-resources']);
