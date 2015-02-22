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
    CANNON = require('../vendor/cannon'),
    ocl = require('./ocl'),
    materials = require('./materials'),
// Local
    world,
    solver = new CANNON.GSSolver(),
    split = true,
    idLookup = [];

// -- Setup --
world = new CANNON.World();
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;

world.defaultContactMaterial.contactEquationStiffness = 1e9;
world.defaultContactMaterial.contactEquationRegularizationTime = 4;

world.addContactMaterial(materials.cmPlayerGround);
world.addContactMaterial(materials.cmPlayerDefault);

solver.iterations = 7;
solver.tolerance = 0.1;
if (split) {
    world.solver = new CANNON.SplitSolver(solver);
} else {
    world.solver = solver;
}

world.gravity.set(0, -20, 0);
world.broadphase = new CANNON.NaiveBroadphase();

exports.world = world;

exports.update = function (time) {
    world.step(1 / 60, time, 2);
};

exports.updateBody = function (id, desc) {
    var body = idLookup[id];
    if (desc.v) {
        body.velocity.set(desc.v[0], desc.v[1], desc.v[2]);
    }
    if (desc.p) {
        body.position.set(desc.p[0], desc.p[1], desc.p[2])
    }
};

exports.add = function (body, id) {
    if (!body.material) {
        body.material = materials.defaultMaterial;
    }
    idLookup[id] = body;
    body.id = id;
    world.add(body);
};

exports.remove = function (id) {
    world.remove(idLookup[id]);
    delete idLookup[id].id;
    delete idLookup[id];
};