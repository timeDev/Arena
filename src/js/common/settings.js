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
    cmdEngine = require('../console/engine'),
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
        radius: 'sv_player_radius',
        speed: 'sv_player_speed',
        maxAcc: 'sv_player_maxAcc',
        jumpVel: 'sv_player_jumpVel'
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
        radius: 1.3,
        speed: 5.0,
        maxAcc: 10.0,
        jumpVel: 12.0
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
            var cfg = window.localStorage.getItem('arena_settings');
            commands.execute(cfg);
        },
        writeCfg: function () {
            window.localStorage.setItem('arena_settings', commands.getCfgString());
        }
    }
};
