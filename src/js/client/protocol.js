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

var
// Module
    arena = require('../common/arena'),
    level = require('./level'),
// Local
    receivers = [], c, s;

Object.defineProperty(exports, 'connection', {
    get: function () {
        return c;
    },
    set: function (val) {
        c = val;
        c.message.add(exports.receive);
    }
});

Object.defineProperty(exports, 'simulator', {
    get: function () {
        return s;
    },
    set: function (val) {
        s = val;
    }
});

exports.receive = function (d) {
    if (arena.debug) {
        console.log('[client]', d);
    }
    var type = d[0];
    receivers[type](d);
};

// KeepAlive 0 num S<>C

receivers[0] = exports.receiveKeepAlive = function (d) {
    // Send it right back
    c.send(d);
};

// UpdatePlayer 1 state S<>C

exports.sendUpdatePlayer = function (state) {
    c.send([1, state]);
};

receivers[1] = exports.receiveUpdatePlayer = function (d) {
    s.updateBody(0, d[1]);
};

// SpawnObject 2 desc id S>C

receivers[2] = exports.receiveSpawnObject = function (d) {
    level.spawnFromDesc(d[1], d[2]);
};
