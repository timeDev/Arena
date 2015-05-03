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
    server = require('./../server/server'),
    protocol = require('./protocol'),
// Local
    packets = [],
    queue = [],
    data;

exports.receive = function (p, d) {
    if (arena.debug) {
        console.log("[in]", d);
    }
    var type = d[0];
    var pck = packets[type].receive(d);
    pck.player = p;
    queue.push(pck);
    p.data.timer = Date.now();
};

exports.update = function (dt, data) {
    data.packets = queue;
    queue = [];
};

exports.init = function (gamedata) {
    data = gamedata;
    protocol.registerPackets(packets);
    exports.makePacket = protocol.makePacket;
};

function sendfn(player) {
    return player.connection.send.bind(player.connection);
}

exports.send = function (player, pck) {
    packets[pck.id].send(sendfn(player), pck);
    if (arena.debug) {
        console.log("[out]", player.playerId, ",", pck);
    }
};

exports.broadcast = function (pck) {
    for (var i = 0; i < data.players.length; i++) {
        packets[pck.id].send(sendfn(data.players[i]), pck);
    }
    if (arena.debug) {
        console.log("[out] [bcast] ,", pck);
    }
};

exports.broadcastLevel = function (level, pck) {
    for (var i = 0; i < data.players.length; i++) {
        if (data.players[i].privilege >= level) {
            packets[pck.id].send(sendfn(data.players[i]), pck);
        }
    }
    if (arena.debug) {
        console.log("[out] [bcast level " + level + "] ,", pck);
    }
};
