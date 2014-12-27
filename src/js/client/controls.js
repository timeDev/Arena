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
    input = require('./input'),
    keycode = require('./keycode'),
    THREE = require('../vendor/THREE'),
    CANNON = require('../vendor/CANNON'),
    settings = require('../common/settings'),
    commands = require('../common/commands'),
    protocol = require('./protocol'),
// Local
    paused = true, shape, physBody,
    onground = false,
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

exports.update = function () {
    input.updateGamepad();
    if (paused === true) {
        input.resetDelta();
        yawObj.position.copy(physBody.position);
        return;
    }

    yawObj.rotation.y -= input.check('lookx') * settings.mouse.sensitivityX;
    pitchObj.rotation.x -= input.check('looky') * settings.mouse.sensitivityY;
    pitchObj.rotation.x = Math.clamp(pitchObj.rotation.x, -Math.HALF_PI, Math.HALF_PI);

    vec3a.set((input.check('movr') - input.check('movl')) * settings.player.speed, 0, (input.check('movb') - input.check('movf')) * settings.player.speed);
    vec3a.applyQuaternion(yawObj.quaternion);

    var vel = physBody.velocity, changeVel = new THREE.Vector3().subVectors(vec3a, vel);
    changeVel.x = Math.clamp(changeVel.x, -settings.player.maxAcc, settings.player.maxAcc);
    changeVel.y = -1;
    changeVel.z = Math.clamp(changeVel.z, -settings.player.maxAcc, settings.player.maxAcc);

    if (onground === false) {
        changeVel.multiplyScalar(0.1);
    }

    if (onground && input.check('jump') > 0.2) {
        changeVel.y = settings.player.jumpVel;
        onground = false;
    }

    physBody.velocity.vadd(changeVel, physBody.velocity);
    protocol.sendUpdatePlayer({p: physBody.position.toArray(), v: physBody.velocity.toArray()});
    yawObj.position.copy(physBody.position);

    input.resetDelta();
};

physBody = new CANNON.Body({mass: settings.player.mass});
shape = new CANNON.Sphere(settings.player.radius);
physBody.addShape(shape);

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
    }
});

yawObj.rotation.y = 1.25 * Math.PI;

exports.physBody = physBody;
exports.sceneObj = yawObj;

exports.firstPersonCam = function (camera) {
    pitchObj.add(camera);
    yawObj.add(pitchObj);
};

exports.commands = {};
exports.commands.tp = function (c, args) {
    if (!commands.validate(['number', 'number', 'number'], args)) {
        return;
    }
    exports.physBody.position.set(args[0], args[1], args[2]);
    exports.sceneObj.position.set(args[0], args[1], args[2]);
};
