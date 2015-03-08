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
function Clock(period, callback, thisArg) {
    this.period = period;
    this.callback = callback;
    this.thisArg = thisArg;
    if (Clock.useWorker) {
        this.worker = new Worker(Clock.blobUrl);
        this.worker.onmessage = loopfn(this);
    }
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
    if (Clock.useWorker) {
        this.worker.postMessage(['start', this.period]);
    } else {
        this.id = setInterval(loopfn(this), this.period);
    }
};

Clock.prototype.stop = function () {
    if (Clock.useWorker) {
        this.worker.postMessage(['stop']);
    } else {
        clearInterval(this.id);
    }
};

Clock.startNew = function (period, callback, thisArg) {
    var obj = new Clock(period, callback, thisArg);
    obj.start();
    return obj;
};

if (!!window.Worker) {
    Clock.useWorker = true;

    /*//code before minification
var id;
onmessage = function (e) {
    if (e.data[0] === 'start') {
        id = setInterval(function () {
            postMessage(0);
        }, e.data[1]);
    } else if (data[0] === 'stop') {
        clearTimeout(id);
    }
}
     */
    var blob = new Blob(["var i;onmessage=function(t){'start'===t.data[0]?i=setInterval(function(){postMessage(0)},t.data[1]):'stop'===data[0]&&clearTimeout(i)}"],{type:'application/javascript'});

    Clock.blobUrl = window.URL.createObjectURL(blob);
}

module.exports = Clock;
