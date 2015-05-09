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
    _ = require('lodash'),
    input = require('../util/input'),
    keycode = require('../util/keycode'),
    THREE = require('../vendor/three'),
    PHYSI = require('../vendor/physi'),
    command = require('../console/command'),
    settings = require('./settings'),
    protocol = require('../net/client'),
    scenehelper = require('../phys/scenehelper'),
    simulator = require('../phys/simulator'),
// Local
    paused = true,
    onground = true, jumpPrg = 0,
    pitchObj = new THREE.Object3D(),
    yawObj = new THREE.Object3D(),
    vec3a = new THREE.Vector3(),
    downAxis = new THREE.Vector3(0, -1, 0),
    mesh;

exports.init = function (data) {
    if (data.cameratype === "first person") {
        exports.firstPersonCam(data.camera);
    }

    input.pointerlocked.add(function () {
        paused = false;
        input.prevent = true;
    });

    input.pointerunlocked.add(function () {
        paused = true;
        input.prevent = false;
    });

    input.escape.add(function () {
        paused = true;
        input.prevent = false;
    });

    input.bind('mouseaxis', 2, 'lookx');
    input.bind('mouseaxis', 3, 'looky');
    input.bind('key', keycode.w, 'movf');
    input.bind('key', keycode.a, 'movl');
    input.bind('key', keycode.s, 'movb');
    input.bind('key', keycode.d, 'movr');
    input.bind('key', keycode.space, 'jump');
    input.bind('mouse', 0, 'shoot');

    mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(simulator.player.radius, simulator.player.radius, simulator.player.height),
        PHYSI.createMaterial(new THREE.MeshBasicMaterial({visible: false}), 0.1, 0.0), simulator.player.mass);

    mesh.addEventListener('ready', function () {
        mesh.setAngularFactor(new THREE.Vector3(0, 0, 0));
    });

    mesh.addEventListener('collision', function (other_object, relative_velocity, relative_rotation, contact_normal) {
        // `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`
        if (contact_normal.dot(downAxis) > 0.5) {
            onground = true;
            jumpPrg = 0;
        }
    });

    mesh.add(yawObj);

    yawObj.rotation.y = 1.25 * Math.PI;

    mesh.position.set(0, 2, 0);
    scenehelper.add(mesh, 0);
    data.playermesh = mesh;
};

exports.initDom = function () {
};
exports.render = function () {
};

exports.update = function (dt, data) {
    input.updateGamepad();

    _(data.packets).where({type: 'playerDataC'}).forEach(_.partial(handlePlayerData, data));

    if (!data.gameState.started) {
        return;
    }

    var accdt = simulator.player.acc * dt;
    if (paused) {
        vec3a.set(0, 0, 0);
    } else {
        updateView();
        updateMovement();
    }

    var vel = mesh.getLinearVelocity(), changeVel = new THREE.Vector3().subVectors(vec3a, vel);
    if (changeVel.length > accdt) {
        changeVel.setLength(accdt);
    }

    changeVel.y = -40 * dt;

    if (onground === false) {
        changeVel.multiplyScalar(0.1);
    }

    if (jumpPrg < simulator.player.jumpDur && input.check('jump') > 0.2) {
        if (onground) {
            changeVel.multiplyScalar(1.2);
        }
        changeVel.y = simulator.player.simulator * dt;
        onground = false;
        jumpPrg += dt;
    }

    mesh.setLinearVelocity(vel.add(changeVel));
    sendPlayerData({p: mesh.position.toArray(), v: vel.toArray()});

    input.resetDelta();
};

function updateView() {
    yawObj.rotation.y -= input.check('lookx') * settings.mouse.sensitivityX;
    pitchObj.rotation.x -= input.check('looky') * settings.mouse.sensitivityY;
    pitchObj.rotation.x = Math.clamp(pitchObj.rotation.x, -Math.HALF_PI, Math.HALF_PI);
}

function updateMovement() {
    vec3a.set((input.check('movr') - input.check('movl')), 0, (input.check('movb') - input.check('movf')));
    if (vec3a.length() > 1) {
        vec3a.normalize();
    }
    vec3a.multiplyScalar(simulator.player.speed);
    vec3a.applyQuaternion(yawObj.quaternion);
}

var pktnr = 0,
    unackPkts = [],
    packetStat = 0;

function handlePlayerData(data, pck) {
    var pid = pck.pid, action = pck.action, pkdata = pck.data, eid;
    if (action === 0) {
        console.log('Logged on');
        data.players[pid] = 0;
    }
    if (action === 1) {
        eid = data.players[pid];
        if (eid === 0) {
            var pnr = pkdata.pnr;
            var pkt = unackPkts[pnr];
            // Only correct position as player acceleration is pretty high
            var corr = {x: pkdata.p[0] - pkt.p[0], y: pkdata.p[1] - pkt.p[1], z: pkdata.p[2] - pkt.p[2]};
            data.playermesh.position.add(corr);
            delete unackPkts[pnr];
            packetStat--;
        } else {
            scenehelper.updateBody(eid, pkdata);
        }
        if (packetStat < 1) {
            unackPkts = [];
            // Reset the counter so everyone is happy
            pktnr = 0;
        }
    }
    // Action 2 handled by cl/client
    if (action === 3) {
        data.players[pid] = undefined;
    }
}

function sendPlayerData(data) {
    protocol.send(protocol.makePacket('playerDataS', data, ++pktnr));
    unackPkts[pktnr] = data;
    packetStat++;
}

exports.firstPersonCam = function (camera) {
    pitchObj.add(camera);
    yawObj.add(pitchObj);
};
