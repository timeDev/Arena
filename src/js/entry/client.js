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


var arena = require('../common/arena'),
    settings = require('../common/settings'),
    console = require('../dom/console'),
    PHYSI = require('../vendor/physi'),
    THREE = require('../vendor/three'),
    cmdEngine = require('../console/engine'),
    cmdBuiltins = require('../console/builtins'),
    overlay = require('../client/overlay-mgr');


console.log("Playing Arena version", arena.version);
if (arena.debug) {
    console.warn("Debug mode is enabled");
    window.debugging = true;
}

settings.api.init();
settings.api.loadCfg();

var game = window.game = require('../game');

// Add common data
game.data.clientside = true;
game.data.scene = new PHYSI.Scene();
game.data.bodies = []; // ID-Body lookup
game.data.entities = []; // EntityId-BodyId lookup

game.data.server = {};
game.data.players = [];
game.data.gameState = {};
game.data.packets = [];

game.data.cameratype = "first person";
game.data.camera = new THREE.PerspectiveCamera(settings.graphics.fov, window.innerWidth / (window.innerHeight), 0.1, 1000);

// Add components
game.addComponent(require('../net/client'));
game.addComponent(require('../client/display'));
game.addComponent(require('../client/controls'));
game.addComponent(require('../phys/simulator'));
game.addComponent(require('../client/client'));
game.addComponent(require('../client/chat'));
game.addComponent(require('../client/level'));

require('../phys/scenehelper').init(game.data);
game.init();

require('../client/rcon');

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
}

// Add command shorthand
console.executeFn = window.c = function (str) {
    return cmdEngine.executeString(str, require('../dom/console'));
};

// Entry point
function entrypoint() {
    game.initDom();

    overlay.add('sv-startup', 'The server has not yet startet the game.<p>Please wait.');
    overlay.show('sv-startup');

    game.run();
}

if (document.readyState === 'interactive') {
    entrypoint();
} else {
    document.addEventListener('DOMContentLoaded', entrypoint);
}
