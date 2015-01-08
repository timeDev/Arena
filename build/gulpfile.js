/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Oskar Homburg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/*global require, module, exports*/

// ====== Default task ======
var
    gulp = require('gulp'),
    connect = require('gulp-connect');

gulp.task('default', ['build'], function () {
    connect.server({
        root: '../out'
    });
});

gulp.task('server', function () {
    connect.server({
        root: '../out'
    });
});

// ====== Clean task ======
var
    del = require('del');

gulp.task('clean', function (cb) {
    del(['../out'], {force: true}, cb);
});

// ====== Build increment ======
var
    replace = require('gulp-replace');

function increment(str) {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(new RegExp("exports." + str + " = (\\d+);"), function (match, ver) {
            return "exports." + str + " = " + (parseInt(ver, 10) + 1) + ";";
        }));
}

gulp.task('increment-major', ['increment-minor'], function () {
    return increment('major')
        .pipe(replace(/exports.minor = (\d+);/, "exports.minor = 0;"))
        .pipe(gulp.dest('./'));
});

gulp.task('increment-minor', ['increment-revision'], function () {
    return increment('minor')
        .pipe(replace(/exports.revision = (\d+);/, "exports.revision = 0;"))
        .pipe(gulp.dest('./'));
});

gulp.task('increment-revision', ['increment-build'], function () {
    return increment('revision')
        .pipe(replace(/exports.build = (\d+);/, "exports.build = 0;"))
        .pipe(gulp.dest('./'));
});

gulp.task('increment-build', ['version-time'], function () {
    return increment('build')
        .pipe(gulp.dest('./'));
});

gulp.task('version-time', function () {
    return gulp.src('../src/js/version.js', {base: './'})
        .pipe(replace(/exports.timestamp = ".+";/, 'exports.timestamp = "' + new Date().toISOString() + '";'))
        .pipe(gulp.dest('./'));
});

// ====== Build tasks ======
var
    gutil = require('gulp-util'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    watchify = require('watchify'),
    factor = require('factor-bundle');

gulp.task('copy-assets', ['clean'], function () {
    // We have to copy assets before running browserify,
    // because factor-bundle doesn't create its output directory
    return gulp.src(['../src/**', '!../src/{js,js/**}'])
        .pipe(gulp.dest('../out'));
});

gulp.task('build', ['copy-assets', 'increment-build'], function () {
    var bundler = browserify({
        entries: ['../src/js/entry/client.js', '../src/js/entry/server.js'],
        baseDir: './../src/js',
        debug: true,
        cache: {},
        packageCache: {}
    });
    bundler.plugin(factor, {o: ['../out/game.js', '../out/server.js']});
    bundler = watchify(bundler);

    function bundle() {
        gutil.log('Rebundling');
        return bundler.bundle()
            // log errors if they happen
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .on('log', console.error)
            .pipe(source('common.js'))
            .pipe(buffer())
            .pipe(gulp.dest('../out'));
    }

    gulp.watch('../src/js/**/!(version).js', ['increment-build']);
    gulp.watch('../src/js/version.js', bundle);

    return bundle();
});

gulp.task('make', ['copy-assets'], function () {
    browserify({
        entries: ['../src/js/entry/client.js', '../src/js/entry/server.js'],
        baseDir: './../src/js',
        debug: false,
        cache: {},
        packageCache: {}
    })
        .plugin(factor, {o: ['../out/game.js', '../out/server.js']})
        .bundle()
        .pipe(source('common.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('../out'));
});
