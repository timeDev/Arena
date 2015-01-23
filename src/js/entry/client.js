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

var Clock = require('../common/clock'),
    settings = require('../common/settings'),
    controls = require('../client/controls'),
    simulator = require('../common/simulator'),
    commands = require('../common/commands'),
    level = require('../client/level'),
// Load rcon after level to avoid issues with cyclic deps
    rcon = require('../client/rcon'),
    scenemgr = require('../client/scene-manager'),
    arena = require('../common/arena'),
    client = require('../client/client'),
    console = require('../dom/console');

console.log("Playing Arena version {0}", arena.version);
if (arena.debug) {
    console.warn("Debug mode is enabled");
    window.debugging = true;
}

function update(time) {
    controls.update(time);
    simulator.update(time);
    scenemgr.copyWorldToScene();
}

settings.api.init();

// Add command shorthand
console.executeFn = window.c = function (str) {
    return commands.execute(str, 'cl');
};

commands.register(level.commands);
commands.register(controls.commands);
commands.register(rcon.commands);
commands.register(client.commands);

// Entry point
function entrypoint() {
    var display = require('../client/display');

    scenemgr.init(display.scene);

    controls.firstPersonCam(display.camera);
    controls.sceneObj.position.set(0, 2, 0);
    controls.physBody.position.set(0, 2, 0);
    controls.physBody.linearDamping = 0.95;
    display.scene.add(controls.sceneObj);
    simulator.add(controls.physBody, 0);

    commands.register(display.commands);

    display.render();

    Clock.startNew(16, update);
}

if (document.readyState === 'interactive') {
    entrypoint();
} else {
    document.addEventListener('DOMContentLoaded', entrypoint);
}