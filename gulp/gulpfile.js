/*global require */
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
var del = require('del');
var replace = require('gulp-replace');

gulp.task('default', ['build', 'browser-sync'], function () {
    //gulp.watch("../build/**", [browserSync.reload]);
});

gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: "../build"
        }
    });
});

gulp.task('clean', function (cb) {
    del(['../build'], {force: true}, cb);
});

gulp.task('increment-major', ['version-time'], function () {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(/exports.major = (\d+);/, function (match, ver) {
            return 'exports.major = ' + (parseInt(ver, 10) + 1) + ';';
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('increment-minor', ['version-time'], function () {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(/exports.minor = (\d+);/, function (match, ver) {
            return 'exports.minor = ' + (parseInt(ver, 10) + 1) + ';';
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('increment-revision', ['version-time'], function () {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(/exports.revision = (\d+);/, function (match, ver) {
            var version = parseInt(ver, 10) + 1;
            return 'exports.revision = ' + version + ';';
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('increment-build', ['version-time'], function () {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(/exports.build = (\d+);/, function (match, ver) {
            return 'exports.build = ' + (parseInt(ver, 10) + 1) + ';';
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('version-time', function () {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(/exports.timestamp = "(.+)";/, function () {
            return 'exports.timestamp = "' + new Date().toISOString() + '";';
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('javascript', ['clean'], function () {
    var bundler, bundle;
    bundler = watchify(browserify('../src/js/main.js', {
        cache: {}, packageCache: {}, fullPaths: true, debug: true
    }));

    bundle = function () {
        return bundler.bundle()
            // log errors if they happen
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('../build'));
    };

    bundler.on('update', bundle);

    return bundle();
});

gulp.task('build', ['clean', 'increment-build', 'javascript'], function () {
    return gulp.src(['../src/**', '!../src/{js,js/**}'])
        .pipe(gulp.dest('../build'));
});