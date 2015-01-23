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
    commands = require('../common/commands'),
    Connection = require('../common/connection'),
    protocol = require('../server/protocol'),
    simulator = require('../common/simulator'),
    Clock = require('../common/clock'),
    Player = require('../server/player'),
    arena = require('../common/arena'),
    level = require('../server/level'),
// Local
    conListener;

level.newIdFn = server.newId;

commands.register(level.commands);

function update(time) {
    simulator.update(time);
}

function connect(c) {
    var player = new Player(c);
    if (arena.debug) {
        console.w.log('player connected:', player);
    }
    server.players.push(player);
    c.message.add(protocol.receive.bind(null, player));
    simulator.add(player.body, player.entityId);
}

conListener = Connection.listen(connect);
conListener.on('open', function (id) {
    console.w.log("Server connection id:", id);
});
Clock.startNew(16, update);

// Add command shorthand
console.executeFn = window.c = function (str) {
    return commands.execute(str, 'sv');
};

function initDom() {
    document.body.appendChild(console.domElement);
}

if (document.readyState === 'interactive') {
    initDom();
} else {
    document.addEventListener('DOMContentLoaded', initDom);
}
},{"../common/arena":14,"../common/clock":15,"../common/commands":16,"../common/connection":17,"../common/simulator":22,"../dom/console":23,"../server/level":25,"../server/player":26,"../server/protocol":27,"../server/server":28}],26:[function(require,module,exports){
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
    CANNON = require('../vendor/cannon'),
    settings = require('../common/settings'),
    simulator = require('../common/simulator');

function Player(connection) {
    this.connection = connection;
    this.name = "Bob";
    this.data = {};
    this.entityId = 1;

    this.body = new CANNON.Body({mass: settings.player.mass});
    this.body.addShape(new CANNON.Sphere(settings.player.radius));
}

Player.prototype.updateBody = function (state) {
    simulator.updateBody(this.entityId, state);
};

module.exports = Player;
},{"../common/settings":21,"../common/simulator":22,"../vendor/cannon":31}],25:[function(require,module,exports){
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
    commands = require('../common/commands'),
    ocl = require('../common/ocl'),
    Sexhr = require('../vendor/SeXHR'),
    protocol = require('./protocol'),
    simulator = require('../common/simulator'),
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
    if (obj.body) {
        obj.body.position.copy(obj.pos);
        simulator.add(obj.body, id);
        ids.push(id);
    }
};

exports.spawnString = function (str) {
    var id = exports.newIdFn();
    protocol.broadcast(protocol.spawnObject(str, id));
    ocl.load(str, function (obj) {
        exports.spawnObj(obj, id);
    });
};

exports.clear = function () {
    ids.forEach(simulator.remove);
    ids = [];
};

exports.load = function (str) {
    // Only parse the top level array and take the rest as strings
    var objList = JSON.parse(str);
    objList = objList.map(JSON.stringify);
    objList.forEach(exports.spawnString);
    console.log("Level loaded");
};

exports.commands = {};

exports.commands.lv_clear = {
    isCvar: false,
    name: 'lv_clear',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate([], args);
        exports.clear();
    }
};

exports.commands.lv_load = {
    isCvar: false,
    name: 'lv_load',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        new Sexhr().req({
            url: args[1],
            done: function (err, res) {
                if (err) {
                    throw err;
                }
                exports.load(res.text);
            }
        });
    }
};

exports.commands.lv_spawn = {
    isCvar: false,
    name: 'lv_spawn',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        try {
            ocl.load(args[1], exports.spawn);
        } catch (e) {
            console.error("Error parsing JSON!");
        }
    }
};

},{"../common/commands":16,"../common/level":18,"../common/ocl":19,"../common/simulator":22,"../vendor/SeXHR":29,"./protocol":27}],27:[function(require,module,exports){
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
// Local
    players = server.players,
    receivers = [];

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
        console.log(p, d);
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

},{"../common/arena":14,"./server":28}],28:[function(require,module,exports){
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
    commands = require('../common/commands'),
    arena = require('../common/arena'),
// Local
    players = [],
    idCounter = 1;

exports.players = players;

exports.newId = function () {
    return idCounter++;
};

exports.getServerStatusMsg = function () {
    return String.format("Running version {0} | {1} player(s)", arena.version, players.length);
};

exports.executeCommand = function (cmd, args) {
    commands.execute(args.join(" "), 'sv');
};

exports.matchesRconPassword = function (pwd) {
    // TODO: Make password configurable
    return pwd === "banana";
};

exports.getCvarList = function (/*admin*/) {
    var cvars = commands.getCvars();
    var list = [];
    for (var k in cvars) {
        if (cvars.hasOwnProperty(k)) {
            list.push(cvars[k]);
        }
    }
    list = list.map(function (c) {
        return [c.name, typeof c.value === 'function' ? c.value.call() : c.value];
    });
    return list;
};

exports.getCvar = function (name) {
    return commands.getCvar(name, 'sv');
};

exports.execute = function (cmd) {
    return commands.execute(cmd, 'sv');
};

},{"../common/arena":14,"../common/commands":16}]},{},[2]);
