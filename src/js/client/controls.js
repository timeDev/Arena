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
    input = require('./../util/input'),
    keycode = require('./../util/keycode'),
    THREE = require('../vendor/three'),
    CANNON = require('../vendor/cannon'),
    settings = require('../common/settings'),
    command = require('../console/command'),
    protocol = require('./../net/client'),
    materials = require('../phys/materials'),
// Local
    paused = true, shape, physBody,
    onground = false, jumpPrg = Infinity,
    pitchObj = new THREE.Object3D(), yawObj = new THREE.Object3D(),
    vec3a = new THREE.Vector3(), contactNormal = new CANNON.Vec3(),
    upAxis = new CANNON.Vec3(0, 1, 0);

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

exports.update = function (dt) {
    input.updateGamepad();

    var accdt = settings.player.acc * dt;
    if (paused) {
        vec3a.set(0, 0, 0);
    } else {
        yawObj.rotation.y -= input.check('lookx') * settings.mouse.sensitivityX;
        pitchObj.rotation.x -= input.check('looky') * settings.mouse.sensitivityY;
        pitchObj.rotation.x = Math.clamp(pitchObj.rotation.x, -Math.HALF_PI, Math.HALF_PI);

        vec3a.set((input.check('movr') - input.check('movl')), 0, (input.check('movb') - input.check('movf')));
        if (vec3a.length() > 1) {
            vec3a.normalize();
        }
        vec3a.multiplyScalar(settings.player.speed);
        vec3a.applyQuaternion(yawObj.quaternion);
    }

    var vel = physBody.velocity, changeVel = new THREE.Vector3().subVectors(vec3a, vel);
    if (changeVel.length > accdt) {
        changeVel.setLength(accdt);
    }

    changeVel.y = -1;

    if (onground === false) {
        changeVel.multiplyScalar(0.1);
    }

    if (jumpPrg < settings.player.jumpDur && input.check('jump') > 0.2) {
        if (onground) {
            changeVel.multiplyScalar(1.2);
        }
        changeVel.y = settings.player.jumpVel;
        onground = false;
        jumpPrg += dt;
    }

    physBody.velocity.vadd(changeVel, physBody.velocity);
    protocol.sendPlayerData({p: physBody.position.toArray(), v: physBody.velocity.toArray()});
    yawObj.position.copy(physBody.position);

    input.resetDelta();
};

physBody = new CANNON.Body({mass: settings.player.mass});
shape = new CANNON.Sphere(settings.player.radius);
physBody.addShape(shape);
physBody.material = materials.playerMaterial;
physBody.fixedRotation = true;
physBody.updateMassProperties();

physBody.addEventListener('collide', function (e) {
    var contact = e.contact;

    // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
    // We do not yet know which one is which! Let's check.
    if (contact.bi.id === physBody.id) { // bi is the player body, flip the contact normal
        contact.ni.negate(contactNormal);
    } else {
        contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
    }
    // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
    if (contactNormal.dot(upAxis) > 0.5) { // Use a "good" threshold value between 0 and 1 here!
        onground = true;
        jumpPrg = 0;
    }
});

yawObj.rotation.y = 1.25 * Math.PI;

exports.physBody = physBody;
exports.sceneObj = yawObj;

exports.firstPersonCam = function (camera) {
    pitchObj.add(camera);
    yawObj.add(pitchObj);
};
