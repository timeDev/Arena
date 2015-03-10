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
    PHYSI = require('../vendor/physi'),
    ocl = require('./../util/ocl'),
    THREE = require('../vendor/three'),
// Local
    scene,
    v3 = new THREE.Vector3(), // aux vector
    idLookup = [];

// -- Setup --
scene = new PHYSI.Scene();

exports.scene = scene;

exports.update = function (time) {
    scene.simulate(time, 2);
};

exports.updateBody = function (id, desc) {
    var mesh = idLookup[id];
    if (desc.v) {
        mesh.setLinearVelocity(v3.set(desc.v[0], desc.v[1], desc.v[2]));
    }
    if (desc.p) {
        mesh.position.set(desc.p[0], desc.p[1], desc.p[2]);
        mesh.__dirtyPosition = true;
    }
};

exports.makeUpdatePacket = function (id) {
    var mesh = idLookup[id];
    return {ph: {p: mesh.position.toArray(), v: mesh.getLinearVelocity().toArray()}};
};

exports.getId = function (mesh) {
    return idLookup.indexOf(mesh);
};

exports.getMesh = function (id) {
    return idLookup[id];
};

exports.add = function (mesh, id) {
    idLookup[id] = mesh;
    scene.add(mesh);
};

exports.remove = function (id) {
    scene.remove(idLookup[id]);
    delete idLookup[id].id;
    delete idLookup[id];
};
