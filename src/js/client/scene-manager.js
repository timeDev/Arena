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
// Local
    sceneObjects = [],
    worldObjects = [];

exports.init = function (scene, simulator) {
    exports.scene = scene;
    exports.simu = simulator;
};

exports.addToScene = function (obj, id) {
    obj.tracker = {id: id, type: "scene"};
    exports.scene.add(obj);
    sceneObjects[id] = obj;
};

exports.addToWorld = function (obj, id) {
    obj.tracker = {id: id, type: "world"};
    exports.simu.add(obj, id);
    worldObjects[id] = obj;
};

exports.addLink = function (s, w) {
    this.addToScene(s);
    this.addToWorld(w);
    this.link(s, w);
};

exports.copyWorldToScene = function () {
    var i, w, s;
    for (i = 0; i < worldObjects.length; i++) {
        if (worldObjects[i] !== undefined && sceneObjects[i] !== undefined) {
            w = worldObjects[i];
            s = sceneObjects[i];
            s.position.copy(w.position);
            s.quaternion.copy(w.quaternion);
        }
    }
};

exports.copySceneToWorld = function () {
    var i, s, w;
    for (i = 0; i < sceneObjects.length; i++) {
        if (sceneObjects[i] !== undefined && worldObjects[i] !== undefined) {
            s = worldObjects[i];
            w = sceneObjects[i];
            w.position.copy(s.position);
            w.quaternion.copy(s.quaternion);
        }
    }
};

exports.remove = function (id) {
    var s = sceneObjects[id];
    exports.scene.remove(s);
    exports.simu.remove(id);
    delete sceneObjects[id];
    delete worldObjects[id];
};
