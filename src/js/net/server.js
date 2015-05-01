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
    scenehelper = require('../phys/scenehelper'),
    makePacket = require('./packet'),
// Local
    receivers = [],
    packets = [],
    queue = [],
    data;

// 0:KeepAlive [S<->C] num
packets[0] = makePacket(['num'], 0, 'keepAlive');
// 1:PlayerDataC [S->C] pid action data
packets[1] = makePacket(['pid', 'action', 'data'], 1, 'playerDataC');
// 2:PlayerDataS [C->S] data pknr
packets[2] = makePacket(['data', 'pknr'], 2, 'playerDataS');
// 3:Logon [C->S] name
packets[3] = makePacket(['name'], 3, 'logon');
// 4:Chat Message [S<->C] msg
packets[4] = makePacket(['msg'], 4, 'chatMsg');
// 10:Spawn Object from String [S->C] id string
packets[10] = makePacket(['id', 'string'], 10, 'spawnObj');
// 11:Spawn entity by name [S->C] id name meta
packets[11] = makePacket(['id', 'name', 'meta'], 11, 'spawnEnt');
// 12:Update Entity [S->C] id data
packets[12] = makePacket(['id', 'data'], 12, 'updateEnt');
// 13:Kill entity [S->C] id
packets[13] = makePacket(['id'], 13, 'killEnt');
// 14:Spawn many [S->C] list
packets[14] = makePacket(['list'], 14, 'spawnMany');
// 20:Game State [S->C] state
packets[20] = makePacket(['state'], 20, 'gameState');

exports.init = function () {
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

exports.send = function (player, pck) {
    packets[pck.id].send(sendRaw.bind(player), pck);
};

exports.makePacket = function (type) {
    for (var i = 0; i < packets.length && typeof type === 'string'; i++) {
        if (packets[i] && packets[i].type === type) {
            type = packets[i].id;
            break;
        }
    }
    if (typeof type !== 'number' || !packets[type]) {
        throw "Invalid packet id: " + type;
    }
    var args = [];
    for (var j = 1; j < arguments.length; j++) {
        args[i - 1] = (arguments[i]);
    }
    return packets[type].make.apply(this, args);
};

function sendRaw(p, d) {
    p.connection.send(d);
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

exports.init = function (gamedata) {
    data = gamedata;
};

var send = exports.send = function (p, d) {
    p.connection.send(d);
    if (arena.debug) {
        console.log("[out]", p.playerId, ",", d);
    }
};

exports.broadcast = function (d) {
    for (var i = 0; i < data.players.length; i++) {
        send(data.players[i], d);
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
    exports.broadcast([1, p.playerId, 1, {
        p: p.mesh.position.toArray(),
        v: p.mesh.getLinearVelocity().toArray(),
        pnr: d[2]
    }]);
};

// Logon 3 name C>S

receivers[3] = exports.receiveLogon = function (p, d) {
    p.name = d[1];
    exports.sendPlayerData(p, p.playerId, 0, {});
    exports.sendSpawnMany(p, data.mapState);
    for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        exports.sendPlayerData(player, p.playerId, 2, {
            id: p.entityId,
            pos: p.mesh.position.toArray()
        });
        exports.sendPlayerData(p, player.playerId, 2, {
            id: player.entityId,
            pos: player.mesh.position.toArray()
        });
    }
    exports.sendGameState(p, data.gameState);
    data.players.push(p);
    scenehelper.add(p.mesh, p.entityId);
};

// Chat Message 4 msg C<>S

exports.sendChatMsg = function (p, msg) {
    send(p, [4, msg]);
};

exports.chatMsg = function (msg) {
    return [4, msg];
};

receivers[4] = exports.receiveChatMsg = function (p, d) {
    var origMsg = d[1];
    var playerName = p.name;
    var msg = playerName + ": " + origMsg + "<br>";
    // TODO: filter event exploits
    exports.broadcast(exports.chatMsg(msg));
};

// === Entities ===

// Spawn object from string 10 id string S>C

exports.sendSpawnObject = function (p, id, str) {
    send(p, [10, id, str]);
};

exports.spawnObject = function (id, str) {
    return [10, id, str];
};

// Spawn entity by name 11 id name meta S>C

exports.sendSpawnEntity = function (p, id, name, meta) {
    send(p, [11, id, name, meta]);
};

exports.spawnEntity = function (id, name, meta) {
    return [11, id, name, meta];
};

// Update entity by id 12 id meta S>C

exports.sendUpdateEntity = function (p, id, meta) {
    send(p, [12, id, meta]);
};

exports.updateEntity = function (id, meta) {
    return [12, id, meta];
};

// Kill entity by id 13 id S>C

exports.sendKillEntity = function (p, id) {
    send(p, [13, id]);
};

exports.killEntity = function (id) {
    return [13, id];
};

// Spawn many 14 list
// list: array of {id,str/name,meta}

exports.sendSpawnMany = function (p, list) {
    send(p, [14, list]);
};

// ===

// Game state 20 state S>C

exports.sendGameState = function (p, state) {
    send(p, [20, state]);
};

exports.gameState = function (state) {
    return [20, state];
};
