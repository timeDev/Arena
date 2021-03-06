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

var cmdEngine = require('../console/engine');

exports.update = function (dt, data) {
    if (data.gameState.started) {
        data.scene.simulate(dt, 2);
    }
};

exports.render = function () {
};
exports.init = function () {
    cmdEngine.registerCvar('move_mass', exports.player, 'mass', ['cheat', 'repl']);
    cmdEngine.registerCvar('pcol_radius', exports.player, 'radius', ['cheat', 'repl']);
    cmdEngine.registerCvar('move_speed', exports.player, 'speed', ['cheat', 'repl']);
    cmdEngine.registerCvar('move_acc', exports.player, 'acc', ['cheat', 'repl']);
    cmdEngine.registerCvar('move_jvel', exports.player, 'jumpVel-', ['cheat', 'repl']);
    cmdEngine.registerCvar('move_jdur', exports.player, 'jumpDur', ['cheat', 'repl']);
    cmdEngine.registerCvar('pcol_height', exports.player, 'height', ['cheat', 'repl']);
};
exports.initDom = function () {
};

exports.player = {
    mass: 80,
    radius: 0.6,
    speed: 6.0,
    acc: 3.0,
    jumpVel: 90,
    jumpDur: 0.08,
    height: 1.8
};
