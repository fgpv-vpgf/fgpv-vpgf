/* globals -$ */
'use strict';
var gulp = require('gulp');
var del = require('del');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var pkg = require('./package.json');
var $ = require('gulp-load-plugins')({ lazy: true });

require('gulp-help')(gulp);

gulp.task('clean', 'Remove dist folder', function (done) {
    del('dist', done);
});

gulp.task('check', 'Checks code against style guidelines', function () {
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

gulp.task('dist', 'Generate tgz and zip files for distribution', ['zip', 'tgz']);

gulp.task('build', 'Transpile and concatenate the code', function () {
    var b = browserify({ entries: 'src/index.js', standalone: 'geoapi' }).transform(babelify);
    return b.bundle()
        .pipe(source('gapi.js'))
        .pipe(buffer())
        .pipe($.derequire())
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.concat('geoapi.js'))
        /* .pipe(gulp.dest('dist/v' + pkg.version)) */
        .pipe(gulp.dest('dist'))
        .pipe($.rename('geoapi.min.js'))
        .pipe($.uglify())
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('test', 'Run unit tests in jasmine', ['build'], function () {
    return gulp
        .src('spec/*Spec.js')
        .pipe($.jasmine());
});

gulp.task('default', 'Check style and unit tests', ['check', 'test']);

gulp.task('serve', ['check', 'build'], function () {
    $.connect.server({ root:'.', port:6002 });
});
