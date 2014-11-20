/*jslint node:true */
'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var watchify = require('watchify');

gulp.task('default', ['build', 'browser-sync'], function () {
    gulp.watch("../src/**.js", ['javascript', browserSync.reload]);
});

gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: "../build"
        }
    });
});

gulp.task('javascript', function () {
    var bundler, bundle;
    bundler = watchify(browserify('../src/js/main.js', watchify.args));

    bundle = function () {
        return bundler.bundle()
            // log errors if they happen
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps:true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('../build'))
            .pipe(gulp.dest('../build'));
    };

    bundler.on('update', bundle);

    return bundle();
});

gulp.task('build', ['javascript'], function () {
    gulp.src('../src/!(js)**')
        .pipe(gulp.dest('../build'));
});