﻿/*
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
    cmdEngine = require('../console/engine'),
    command = require('../console/command'),
// Local
    keys;

keys = {
    mouse: {
        sensitivityX: 'cl_mouse_snx',
        sensitivityY: 'cl_mouse_sny'
    },
    gameplay: {},
    player: {
        mass: 'sv_player_mass',
        radius: 'sv_player_col_radius',
        speed: 'sv_player_speed',
        acc: 'sv_player_acc',
        jumpVel: 'sv_player_jumpVel',
        jumpDur: 'sv_player_jumpDur',
        height: 'sv_player_col_height'
    },
    graphics: {
        fov: 'cl_vfov'
    },
    debug: {
        showGrid: 'db_grid'
    }
};

module.exports = {
    mouse: {
        sensitivityX: 2.0 / 1000,
        sensitivityY: 2.0 / 1000
    },
    gameplay: {},
    player: {
        mass: 80,
        radius: 0.6,
        speed: 6.0,
        acc: 3.0,
        jumpVel: 1.6,
        jumpDur: 0.08,
        height: 1.8
    },
    graphics: {
        fov: 75.0
    },
    debug: {
        showGrid: true
    },
    api: {
        init: function () {
            for (var kp in keys) {
                if (keys.hasOwnProperty(kp)) {
                    for (var ks in keys[kp]) {
                        if (keys[kp].hasOwnProperty(ks) && typeof keys[kp][ks] === 'string') {
                            cmdEngine.registerCvar(keys[kp][ks], module.exports[kp], ks);
                        }
                    }
                }
            }
        },
        loadCfg: function () {
            var cfg = window.localStorage.getItem('config');
            if (cfg == null) {
                window.localStorage.setItem('config', cfg = ";");
            }
            cmdEngine.executeString(cfg, window.console);
        }
    }
};

command("cfg_write [file]", {optional: [{name: 'file', type: 'string'}]}, 'cfg_write', function (match) {
    window.localStorage.setItem(match.file ? match.file : 'config', cmdEngine.getCfgString());
});
