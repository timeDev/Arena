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
// Local
    conListener;

level.newIdFn = server.newId;

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
}

var bodyI = 0;

function update(time) {
    simulator.update(time);
    // Pick Object to broadcast
    var playerBodies = server.players.map(function (p) {
        return p.body;
    });
    var bodies = simulator.world.bodies.filter(function (b) {
        // Filter out players
        return playerBodies.indexOf(b) < 0;
    });
    if (bodies.length > 0) {
        if (bodyI >= bodies.length) {
            bodyI = 0;
        }
        var body = bodies[bodyI++];
        var id = simulator.getId(body);
        server.broadcast(server.updateEntity(id, simulator.makeUpdatePacket(id)));
    }
}

function connect(c) {
    var newPlayer = new Player(c);
    if (arena.debug) {
        console.w.log('client connected:', newPlayer);
    }
    c.message.add(server.receive.bind(null, newPlayer));
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
                server.sendRconMessage(p, msg);
            }
        });
        console.log(arguments);
        console.w.log(arguments);
    },
    error: function () {
        var msg = "[error] " + Array.prototype.join.call(arguments, " ");
        server.players.forEach(function (p) {
            if (p.data.rconAuthorized) {
                server.sendRconMessage(p, msg);
            }
        });
        console.error(arguments);
        console.w.error(arguments);
    }
    ,
    warn: function () {
        var msg = "[warning] " + Array.prototype.join.call(arguments, " ");
        server.players.forEach(function (p) {
            if (p.data.rconAuthorized) {
                server.sendRconMessage(p, msg);
            }
        });
        console.warn(arguments);
        console.w.warn(arguments);
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