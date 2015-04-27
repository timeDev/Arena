/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Oskar Homburg
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

var delta = require('./util/delta');
var components = [], loop, clock;

exports.data = {
    time: 0,
    rendertime: 0,
    timescale: 1
};

exports.addComponent = function (comp) {
    components.push(comp);
};

exports.init = function () {
    var data = exports.data;
    for (var i = 0; i < components.length; i++) {
        components[i].init(data);
    }
};

exports.initDom = function () {
    var data = exports.data;
    for (var i = 0; i < components.length; i++) {
        components[i].initDom(data);
    }
};

exports.update = function () {
    var data = exports.data;
    // Since game is a singleton, we don't have to use a unique string
    var dt = delta("updateloop") * exports.data.timescale;
    exports.data.time += dt;
    for (var i = 0; i < components.length; i++) {
        components[i].update(dt, data);
    }
};

exports.render = function () {
    var data = exports.data;
    var dt = delta("renderloop") * exports.data.timescale;
    exports.data.rendertime += dt;
    for (var i = 0; i < components.length; i++) {
        components[i].render(dt, data);
    }
};

exports.run = function () {
    exports.data.time = 0;
    if (exports.data.clientside) {
        loop = require('./util/renderloop')(exports.render);
    }
    clock = new (require('./util/clock'))(16, exports.update);
    exports.start();
};

exports.start = function () {
    if (exports.data.clientside) {
        loop.start();
    }
    clock.start();
};

exports.stop = function () {
    if (exports.data.clientside) {
        loop.stop();
    }
    clock.stop();
};
