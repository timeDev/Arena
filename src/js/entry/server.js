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