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
/*global require, module, exports */
var console = require('./console');

exports.validate = function (expected, args) {
    var i, result = true;
    if (args.length !== expected.length + 1) {
        console.warn("Mismatched arguments! Expected {0}, got {1}", expected.length, args.length - 1);
        return false;
    }
    for (i = 0; i < expected.length; i++) {
        if (expected[i] === 'number') {
            var val = args[i + 1];
            if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                val = parseFloat(val);
            }
            args[i + 1] = val;
        }
        if (typeof args[i + 1] !== expected[i]) {
            console.warn("Mismatched argument types! [{0}] Expected {1}, got {2}", i + 1, expected[i], typeof args[i + 1]);
            result = false;
        }
    }
    return result;
};

exports.register = function (list) {
    for (var key in list) {
        if (list.hasOwnProperty(key)) {
            console.registerFunc(key, list[key]);
        }
    }
};