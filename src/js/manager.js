/*global require, module, exports */
var // Module
    loop = require('./loop'),
    settings = require('./settings'),
    display = require('./client/display'),
    controls = require('./client/controls'),
    local = require('./server/local'),
    commands = require('./commands'),
    console = require('./console'),
    level = require('./server/level'),
    scenemgr = require('./scene-manager'),
    // Function
    update;

settings.api.init();
scenemgr.init(display.scene, local.world);

update = function (time) {
    controls.update(time);
    local.update(time);
    scenemgr.copyWorldToScene();
};

loop.render.add(display.render);
loop.update.add(update);

exports.start = function () {
    loop.start();
};

controls.firstPersonCam(display.camera);
controls.sceneObj.position.set(0, 2, 0);
controls.physBody.position.set(0, 2, 0);
controls.physBody.linearDamping = 0.95;
display.scene.add(controls.sceneObj);
local.world.addBody(controls.physBody);

commands.register(level.commands);
commands.register(display.commands);
commands.register(controls.commands);

console.execute("lv_load maps/devtest.json");