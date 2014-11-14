define(['console'], function (console) {
    'use strict';
    var values, module, keys,
        // Function
        reg;
    reg = function (name, primary, secondary) {
        console.registerCvar(name, function (val) {
            if (val !== undefined) {
                values[primary][secondary] = val;
            }
            return values[primary][secondary];
        });
    };

    keys = {
        mouse: {
            sensitivityX: 'cl_mouse_snx',
            sensitivityY: 'cl_mouse_sny'
        },
        gameplay: {
        },
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

    module = values = {
        mouse: {
            sensitivityX: 2.0 / 1000,
            sensitivityY: 2.0 / 1000
        },
        gameplay: {
        },
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
        }
    };

    module.init = function () {
        for (var kp in keys) {
            if (keys.hasOwnProperty(kp)) {
                for (var ks in keys[kp]) {
                    if (typeof keys[kp][ks] === 'string') {
                        reg(keys[kp][ks], kp, ks);
                    }
                }
            }
        }
    };

    module.loadCfg = function () {
        var cfg = window.localStorage.getItem('arena_settings');
        console.execute(cfg);
    };

    module.writeCfg = function () {
        window.localStorage.setItem('arena_settings', console.getCfgString());
    };

    return values;
});