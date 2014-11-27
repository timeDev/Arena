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
    console.execute("lv_load maps/devtest.json");
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
