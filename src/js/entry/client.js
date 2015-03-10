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

var Clock = require('../util/clock'),
    settings = require('../common/settings'),
    controls = require('../client/controls'),
    simulator = require('../phys/simulator'),
    cmdEngine = require('../console/engine'),
    cmdBuiltins = require('../console/builtins'),
    arena = require('../common/arena'),
    client = require('../client/client'),
    console = require('../dom/console'),
    overlay = require('../client/overlay-mgr');

require('../client/rcon');

console.log("Playing Arena version", arena.version);
if (arena.debug) {
    console.warn("Debug mode is enabled");
    window.debugging = true;
}

function update(time) {
    if (client.gameState.started) {
        controls.update(time);
        simulator.update(time);
    }
}

settings.api.init();
settings.api.loadCfg();

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
}

// Add command shorthand
console.executeFn = window.c = function (str) {
    return cmdEngine.executeString(str, window.console);
};

// Entry point
function entrypoint() {
    var display = require('../client/display');

    overlay.add('sv-startup', 'The server has not yet startet the game.<p>Please wait.');
    overlay.show('sv-startup');

    controls.firstPersonCam(display.camera);
    controls.mesh.position.set(0, 2, 0);
    simulator.add(controls.mesh, 0);

    display.render();

    Clock.startNew(16, update);
}

if (document.readyState === 'interactive') {
    entrypoint();
} else {
    document.addEventListener('DOMContentLoaded', entrypoint);
}