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
    console = require('./client/console'),
    level = require('./client/level'),
    scenemgr = require('./client/scene-manager'),
    protocol = require('./client/protocol'),
    server = require('./server/server'),
    Connection = require('./common/connection'),
// Local
    clCmdCtx,
// Function
    update;

exports.initClient = function () {
    clCmdCtx = commands.makeContext();
    settings.commandCtx = clCmdCtx;
    settings.api.init();
    scenemgr.init(display.scene, simulator);

    controls.firstPersonCam(display.camera);
    controls.sceneObj.position.set(0, 2, 0);
    controls.physBody.position.set(0, 2, 0);
    controls.physBody.linearDamping = 0.95;
    display.scene.add(controls.sceneObj);
    simulator.add(controls.physBody, 0);

    commands.register(clCmdCtx, level.commands);
    commands.register(clCmdCtx, display.commands);
    commands.register(clCmdCtx, controls.commands);
};

exports.initServer = function () {
    // Nothing, handled by sv/server module
};

exports.connectLocal = function () {
    protocol.connection = new Connection();
    var svCon = new Connection();
    protocol.connection.connect(svCon);
    server.connect(svCon);
};

update = function (time) {
    controls.update(time);
    simulator.update(time);
    scenemgr.copyWorldToScene();
};

exports.start = function () {
    display.render();
    protocol.simulator = simulator;
    Clock.startNew(16, update);

    server.start();

    server.execute("lv_load maps/devtest.json");
};
