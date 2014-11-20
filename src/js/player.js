/*global require, module, exports */
var // Module
    THREE = require('./vendor/THREE'),
    CANNON = require('./vendor/CANNON'),
    input = require('./client/input'),
    settings = require('./settings'),
    // Local
    shape, physBody,
    onground = false,
    pitchObj = new THREE.Object3D(), yawObj = new THREE.Object3D(),
    vec3a = new THREE.Vector3(), contactNormal = new CANNON.Vec3(),
    upAxis = new CANNON.Vec3(0, 1, 0);

physBody = new CANNON.Body({mass: settings.player.mass});
shape = new CANNON.Sphere(settings.player.radius);
physBody.addShape(shape);

yawObj.rotation.y = Math.PI * 1.25;

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

module.exports = {
    /// <field name="physBody" type="CANNON.Body">The physics body this player represents.</field>
    physBody: physBody,
    /// <field name="sceneObj" type="THREE.Object3D">The scene graph object containing the camera.</field>
    sceneObj: yawObj,

    init: function (camera) {
        pitchObj.add(camera);
        yawObj.add(pitchObj);
    },

    update: function () {
        /// <summary>Updates the player's position and camera rotation.</summary>
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
        yawObj.position.copy(physBody.position);
    }
};