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
    client = require('./client'),
    simulator = require('../common/simulator'),
    chat = require('../dom/chat'),
// Local
    receivers = [];

exports.receive = function (d) {
    if (arena.debug) {
        console.log("[in]", d);
    }
    var type = d[0];
    receivers[type](d);
};

function sendRaw(d) {
    client.connection.send(d);
    if (arena.debug) {
        console.log("[out]", d);
    }
}

// KeepAlive 0 num S<>C

receivers[0] = exports.receiveKeepAlive = function (d) {
    // Send it right back
    sendRaw(d);
};

// PlayerData 1 playerId type data S>C
//            1 data pktnr C>S
// Types:
// 0 = welcome, 1 = position
// 2 = connect, 3 = disconnect

var pktnr = 0,
    unackPkts = [];

exports.sendPlayerData = function (data) {
    sendRaw([1, data, ++pktnr]);
    unackPkts[pktnr] = data;
};

receivers[1] = exports.receivePlayerData = function (d) {
    var eid, pid = d[1], type = d[2], data = d[3];
    if (type === 0) {
        client.players[pid] = 0;
    }
    if (type === 1) {
        eid = client.players[pid];
        var pcktcount = unackPkts.filter(function (e) {
            return e !== undefined;
        }).length;
        if (eid === 0) {
            var pnr = data.pnr;
            var pkt = unackPkts[pnr];
            // Only correct position as player acceleration is pretty high
            var corr = {x: data.p[0] - pkt.p[0], y: data.p[1] - pkt.p[1], z: data.p[2] - pkt.p[2]};
            // Avoid cyclic deps
            var controls = require('./controls');
            //noinspection JSCheckFunctionSignatures
            controls.physBody.position.vadd(corr, controls.physBody.position);
            controls.sceneObj.position.copy(controls.physBody.position);
            delete unackPkts[pnr];
        } else {
            simulator.updateBody(eid, data);
        }
        if (pcktcount < 1) {
            unackPkts = [];
            // Reset the counter so everyone is happy
            pktnr = 0;
        }
    }
    if (type === 2) {
        client.spawnPlayer(pid, data);
    }
    if (type === 3) {
        client.players[pid] = undefined;
    }
};

// Logon 3 name C>S

exports.sendLogon = function (name) {
    sendRaw([3, name]);
};

// Chat Message 4 msg C<>S

chat.submitFn = exports.sendChatMsg = function (str) {
    sendRaw([4, str]);
};

receivers[4] = exports.receiveChatMsg = function (d) {
    chat.refresh();
    chat.write(d[1]);
};

// === Entities ===

// Spawn object from string 10 id string S>C

receivers[10] = exports.receiveSpawnObject = function (d) {
    // Avoid cyclic dependency -> load module in function
    require('./level').spawnFromDesc(d[2], d[1]);
};

// Spawn entity by name 11 id name meta S>C

receivers[11] = exports.receiveSpawnEntity = function (d) {
    throw 'Not implemented';
};

// Update entity by id 12 id meta S>C

receivers[12] = exports.receiveUpdateEntity = function (d) {
    if (d[2].ph) {
        if (!simulator.areColliding(0, d[1])) {
            simulator.updateBody(d[1], d[2].ph);
        }
    }
};

// Kill entity by id 13 id S>C

receivers[13] = exports.receiveKillEntity = function (d) {
    simulator.remove(d[1]);
};

// Spawn many 14 list
// list: array of {id,str/name,meta}

receivers[14] = exports.receiveSpawnMany = function (d) {
    for (var i = 0; i < d[1].length; i++) {
        var obj = d[1][i];
        if (obj.str) {
            require('./level').spawnFromDesc(obj.str, obj.id);
        }
    }
};

// RCON protocol
// rcon status 200 - C>S | msg S>C
// rcon error 201 msg S>C
// rcon command 202 str C>S
// rcon query 203 cvarname C>S
// rcon cvar 204 cvarname value S>C
// rcon reversecmd (sent by server, must not be questioned) 205 cmd S>C
// rcon authorize 206 password C>S
// rcon queryall 207 C>S
// Important: messages are not encrypted! Do not reuse the rcon password
// for things like email and stuff! Someone getting into your server
// should not be a big deal, as you can easily restart it via ssh or whatever

var rconHandler;
Object.defineProperty(exports, 'rconHandler', {
    get: function () {
        return rconHandler;
    },
    set: function (val) {
        rconHandler = val;
    }
});

receivers[200] = exports.receiveRconStatus = function (d) {
    rconHandler.status(d[1]);
};

receivers[201] = exports.receiveRconError = function (d) {
    rconHandler.error(d[1]);
};

receivers[204] = exports.receiveRconCvar = function (d) {
    if (arena.debug) {
        console.log("RCON response:", d[1], d[2]);
    }
    rconHandler.cvar(d[1], d[2]);
};

receivers[205] = exports.receiveRconRevCmd = function (d) {
    if (arena.debug) {
        console.log("Server command:", d[1]);
    }
    rconHandler.command(d[1]);
};

exports.sendRconStatus = function () {
    sendRaw([200]);
};

exports.sendRconCommand = function (str) {
    sendRaw([202, str]);
};

exports.sendRconQuery = function (cvar) {
    sendRaw([203, cvar]);
};

exports.sendRconAuthorize = function (pwd) {
    sendRaw([206, pwd]);
};

exports.sendRconQueryAll = function () {
    sendRaw([207]);
};
