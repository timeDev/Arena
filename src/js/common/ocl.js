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
// Object class Loader
/*global require, module, exports */
var
// Local
    classes = {},
// Function
    suspend, resume, run;

exports.define = function (name, fun) {
    classes[name] = fun;
};

exports.load = function (str, cb) {
    var value, called = false, callback = function () {
        callback.i--;
        if (value !== undefined && callback.i <= 0) {
            if (cb && !called) {
                cb(value);
                called = true;
            }
        }
    };
    callback.i = 0;
    value = JSON.parse(str, function (k, v) {
        return exports.reviver(k, v, callback);
    });
    if (callback.i <= 0 && cb && !called) {
        cb(value);
        called = true;
    }
    return value;
};

exports.reviver = function (key, value, cb) {
    var result = {};
    if (typeof value !== 'object') {
        return value;
    }
    if (value.class === undefined) {
        return value;
    }
    if (!Array.isArray(value.class)) {
        value.class = [value.class];
    }

    result.ocl = {
        key: key,
        value: value,
        classes: value.class,
        i: 0,
        suspended: false,
        suspend: suspend,
        resume: resume,
        run: function () {
            run(result);
        },
        done: cb
    };

    cb.i++;

    result.ocl.run();

    return result;
};

run = function (obj) {
    var params, cl;
    while (obj.ocl.i < obj.ocl.classes.length && !obj.ocl.suspended) {
        cl = obj.ocl.classes[obj.ocl.i++];
        params = obj.ocl.value[cl] === undefined ? [] : Array.isArray(obj.ocl.value[cl]) ? obj.ocl.value[cl] : [obj.ocl.value[cl]];
        classes[cl].apply(obj, params);
    }
    if (obj.ocl.i >= obj.ocl.classes.length && !obj.ocl.suspended) {
        obj.ocl.done();
    }
};

suspend = function () {
    this.suspended = true;
};

resume = function () {
    if (this.suspended) {
        this.suspended = false;
        this.run();
    } else {
        console.log('resume not suspended');
        console.trace();
    }
};
