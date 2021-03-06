﻿/*
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
    THREE = require('../vendor/three'),
    PHYSI = require('../vendor/physi'),
    ocl = require('./../util/ocl'),
    arena = require('./arena'),
    props = require('./props');

ocl.define('obj', function (params) {
    if (params.pos) {
        this.pos = new THREE.Vector3(params.pos[0], params.pos[1], params.pos[2]);
    }
    if (params.quat) {
        this.quat = new THREE.Quaternion(params.quat[0], params.quat[1], params.quat[2], params.quat[3]);
    }
    if (params.flags) {
        this.flags = params.flags;
    }
});

ocl.define('mesh', function () {
    this.mesh = new THREE.Mesh(this.geo, this.mat);
});

ocl.define('prop', function (name) {
    var ctx = this;
    ctx.propName = name;
    this.ocl.suspend();
    props.load(name, function (prop) {
        ctx.prop = prop;
        ctx.mesh = prop.mesh;
        ctx.ocl.resume();
    });
});

ocl.define('body', function (params) {
    if (params.friction !== undefined && params.restitution !== undefined) {
        this.mat = PHYSI.createMaterial(this.mat, params.friction, params.restitution);
    }
    this.mass = params.mass;
});

ocl.define('model', function (modelName) {
    var ctx = this;
    var cb = function (geometry, materials) {
        ctx.geo = geometry;
        if (materials.length) {
            ctx.mat = materials[0];
        }
        ctx.ocl.resume();
    };
    this.ocl.suspend();
    (new THREE.JSONLoader()).load(arena.modelDir + modelName + ".json", cb, arena.textureDir);
});

// Geometry

ocl.define('rbox', function (x, y, z) {
    this.geo = new THREE.BoxGeometry(x, y, z);
});

ocl.define('rcyl', function (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded) {
    this.geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded);
});

ocl.define('rico', function (radius, detail) {
    this.geo = new THREE.IcosahedronGeometry(radius, detail);
});

ocl.define('rpla', function (width, height, wSeg, hSeg) {
    this.geo = new THREE.PlaneGeometry(width, height, wSeg, hSeg);
});

ocl.define('rsph', function (params) {
    this.geo = new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments, params.phiStart, params.phiLength, params.thetaStart, params.thetaLength);
});

ocl.define('rcir', function (params) {
    this.geo = new THREE.CircleGeometry(params.radius, params.segments, params.thetaStart, params.thetaLength);
});

// Collision objects

ocl.define('cbox', function () {
    this.mesh = new PHYSI.BoxMesh(this.geo, this.mat, this.mass);
});

ocl.define('csph', function () {
    this.mesh = new PHYSI.SphereMesh(this.geo, this.mat, this.mass);
});

ocl.define('ccyl', function () {
    this.mesh = new PHYSI.CylinderMesh(this.geo, this.mat, this.mass);
});

ocl.define('cpla', function () {
    this.mesh = new PHYSI.PlaneMesh(this.geo, this.mat, this.mass);
});

// Material

ocl.define('matbasic', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshBasicMaterial(params);
});

ocl.define('matdepth', function (params) {
    this.mat = new THREE.MeshDepthMaterial(params);
});

ocl.define('matlambert', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshLambertMaterial(params);
});

ocl.define('matnormal', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshNormalMaterial(params);
});

ocl.define('matphong', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshPhongMaterial(params);
});
