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
// Local
    players,
    receivers = [];

Object.defineProperty(exports, 'players', {
    get: function () {
        return players;
    },
    set: function (val) {
        players = val;
    }
});

var send = exports.send = function (p, d) {
    p.connection.send(d);
};

exports.broadcast = function (d) {
    for (var i = 0; i < players.length; i++) {
        send(players[i], d);
    }
};

exports.receive = function (p, d) {
    if (arena.debug) {
        console.log('[server]', p, d);
    }
    var type = d[0];
    receivers[type](p, d);
    p.data.timer = Date.now();
};

// KeepAlive 0 num S<>C

exports.sendKeepAlive = function (p) {
    var num = Math.random();
    p.data.lastKeepAlive = num;
    send(p, [0, num]);
};

receivers[0] = exports.receiveKeepAlive = function (p, d) {
    var num = d[1];
    if (p.data.lastKeepAlive === num) {
        p.data.lastKeepAlive = -1;
    }
};

// UpdatePlayer 1 state S<>C

exports.sendUpdatePlayer = function (p, state) {
    send(p, [1, state]);
};

receivers[1] = exports.receiveUpdatePlayer = function (p, d) {
    p.updateBody(d[1]);
};

// SpawnObject 2 desc id S>C

exports.sendSpawnObject = function (p, str, id) {
    send(p, [2, str, id]);
};

exports.spawnObject = function (str, id) {
    return [2, str, id];
};
