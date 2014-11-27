/*global require, module, exports */
var // Module
    Clock = require('./common/clock'),
    settings = require('./common/settings'),
    display = require('./client/display'),
    controls = require('./client/controls'),
    simulator = require('./common/simulator').make(),
    commands = require('./common/commands'),
    console = require('./common/console'),
    level = require('./common/level'),
    scenemgr = require('./client/scene-manager'),
    // Function
    update;

settings.api.init();
scenemgr.init(display.scene, simulator.world);

update = function (time) {
    controls.update(time);
    simulator.update(time);
    scenemgr.copyWorldToScene();
};

exports.start = function () {
    display.render();
    Clock.startNew(16, update);
};

controls.firstPersonCam(display.camera);
controls.sceneObj.position.set(0, 2, 0);
controls.physBody.position.set(0, 2, 0);
controls.physBody.linearDamping = 0.95;
display.scene.add(controls.sceneObj);
simulator.world.addBody(controls.physBody);

commands.register(level.commands);
commands.register(display.commands);
commands.register(controls.commands);

console.execute("lv_load maps/devtest.json");