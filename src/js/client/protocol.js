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
// Local
    s, cli,
    receivers = [];

Object.defineProperty(exports, 'simulator', {
    get: function () {
        return s;
    },
    set: function (val) {
        s = val;
    }
});

Object.defineProperty(exports, 'clientInterface', {
    get: function () {
        return cli;
    },
    set: function (val) {
        cli = val;
    }
});

exports.receive = function (d) {
    if (arena.debug) {
        console.log('[cl]', d);
    }
    var type = d[0];
    receivers[type](d);
};

function sendRaw(d) {
    client.connection.send(d);
}

// KeepAlive 0 num S<>C

receivers[0] = exports.receiveKeepAlive = function (d) {
    // Send it right back
    sendRaw(d);
};

// UpdatePlayer 1 state S<>C

exports.sendUpdatePlayer = function (state) {
    sendRaw([1, state]);
};

receivers[1] = exports.receiveUpdatePlayer = function (d) {
    s.updateBody(0, d[1]);
};

// SpawnObject 2 desc id S>C

receivers[2] = exports.receiveSpawnObject = function (d) {
    cli.spawnFromDesc(d[1], d[2]);
};

// RCON protocol
// rcon status 200 - C>S | msg S>C
// rcon error 201 msg S>C
// rcon command 202 cmd args C>S
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
        console.log("[cl] RCON response:", d[1], d[2]);
    }
    rconHandler.cvar(d[1], d[2]);
};

receivers[205] = exports.receiveRconRevCmd = function (d) {
    if (arena.debug) {
        console.log("[cl] Server command:", d[1]);
    }
    rconHandler.command(d[1]);
};

exports.sendRconStatus = function () {
    sendRaw([200]);
};

exports.sendRconCommand = function (cmd, args) {
    sendRaw([202, cmd, args]);
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
