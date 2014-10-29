Arena.Player = (function () {
    'use strict';
    var Player = function (camera, input) {
        this.input = input;

        this.pitchObj = new THREE.Object3D();
        this.pitchObj.add(camera);
        this.yawObj = new THREE.Object3D();
        this.yawObj.add(this.pitchObj);

        this.cannonBody = new CANNON.Body({ mass: Arena.settings.gameplay.playerMass });
        var shape = new CANNON.Sphere(Arena.settings.gameplay.playerRadius);
        this.cannonBody.addShape(shape);
        this.maxChangeVel = 10.0;
    }, vec3a = new THREE.Vector3(), HALF_PI = Math.PI / 2;

    Player.prototype.update = function () {
        this.yawObj.rotation.y -= this.input.check("lookx") * Arena.settings.mouse.sensitivityX;
        this.pitchObj.rotation.x -= this.input.check("looky") * Arena.settings.mouse.sensitivityY;
        this.pitchObj.rotation.x = Math.clamp(this.pitchObj.rotation.x, -HALF_PI, HALF_PI);

        vec3a.set((this.input.check("movr") - this.input.check("movl")) * Arena.settings.gameplay.moveSpeed, 0, (this.input.check("movb") - this.input.check("movf")) * Arena.settings.gameplay.moveSpeed);
        vec3a.applyQuaternion(this.yawObj.quaternion);

        var vel = this.cannonBody.velocity, changeVel = new THREE.Vector3().subVectors(vec3a, vel);
        changeVel.x = Math.clamp(changeVel.x, -this.maxChangeVel, this.maxChangeVel);
        changeVel.y = 0;
        changeVel.z = Math.clamp(changeVel.z, -this.maxChangeVel, this.maxChangeVel);

        this.cannonBody.velocity.vadd(changeVel, this.cannonBody.velocity);
        this.yawObj.position.copy(this.cannonBody.position);
    };

    return Player;
}());