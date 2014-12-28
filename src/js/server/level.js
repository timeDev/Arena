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
    level = require('../common/level'),
    commands = require('../common/commands'),
    ocl = require('../common/ocl'),
    Sexhr = require('../vendor/SeXHR'),
    protocol = require('./protocol'),
// Local
    sim, ids = [];

Object.defineProperty(exports, 'simulator', {
    get: function () {
        return sim;
    },
    set: function (val) {
        sim = val;
    }
});

exports.newIdFn = function () {
    return -1;
};

exports.spawnObj = function (obj, id) {
    if (!obj.pos) {
        console.warn("Skipping map object without position.");
        return;
    }
    if (obj.body) {
        obj.body.position.copy(obj.pos);
        sim.add(obj.body, id);
        ids.push(id);
    }
};

exports.spawnString = function (str) {
    var id = exports.newIdFn();
    protocol.sendAllSpawnObject(str, id);
    ocl.load(str, function (obj) {
        exports.spawnObj(obj, id);
    });
};

exports.clear = function () {
    ids.forEach(sim.remove);
    ids = [];
};

exports.load = function (str) {
    // Only parse the top level array and take the rest as strings
    var objList = JSON.parse(str);
    objList = objList.map(JSON.stringify);
    objList.forEach(exports.spawnString);
    console.log("Level loaded");
};

exports.commands = {};

exports.commands.lv_clear = function (c, args) {
    commands.validate([], args);
    exports.clear();
};

exports.commands.lv_load = function (c, args) {
    if (!commands.validate(['string'], args)) {
        return;
    }
    new Sexhr().req({
        url: args[1],
        done: function (err, res) {
            if (err) {
                throw err;
            }
            exports.load(res.text);
        }
    });
};

exports.commands.lv_spawn = function (c, args) {
    if (!commands.validate(['string'], args)) {
        return;
    }
    try {
        exports.spawnString(args[1]);
    } catch (e) {
        console.error("Error parsing JSON!");
    }
};
