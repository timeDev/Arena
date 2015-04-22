require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({2:[function(require,module,exports){
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
// Polyfill and globals
if (Math.clamp === undefined) {
    Math.clamp = function (n, min, max) {
        return Math.min(Math.max(n, min), max);
    };
}

if (Math.HALF_PI === undefined) {
    Math.HALF_PI = Math.PI / 2;
}

// Thanks to Stackoverflow user fearphage
if (!String.format) {
    String.format = function (format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/\{(\d+)}/g, function (match, number) {
            return args[number] !== undefined ? args[number] : match;
        });
    };
}

var
// Module
    server = require('../server/server'),
    console = require('../dom/console'),
    cmdEngine = require('../console/engine'),
    cmdBuiltins = require('../console/builtins'),
    Connection = require('../net/connection'),
    protocol = require('../net/server'),
    simulator = require('../phys/simulator'),
    Clock = require('../util/clock'),
    Player = require('../server/player'),
    arena = require('../common/arena'),
    level = require('../server/level'),
    settings = require('../common/settings'),
// Local
    conListener;

level.newIdFn = server.newId;

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
}

var meshI = 0;

function update(time) {
    simulator.update(time);
    server.gameState.time += time;
    // Pick Object to broadcast
    var playerMeshes = server.players.map(function (p) {
        return p.entityId;
    });
    var meshIds = simulator.scene.children.map(simulator.getId).filter(function (m) {
        return m > 0 && playerMeshes.indexOf(m) < 0;
    });
    if (meshIds.length > 0) {
        if (meshI >= meshIds.length) {
            meshI = 0;
        }
        var id = meshIds[meshI++];
        protocol.broadcast(protocol.updateEntity(id, simulator.makeUpdatePacket(id)));
    }
}

function connect(c) {
    var newPlayer = new Player(c);
    if (arena.debug) {
        console.w.log('client connected:', newPlayer);
    }
    c.message.add(protocol.receive.bind(null, newPlayer));
}

conListener = Connection.listen(connect);
conListener.on('open', function (id) {
    console.writeLine("Server open. Enter the following to connect:");
    console.writeLine("connect \"" + id + "\"", 'greenyellow');
    console.w.log("Server connection id:", id);
});
Clock.startNew(16, update);

var cmdEnv = {
    log: function () {
        var msg = Array.prototype.join.call(arguments, " ");
        server.players.forEach(function (p) {
            if (p.data.rconAuthorized) {
                protocol.sendRconMessage(p, msg);
            }
        });
        console.log.apply(console, arguments);
        console.w.log.apply(console.w, arguments);
    },
    error: function () {
        var msg = "[error] " + Array.prototype.join.call(arguments, " ");
        server.players.forEach(function (p) {
            if (p.data.rconAuthorized) {
                protocol.sendRconMessage(p, msg);
            }
        });
        console.error.apply(console, arguments);
        console.w.error.apply(console.w, arguments);
    }
    ,
    warn: function () {
        var msg = "[warning] " + Array.prototype.join.call(arguments, " ");
        server.players.forEach(function (p) {
            if (p.data.rconAuthorized) {
                protocol.sendRconMessage(p, msg);
            }
        });
        console.warn.apply(console, arguments);
        console.w.warn.apply(console.w, arguments);
    }
};

// Add command shorthand
console.executeFn = window.c = server.executeCommand = function (str) {
    return cmdEngine.executeString(str, cmdEnv);
};

settings.api.init();
settings.api.loadCfg();

function initDom() {
    document.body.appendChild(console.domElement);
}

if (document.readyState === 'interactive') {
    initDom();
} else {
    document.addEventListener('DOMContentLoaded', initDom);
}
},{"../common/arena":14,"../common/settings":17,"../console/builtins":18,"../console/engine":20,"../dom/console":25,"../net/connection":29,"../net/server":30,"../phys/simulator":31,"../server/level":32,"../server/player":33,"../server/server":34,"../util/clock":35}],33:[function(require,module,exports){
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
    settings = require('../common/settings'),
    THREE = require('../vendor/three'),
    PHYSI = require('../vendor/physi'),
    server = require('./server');

function Player(connection) {
    this.connection = connection;
    this.name = "unnamed";
    this.data = {};
    this.entityId = server.newId();
    this.playerId = Player.newId();

    this.mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(settings.player.radius, settings.player.radius,settings.player.height),
        PHYSI.createMaterial(new THREE.MeshBasicMaterial({visible: false}), 0.1, 0.0), settings.player.mass);
}

Player.prototype.updateBody = function (state) {
    if (state.v) {
        var v = new THREE.Vector3(state.v[0], state.v[1], state.v[2]);
        if (v.length > settings.player.speed) {
            v.setLength(settings.player.speed);
        }
        this.mesh.setLinearVelocity(v);
    }
    if (state.p) {
        var p = new THREE.Vector3(state.p[0], state.p[1], state.p[2]);
        var len = p.distanceTo(this.mesh.position);
        // Use 1.3 tolerance
        if (len > settings.player.speed * 1.3) {
            p.sub(this.mesh.position);
            p.setLength(settings.player.speed);
            p.add(this.mesh.position);
        }
        this.mesh.position.copy(p);
        this.mesh.__dirtyPosition = true;
    }
};

Player.prototype.teleport = function (x, y, z) {
    this.mesh.position.set(x, y, z);
    this.mesh.__dirtyPosition = true;
};

Player.newId = function () {
    var id = 0;
    return function () {
        return id++;
    };
}();

module.exports = Player;
},{"../common/settings":17,"../vendor/physi":44,"../vendor/three":46,"./server":34}],32:[function(require,module,exports){
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
require('../common/level');
var
// Module
    command = require('../console/command'),
    ocl = require('../util/ocl'),
    Sexhr = require('../vendor/SeXHR'),
    protocol = require('./../net/server'),
    simulator = require('../phys/simulator'),
    server = require('./server'),
// Local
    ids = [];


exports.newIdFn = function () {
    return -1;
};

exports.spawnObj = function (obj, id) {
    if (!obj.pos) {
        console.warn("Skipping map object without position.");
        return;
    }
    if (obj.mesh) {
        obj.mesh.position.copy(obj.pos);
        obj.mesh.__dirtyPosition = true;
        simulator.add(obj.mesh, id);
        ids.push(id);
    }
};

exports.spawnString = function (str) {
    var id = exports.newIdFn();
    protocol.broadcast(protocol.spawnObject(id, str));
    server.mapState.push({id: id, str: str});
    ocl.load(str, function (obj) {
        exports.spawnObj(obj, id);
    });
};

exports.clear = function () {
    ids.forEach(function (id) {
        protocol.broadcast(protocol.killEntity(id));
    });
    ids.forEach(simulator.remove);
    ids = [];
    while (server.mapState.length > 0) {
        server.mapState.pop();
    }
};

exports.load = function (str) {
    // Only parse the top level array and take the rest as strings
    var objList = JSON.parse(str);
    objList = objList.map(JSON.stringify);
    objList.forEach(exports.spawnString);
    console.log("Level loaded");
};

command("lv_clear", {}, 'lv_clear', function (match) {
    exports.clear();
});

command("lv_load <path>", {
    mandatory: [{name: 'path', type: 'string'}]
}, 'lv_load', function (match) {
    new Sexhr().req({
        url: match.path,
        done: function (err, res) {
            if (err) {
                throw err;
            }
            exports.load(res.text);
        }
    });
});

command("lv_spawn <obj>", {mandatory: [{name: 'obj', type: 'string'}]}, 'lv_spawn', function (match) {
    try {
        exports.spawnString(match.obj);
    } catch (e) {
        console.error("Error parsing JSON!");
    }
});

command("map <mapname>", {mandatory: [{name: 'mapname', type: 'string'}]}, 'map', function (match) {
    exports.clear();
    new Sexhr().req({
        url: "maps/" + match.mapname + ".json",
        done: function (err, res) {
            if (err) {
                throw err;
            }
            exports.load(res.text);
        }
    });
});

},{"../common/level":15,"../console/command":19,"../phys/simulator":31,"../util/ocl":39,"../vendor/SeXHR":40,"./../net/server":30,"./server":34}],30:[function(require,module,exports){
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
    simulator = require('../phys/simulator'),
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
    exports.sendSpawnMany(p, server.mapState);
    for (var i = 0; i < server.players.length; i++) {
        var player = server.players[i];
        exports.sendPlayerData(player, p.playerId, 2, {
            id: p.entityId,
            pos: p.mesh.position.toArray()
        });
        exports.sendPlayerData(p, player.playerId, 2, {
            id: player.entityId,
            pos: player.mesh.position.toArray()
        });
    }
    exports.sendGameState(p, server.gameState);
    server.players.push(p);
    simulator.add(p.mesh, p.entityId);
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

// RCON protocol
// rcon status 200 - C>S | msg S>C
// rcon error 201 msg S>C
// rcon command 202 str C>S
// rcon query 203 cvarname C>S
// rcon cvar 204 cvarname value S>C
// rcon reversecmd (sent by server, must not be questioned) 205 cmd S>C
// rcon authorize 206 password C>S
// rcon queryall 207 C>S
// rcon consolemessage 208 msg S>C
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
    server.executeCommand(d[1]);
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

exports.sendRconMessage = function (p, msg) {
    send(p, [208, msg]);
};

},{"../common/arena":14,"../phys/simulator":31,"./../server/server":34}],34:[function(require,module,exports){
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
    cmdEngine = require('../console/engine'),
    arena = require('../common/arena'),
    command = require('../console/command'),
// Local
    players = [],
    idCounter = 1;

exports.players = players;

exports.newId = function () {
    return idCounter++;
};

exports.mapState = [];

exports.gameState = {
    started: true,
    time: 0.0
};

exports.getServerStatusMsg = function () {
    return String.format("Running version {0} | {1} player(s) | Running for {2}s", arena.version, players.length, exports.gameState.time);
};

exports.executeCommand = null;

exports.matchesRconPassword = function (pwd) {
    // TODO: Make password configurable
    return pwd === "banana";
};

exports.getCvarList = function (/*admin*/) {
    var reg = cmdEngine.getRegistry();
    var list = [];
    for (var k in reg) {
        if (reg.hasOwnProperty(k) && reg[k].type === 'cvar') {
            list.push([k, reg[k].getter()]);
        }
    }
    return list;
};

exports.getCvar = function (name) {
    return commands.getCvar(name, 'sv');
};

exports.execute = function (cmd) {
    return commands.execute(cmd, 'sv');
};

command("tpa <x> <y> <z>", {
    mandatory: [{name: 'x', type: 'number'}, {name: 'y', type: 'number'}, {name: 'z', type: 'number'}]
}, 'tpa', function (match) {
    players.forEach(function (p) {
        p.teleport(match.x, match.y, match.z);
    });
});

},{"../common/arena":14,"../console/command":19,"../console/engine":20}]},{},[2]);
