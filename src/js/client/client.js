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
var
// Module
    command = require('../console/command'),
    Connection = require('../net/connection'),
    protocol = require('./../net/client'),
    PHYSI = require('../vendor/physi'),
    simulator = require('../phys/simulator'),
    settings = require('../common/settings'),
    THREE = require('../vendor/three'),
    overlay = require('./overlay-mgr');

exports.playerName = "Bob";

exports.connection = null;

exports.connect = function (address) {
    exports.connection = new Connection();
    exports.connection.message.add(protocol.receive);
    exports.connection.connect(address);
    protocol.sendLogon(exports.playerName);
};

// Maps player ids to entity ids
exports.players = [];

exports.spawnPlayer = function (pid, data) {
    var eid = data.id;
    exports.players[pid] = eid;
    var pos = data.pos;
    pos = {x: pos[0], y: pos[1], z: pos[2]};
    var mesh = new PHYSI.SphereMesh(new THREE.SphereGeometry(settings.player.radius), new THREE.MeshBasicMaterial({color: 0xc80000}), settings.player.mass);
    mesh.position.copy(pos);
    mesh.addEventListener('ready', function () {
        mesh.setAngularFactor(new THREE.Vector3(0, 0, 0));
    });
    simulator.add(mesh, eid);
};

exports.gameState = {};

exports.updateGameState = function (state) {
    if (state.started === true && overlay.active == 'sv-startup') {
        overlay.show('pause');
    }
    if (state.started === false && overlay.active != 'sv-startup') {
        overlay.show('sv-startup');
    }

    for (var k in state) {
        if (state.hasOwnProperty(k)) {
            exports.gameState[k] = state[k];
        }
    }
};

command("connect <address>",
    {mandatory: [{name: 'address', type: 'string'}]},
    'connect',
    function (match) {
        exports.connect(match.address);
    });

command.engine.registerCvar('name', exports, 'playerName');
