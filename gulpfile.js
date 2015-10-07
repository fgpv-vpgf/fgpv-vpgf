var gulp = require('gulp');
var del = require('del');
var help = require('gulp-help')(gulp);
var pkg = require('./package.json');
var $ = require('gulp-load-plugins')({ lazy: true });

gulp.task('clean', 'Remove dist folder', function (done) {
    del('dist');
});

gulp.task('check', 'Checks code against style guidelines', function () {
    return gulp
        .src('src/**/*.js')
        .pipe($.jshint())
        .pipe($.jscs())
        .pipe($.jscsStylish.combineWithHintResults())   // combine with jshint results
        .pipe($.jshint.reporter('jshint-stylish', { verbose:true }))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('build', 'Transpile and concatenate the code', function () {
    return gulp
        .src('src/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.concat('geoApi.js'))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('test', 'Run unit tests in jasmine', ['build'], function () {
    return gulp
        .src('spec/*Spec.js')
        .pipe($.jasmine());
});

gulp.task('default', 'Check style and unit tests', ['check', 'test']);
