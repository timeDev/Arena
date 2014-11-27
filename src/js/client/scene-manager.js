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
    objects = {},
    idtracker = 0,
// Functions
    newId;

newId = function () {
    return idtracker++;
};

exports.init = function (sc, wo) {
    exports.scene = sc;
    exports.world = wo;
};

exports.addToScene = function (obj) {
    var id = newId();
    obj.tracker = {id: id, type: "scene"};
    exports.scene.add(obj);
    objects[id] = obj;
    return id;
};

exports.addToWorld = function (obj) {
    var id = newId();
    obj.tracker = {id: id, type: "world"};
    exports.world.add(obj);
    objects[id] = obj;
    return id;
};

exports.link = function (a, b) {
    if (typeof a === "number") {
        a = objects[a];
        b = objects[b];
    }
    a.tracker.link = b;
    b.tracker.link = a;
};

exports.addLink = function (s, w) {
    this.addToScene(s);
    this.addToWorld(w);
    this.link(s, w);
};

exports.copyWorldToScene = function () {
    var i, obj;
    for (i = 0; i < idtracker; i++) {
        if (objects[i] !== undefined) {
            obj = objects[i];
            if (obj.tracker.type === "scene" && obj.tracker.link !== undefined) {
                obj.position.copy(obj.tracker.link.position);
                obj.quaternion.copy(obj.tracker.link.quaternion);
            }
        }
    }
};

exports.copySceneToWorld = function () {
    var i, obj;
    for (i = 0; i < idtracker; i++) {
        if (objects[i] !== undefined) {
            obj = objects[i];
            if (obj.tracker.type === "world" && obj.tracker.link !== undefined) {
                obj.position.copy(obj.link.position);
                obj.quaternion.copy(obj.link.quaternion);
            }
        }
    }
};

exports.remove = function (id) {
    var obj = objects[id];
    if (obj.tracker.type === "scene") {
        exports.scene.remove(obj);
    } else {
        exports.world.remove(obj);
    }
    delete objects[id];
};
