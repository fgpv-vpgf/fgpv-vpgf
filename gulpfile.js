/* jshint camelcase:false */
var gulp = require('gulp');
//var common = require('./gulp/common.js');
//var merge = require('merge-stream');
var pkg = require('./package.json');
var plug = require('gulp-load-plugins')();

//var env = plug.util.env;
var log = plug.util.log;


gulp.task('build', ['js:build', 'css:build', 'html:build'],
    function() {
        log('Bundling, minifying, and copying the app\'s JavaScript');

        
    }
);

gulp.task('js:build',
    function() {

        return gulp
            .src([].concat(pkg.fgpv.paths.libjs, pkg.fgpv.paths.js))
            .pipe(plug.concat('fgpv.js'))
            .pipe(gulp.dest(pkg.fgpv.paths.build))
            .pipe(plug.connect.reload());
        ;
    }
);

gulp.task('css:build',
    function() {

        // merge streams?
        return gulp
            .src(pkg.fgpv.paths.css)
            .pipe(plug.sass().on('error', plug.sass.logError))
            .pipe(gulp.dest(pkg.fgpv.paths.build))
            .pipe(plug.connect.reload());
        ;
    }
);

gulp.task('html:build', 
    function() {
        log('Copying html pages');
        
        return gulp
            .src(pkg.fgpv.paths.src + 'index.html')
            .pipe(gulp.dest(pkg.fgpv.paths.build))
            .pipe(plug.connect.reload());
    }
);

gulp.task('reload', 
    function() {
        plug.connect.reload();
    }
);

gulp.task('serve:build', ['build'],
    function() {
        plug.connect.server({
            root: pkg.fgpv.paths.serve,
            livereload: true
        });

        gulp
            .watch(pkg.fgpv.paths.js, ['js:build'])
            .on('change', logWatch);
        ;

        gulp
            .watch(pkg.fgpv.paths.css, ['css:build'])
            .on('change', logWatch);
        ;

        gulp
            .watch(pkg.fgpv.paths.src + 'index.html', ['html:build'])
            .on('change', logWatch);
        ;

        function logWatch(event) {
            log('*** File ' + event.path + ' was ' + event.type + ', running tasks...');
        }
    }
);