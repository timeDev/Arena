Arena.Player = (function () {
    'use strict';
    var vec3a = new THREE.Vector3(), HALF_PI = Math.PI / 2, contactNormal = new CANNON.Vec3(), upAxis = new CANNON.Vec3(0, 1, 0),
        Player = function (camera, input) {
            this.input = input, self = this;

            this.pitchObj = new THREE.Object3D();
            this.pitchObj.add(camera);
            this.yawObj = new THREE.Object3D();
            this.yawObj.add(this.pitchObj);

            this.cannonBody = new CANNON.Body({ mass: Arena.settings.gameplay.playerMass });
            var shape = new CANNON.Sphere(Arena.settings.gameplay.playerRadius);
            this.cannonBody.addShape(shape);
            this.maxChangeVel = 10.0;
            this.jumpVel = 12.0;
            this.onground = false;

            this.cannonBody.addEventListener('collide', function (e) {
                var contact = e.contact;

                // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
                // We do not yet know which one is which! Let's check.
                if (contact.bi.id === self.cannonBody.id) { // bi is the player body, flip the contact normal
                    contact.ni.negate(contactNormal);
                } else {
                    contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
                }
                // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
                if (contactNormal.dot(upAxis) > 0.5) { // Use a "good" threshold value between 0 and 1 here!
                    self.onground = true;
                }
            });
        };

    Player.prototype.update = function () {
        this.yawObj.rotation.y -= this.input.check('lookx') * Arena.settings.mouse.sensitivityX;
        this.pitchObj.rotation.x -= this.input.check('looky') * Arena.settings.mouse.sensitivityY;
        this.pitchObj.rotation.x = Math.clamp(this.pitchObj.rotation.x, -HALF_PI, HALF_PI);

        vec3a.set((this.input.check('movr') - this.input.check('movl')) * Arena.settings.gameplay.moveSpeed, 0, (this.input.check('movb') - this.input.check('movf')) * Arena.settings.gameplay.moveSpeed);
        vec3a.applyQuaternion(this.yawObj.quaternion);

        var vel = this.cannonBody.velocity, changeVel = new THREE.Vector3().subVectors(vec3a, vel);
        changeVel.x = Math.clamp(changeVel.x, -this.maxChangeVel, this.maxChangeVel);
        changeVel.y = -1;
        changeVel.z = Math.clamp(changeVel.z, -this.maxChangeVel, this.maxChangeVel);

        if (this.onground === false) {
            changeVel.multiplyScalar(0.1);
        }

        if (this.onground && this.input.check('jump') > 0.2) {
            changeVel.y = this.jumpVel;
            this.onground = false;
        }

        this.cannonBody.velocity.vadd(changeVel, this.cannonBody.velocity);
        this.yawObj.position.copy(this.cannonBody.position);
    };

    return Player;
}());