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
    protocol = require('./protocol'),
// Local
    packets = [], queue = [], data;

exports.init = function (gamedata) {
    data = gamedata;
    protocol.registerPackets(packets);
    exports.makePacket = protocol.makePacket;
};
exports.initDom = function () {
};
exports.render = function () {
};

exports.receive = function (d) {
    if (arena.debug) {
        console.log("[in]", d);
    }
    var type = d[0];
    var pck = packets[type].receive(d);
    queue.push(pck);
};

exports.update = function (dt, data) {
    data.packets = queue;
    queue = [];

    handleCommon(data);
};

exports.send = function (pck) {
    packets[pck.id].send(sendRaw, pck);
};

function sendRaw(d) {
    data.connection.send(d);
    if (arena.debug) {
        console.log("[out]", d);
    }
}

function handleCommon(data) {
    // Handle all easy packets (simple response) here
    for (var i = 0; i < data.packets.length; i++) {
        var pck = data.packets[i];
        if (pck.type === 'keepAlive') {
            // Send it right back
            exports.send(pck);
        }
    }
}
