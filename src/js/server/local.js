/*global require, module, exports */
var // Module
    CANNON = require('../vendor/cannon'),
    console = require('../console'),
    // Local
    world,
    solver = new CANNON.GSSolver(),
    split = true;

// -- Setup --
world = new CANNON.World();
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;

world.defaultContactMaterial.contactEquationStiffness = 1e9;
world.defaultContactMaterial.contactEquationRegularizationTime = 4;

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