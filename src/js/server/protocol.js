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
    server = require('./server'),
    simulator = require('../common/simulator'),
// Local
    players = server.players,
    receivers = [];

var send = exports.send = function (p, d) {
    p.connection.send(d);
    if (arena.debug) {
        console.log("[out]", p.playerId, ",", d);
    }
};

exports.broadcast = function (d) {
    for (var i = 0; i < players.length; i++) {
        send(players[i], d);
    }
};

exports.receive = function (p, d) {
    if (arena.debug) {
        console.log("[in]", p.playerId, ",", d);
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

// PlayerData 1 playerId type data S>C
//            1 data pktnr C>S
// Types:
// 0 = welcome, 1 = position
// 2 = connect, 3 = disconnect

exports.sendPlayerData = function (p, plId, type, data) {
    send(p, [1, plId, type, data]);
};

receivers[1] = exports.receivePlayerData = function (p, d) {
    p.updateBody(d[1]);
    exports.broadcast([1, p.playerId, 1, {p: p.body.position.toArray(), v: p.body.velocity.toArray(), pnr: d[2]}]);
};

// SpawnObject 2 desc id S>C

exports.sendSpawnObject = function (p, str, id) {
    send(p, [2, str, id]);
};

exports.spawnObject = function (str, id) {
    return [2, str, id];
};

// Logon 3 name C>S

receivers[3] = exports.receiveLogon = function (p, d) {
    p.name = d[1];
    exports.sendPlayerData(p, p.playerId, 0, {});
    for (var i = 0; i < server.players.length; i++) {
        var player = server.players[i];
        exports.sendPlayerData(player, p.playerId, 2, {
            id: p.entityId,
            pos: p.body.position.toArray()
        });
        exports.sendPlayerData(p, player.playerId, 2, {
            id: player.entityId,
            pos: player.body.position.toArray()
        });
    }
    server.players.push(p);
    simulator.add(p.body, p.entityId);
};

// RCON protocol
// rcon status 200 - C>S | msg S>C
// rcon error 201 msg S>C
// rcon command 202 cmd args C>S requires authorization
// rcon query 203 cvarname C>S
// rcon cvar 204 cvarname value S>C
// rcon reversecmd (sent by server, must not be questioned) 205 cmd S>C
// rcon authorize 206 password C>S
// rcon queryall 207 C>S
// Important: messages are not encrypted! Do not reuse the rcon password
// for things like email and stuff! Someone getting into your server
// should not be a big deal, as you can easily restart it via ssh or whatever

receivers[200] = exports.receiveRconStatus = function (p /*, d*/) {
    send(p, [200, server.getServerStatusMsg()]);
};

receivers[202] = exports.receiveRconCmd = function (p, d) {
    if (!p.data.rconAuthorized) {
        send(p, [201, "not authorized"]);
        return;
    }
    server.executeCommand(d[1], d[2]);
};

receivers[203] = exports.receiveRconQuery = function (p, d) {
    var response = server.getCvar(d[1], p.data.rconAuthorized);
    send(p, [204, d[1], response]);
};

receivers[206] = exports.receiveRconAuthorize = function (p, d) {
    if (server.matchesRconPassword(d[1])) {
        p.data.rconAuthorized = true;
    }
};

receivers[207] = exports.receiveRconQueryAll = function (p /*, d*/) {
    var responseList = server.getCvarList(p.data.rconAuthorized);
    for (var i = 0; i < responseList.length; i++) {
        var res = responseList[i];
        send(p, [204, res[0], res[1]]);
    }
};
