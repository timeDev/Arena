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
var work = require('webworkify');

function Clock(period, callback, thisArg) {
    this.period = period;
    this.callback = callback;
    this.thisArg = thisArg;
    this.worker = work(require('./clock_worker.js'));
    this.worker.onmessage = loopfn(this);
}

function loopfn(self) {
    var ts = Date.now();
    return function () {
        var now = Date.now(), dt = (now - ts) / 1000.0;
        self.callback.call(self.thisArg, dt);
        ts = now;
    }
}

Clock.prototype.start = function () {
    this.worker.postMessage(['start', this.period]);
};

Clock.prototype.stop = function () {
    this.worker.postMessage(['stop']);
};

Clock.startNew = function (period, callback, thisArg) {
    var obj = new Clock(period, callback, thisArg);
    obj.start();
    return obj;
};

module.exports = Clock;
