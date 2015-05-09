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
    Player = require('../server/player'),
    arena = require('../common/arena'),
    level = require('../server/level'),
    PHYSI = require('../vendor/physi'),
    config = require('../common/config'),
// Local
    conListener;

console.log("Playing Arena version", arena.version);
if (arena.debug) {
    console.warn("Debug mode is enabled");
    window.debugging = true;
}

var game = window.game = require('../game');

config.loadCfg();

// Add common data
game.data.serverside = true;
game.data.scene = new PHYSI.Scene();
game.data.players = [];
game.data.bodies = []; // ID-Body lookup
game.data.entities = []; // EntityId-BodyId lookup
game.data.gameState = {
    started: true,
    time: 0.0
};
game.data.mapState = [];
game.data.packets = [];

// Add components
game.addComponent(game.data.protocol = require('../net/server'));
game.addComponent(require('../phys/simulator'));
game.addComponent(server);

require('../phys/scenehelper').init(game.data);
require('../common/rcon').init(game.data);
require('../common/cheat').init(game.data);
require('../common/replicated').init(game.data);
level.init(game.data);

game.init();

level.newIdFn = server.newId;

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
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

game.run();

var cmdEnv = {
    log: function () {
        var msg = Array.prototype.join.call(arguments, " ");
        protocol.broadcastLevel(1, protocol.makePacket('rconStatus', 'msg', msg));
        console.log.apply(console, arguments);
        console.w.log.apply(console.w, arguments);
    },
    error: function () {
        var msg = "[error] " + Array.prototype.join.call(arguments, " ");
        protocol.broadcastLevel(1, protocol.makePacket('rconStatus', 'error', msg));
        console.error.apply(console, arguments);
        console.w.error.apply(console.w, arguments);
    }
    ,
    warn: function () {
        var msg = "[warning] " + Array.prototype.join.call(arguments, " ");
        protocol.broadcastLevel(1, protocol.makePacket('rconStatus', 'error', msg));
        console.warn.apply(console, arguments);
        console.w.warn.apply(console.w, arguments);
    }
};

// Add command shorthand
console.executeFn = window.c = server.executeCommand = function (str) {
    return cmdEngine.executeString(str, cmdEnv);
};

function initDom() {
    document.body.appendChild(console.domElement);
}

if (document.readyState === 'interactive') {
    initDom();
} else {
    document.addEventListener('DOMContentLoaded', initDom);
}
},{"../common/arena":16,"../common/cheat":17,"../common/config":18,"../common/rcon":21,"../common/replicated":22,"../console/builtins":23,"../console/engine":25,"../dom/console":29,"../game":32,"../net/connection":34,"../net/server":37,"../phys/scenehelper":38,"../phys/simulator":39,"../server/level":40,"../server/player":41,"../server/server":42,"../vendor/physi":54}],41:[function(require,module,exports){
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
    simulator = require('../phys/simulator'),
    THREE = require('../vendor/three'),
    PHYSI = require('../vendor/physi'),
    server = require('./server');

function Player(connection) {
    this.connection = connection;
    this.name = "unnamed";
    this.data = {};
    this.privilege = 0;
    this.entityId = server.newId();
    this.playerId = Player.newId();

    this.mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(simulator.player.radius, simulator.player.radius, simulator.player.height),
        PHYSI.createMaterial(new THREE.MeshBasicMaterial({visible: false}), 0.1, 0.0), simulator.player.mass);
}

Player.prototype.updateBody = function (state) {
    if (state.v) {
        var v = new THREE.Vector3(state.v[0], state.v[1], state.v[2]);
        if (v.length > simulator.player.speed) {
            v.setLength(simulator.player.speed);
        }
        this.mesh.setLinearVelocity(v);
    }
    if (state.p) {
        var p = new THREE.Vector3(state.p[0], state.p[1], state.p[2]);
        var len = p.distanceTo(this.mesh.position);
        // Use 1.3 tolerance
        if (len > simulator.player.speed * 1.3) {
            p.sub(this.mesh.position);
            p.setLength(simulator.player.speed);
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
},{"../phys/simulator":39,"../vendor/physi":54,"../vendor/three":56,"./server":42}],40:[function(require,module,exports){
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
    scenehelper = require('../phys/scenehelper'),
    server = require('./server'),
// Local
    ids = [], data;

exports.init = function (gamedata) {
    data = gamedata;
};

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
        scenehelper.add(obj.mesh, id);
        ids.push(id);
    }
};

exports.spawnString = function (str) {
    var id = exports.newIdFn();
    protocol.broadcast(protocol.makePacket('spawnObj', id, str));
    data.mapState.push({id: id, str: str});
    ocl.load(str, function (obj) {
        exports.spawnObj(obj, id);
    });
};

exports.clear = function () {
    ids.forEach(function (id) {
        protocol.broadcast(protocol.makePacket('killEnt', id));
    });
    ids.forEach(scenehelper.remove);
    ids = [];
    while (data.mapState.length > 0) {
        data.mapState.pop();
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

},{"../common/level":19,"../console/command":24,"../phys/scenehelper":38,"../util/ocl":48,"../vendor/SeXHR":50,"./../net/server":37,"./server":42}],37:[function(require,module,exports){
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

},{"../common/arena":16,"./../server/server":42,"./protocol":36}],42:[function(require,module,exports){
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
    _ = require('lodash'),
    cmdEngine = require('../console/engine'),
    arena = require('../common/arena'),
    command = require('../console/command'),
    scenehelper = require('../phys/scenehelper'),
    protocol = require('../net/server'),
    rcon = require('../common/rcon'),
// Local
    idCounter = 1,
    meshI = 0,
    gamedata;

exports.init = function (data) {
    gamedata = data;
};
exports.update = function (dt, data) {
    data.gameState.time += dt;
    // Pick Object to broadcast
    var playerMeshes = _.pluck(data.players, 'entityId');
    var meshIds = _(game.data.scene.children).map(scenehelper.getId).filter(function (m) {
        return m > 0 && playerMeshes.indexOf(m) < 0;
    });
    if (meshIds.length > 0) {
        if (meshI >= meshIds.length) {
            meshI = 0;
        }
        var id = meshIds[meshI++];
        protocol.broadcast(protocol.makePacket('updateEnt', id, scenehelper.makeUpdatePacket(id)));
    }

    _(data.packets).where({type: 'playerDataS'}).forEach(function (pck) {
        var player = pck.player;
        player.updateBody(pck.data);
        protocol.broadcast(protocol.makePacket('playerDataC', player.playerId, 1, {
            p: player.mesh.position.toArray(),
            v: player.mesh.getLinearVelocity().toArray(),
            pnr: pck.pknr
        }));
    });

    _(data.packets).where({type: 'logon'}).forEach(function (pck) {
        var player = pck.player;
        player.name = pck.name;
        protocol.send(player, protocol.makePacket('playerDataC', player.playerId, 0, {}));
        protocol.send(player, protocol.makePacket('spawnMany', data.mapState));
        for (var j = 0; j < data.players.length; j++) {
            var player2 = data.players[j];
            protocol.send(player2, protocol.makePacket('playerDataC', player.playerId, 2, {
                id: player.entityId,
                pos: player.mesh.position.toArray()
            }));
            protocol.send(player, protocol.makePacket('playerDataC', player2.playerId, 2, {
                id: player2.entityId,
                pos: player2.mesh.position.toArray()
            }));
        }
        protocol.send(player, protocol.makePacket('gameState', data.gameState));
        data.players.push(player);
        scenehelper.add(player.mesh, player.entityId);
    });

    _(data.packets).where({type: 'chatMsg'}).forEach(function (pck) {
        var player = pck.player;
        var origMsg = pck.msg;
        var playerName = player.name;
        var msg = playerName + ": " + origMsg + "<br>";
        // TODO: filter event exploits
        protocol.broadcast(exports.makePacket('chatMsg', msg));
    });

    _(data.packets).where({type: 'rconRequest'}).forEach(function (pck) {
        var player = pck.player;
        if (pck.action == 'auth') {
            rcon.authorize(pck.arg, player);
        } else if (pck.action == 'cmd') {
            if (player.privilege > 0) {
                exports.executeCommand(pck.arg);
            } else {
                protocol.send(player, protocol.makePacket('rconStatus', 'error', "Not authorized"));
            }
        } else if (pck.action == 'changeCvar') {
            if (player.privilege > 0) {
                cmdEngine.setCvar(pck.arg[0], pck.arg[1]);
            } else {
                protocol.send(player, protocol.makePacket('rconStatus', 'error', "Not authorized"));
            }
        }
    });
};

exports.newId = function () {
    return idCounter++;
};

exports.getServerStatusMsg = function () {
    return String.format("Running version {0} | {1} player(s) | Running for {2}s", arena.version, gamedata.players.length, gamedata.gameState.time);
};

exports.executeCommand = null;

exports.matchesRconPassword = function (pwd) {
    // TODO: Make password configurable
    return pwd === "banana";
};

exports.getCvarList = function (/*admin*/) {
    var reg = cmdEngine.getRegistry();
    var list = [];
    _.forOwn(reg, function (value, key) {
        if (value.type == 'cvar') {
            list.push([key, value.getter()]);
        }
    });
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
    gamedata.players.forEach(function (p) {
        p.teleport(match.x, match.y, match.z);
    });
});

command("status", {}, 'status', function () {
    this.log(exports.getServerStatusMsg());
});

},{"../common/arena":16,"../common/rcon":21,"../console/command":24,"../console/engine":25,"../net/server":37,"../phys/scenehelper":38,"lodash":6}]},{},[2]);
