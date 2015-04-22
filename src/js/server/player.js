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
    settings = require('../common/settings'),
    THREE = require('../vendor/three'),
    PHYSI = require('../vendor/physi'),
    server = require('./server');

function Player(connection) {
    this.connection = connection;
    this.name = "unnamed";
    this.data = {};
    this.entityId = server.newId();
    this.playerId = Player.newId();

    this.mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(settings.player.radius, settings.player.radius,settings.player.height),
        PHYSI.createMaterial(new THREE.MeshBasicMaterial({visible: false}), 0.1, 0.0), settings.player.mass);
}

Player.prototype.updateBody = function (state) {
    if (state.v) {
        var v = new THREE.Vector3(state.v[0], state.v[1], state.v[2]);
        if (v.length > settings.player.speed) {
            v.setLength(settings.player.speed);
        }
        this.mesh.setLinearVelocity(v);
    }
    if (state.p) {
        var p = new THREE.Vector3(state.p[0], state.p[1], state.p[2]);
        var len = p.distanceTo(this.mesh.position);
        // Use 1.3 tolerance
        if (len > settings.player.speed * 1.3) {
            p.sub(this.mesh.position);
            p.setLength(settings.player.speed);
            p.add(this.mesh.position);
        }
        this.mesh.position.copy(p);
        this.mesh.__dirtyPosition = true;
    }
};

Player.prototype.teleport = function (x, y, z) {
    this.mesh.position.set(x, y, z);
    this.mesh.__dirtyPosition = true;
};

Player.newId = function () {
    var id = 0;
    return function () {
        return id++;
    };
}();

module.exports = Player;