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
    scenehelper = require('../phys/scenehelper'),
    simulator = require('../phys/simulator'),
    THREE = require('../vendor/three'),
    overlay = require('./overlay-mgr'),
    rcon = require('../common/rcon'),
    console = require('../dom/console'),
// Local
    data;

exports.playerName = "Bob";

exports.render = function () {
};
exports.initDom = function () {
};

exports.init = function (gamedata) {
    data = gamedata;
};

exports.update = function (dt, data) {
    for (var i = 0; i < data.packets.length; i++) {
        var pck = data.packets[i];
        if (pck.type === 'gameState') {
            exports.updateGameState(pck.state);
        } else if (pck.type === 'playerDataC' && pck.action === 2) {
            exports.spawnPlayer(pck.pid, pck.data);
        } else if (pck.type == 'rconStatus') {
            if (pck.action == 'auth') {
                data.rconAuth = !!data.arg;
            } else if (pck.action == 'changeCvar') {
                command.engine.setCvarNocheck(pck.arg[0], pck.arg[1]);
            } else if (pck.action == 'error') {
                console.warn(pck.arg);
            } else if (pck.action == 'cmd') {
                try {
                    command.engine.executeString(pck.arg, console);
                } catch (e) {
                    console.error(e);
                }
            } else if (pck.action == 'msg') {
                console.log('>', pck.arg);
            }
        }
    }
};

exports.connect = function (address) {
    data.connection = new Connection();
    data.connection.message.add(protocol.receive);
    data.connection.connect(address);
    protocol.send(protocol.makePacket('logon', exports.playerName));
};

exports.spawnPlayer = function (pid, pdata) {
    var eid = pdata.id;
    data.players[pid] = eid;
    var pos = pdata.pos;
    pos = {x: pos[0], y: pos[1], z: pos[2]};
    var mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(simulator.player.radius, simulator.player.radius, simulator.player.height), new THREE.MeshBasicMaterial({color: 0xc80000}), simulator.player.mass);
    mesh.position.copy(pos);
    mesh.addEventListener('ready', function () {
        mesh.setAngularFactor(new THREE.Vector3(0, 0, 0));
    });
    scenehelper.add(mesh, eid);
};

exports.updateGameState = function (state) {
    if (state.started === true && overlay.active == 'sv-startup') {
        overlay.show('pause');
    }
    if (state.started === false && overlay.active != 'sv-startup') {
        overlay.show('sv-startup');
    }

    for (var k in state) {
        if (state.hasOwnProperty(k)) {
            data.gameState[k] = state[k];
        }
    }
};

command("connect <address>",
    {mandatory: [{name: 'address', type: 'string'}]},
    'connect',
    function (match) {
        exports.connect(match.address);
    });

command("rcon <cmd>",
    {mandatory: [{name: 'cmd', type: 'string'}]},
    'rcon', function (match) {
        rcon.execCommand(match.cmd);
    });

command("auth <pwd>",
    {mandatory: [{name: 'pwd', type: 'string'}]},
    'auth', function (match) {
        rcon.authorize(match.pwd);
    });

command.engine.registerCvar('name', exports, 'playerName');
