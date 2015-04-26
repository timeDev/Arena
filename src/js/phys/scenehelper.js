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
    THREE = require('../vendor/three'),
    v3 = new THREE.Vector3(),
    data;


exports.init = function (gamedata) {
    data = gamedata;
};

exports.updateBody = function (id, desc) {
    var mesh = data.bodies[id];
    if (desc.v) {
        mesh.setLinearVelocity(v3.set(desc.v[0], desc.v[1], desc.v[2]));
    }
    if (desc.p) {
        mesh.position.set(desc.p[0], desc.p[1], desc.p[2]);
        mesh.__dirtyPosition = true;
    }
};

exports.makeUpdatePacket = function (id) {
    var mesh = data.bodies[id];
    return {ph: {p: mesh.position.toArray(), v: mesh.getLinearVelocity().toArray()}};
};

exports.getId = function (mesh) {
    return data.bodies.indexOf(mesh);
};

exports.getMesh = function (id) {
    return data.bodies[id];
};

exports.add = function (mesh, id) {
    data.bodies[id] = mesh;
    data.scene.add(mesh);
};

exports.remove = function (id) {
    data.scene.remove(data.bodies[id]);
    delete data.bodies[id].id;
    delete data.bodies[id];
};
