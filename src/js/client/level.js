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
    ocl = require('../common/ocl'),
    scenemgr = require('./scene-manager'),
    commands = require('../common/commands'),
    Sexhr = require('../vendor/SeXHR'),
// Local
    ids = [];

require('../common/level');
require('./rcon');

exports.load = function () {
    throw "deprecated";
};

exports.spawn = function (obj, id) {
    if (!obj.pos) {
        console.warn("Skipping map object without position.");
        return;
    }
    if (obj.mesh) {
        obj.mesh.position.copy(obj.pos);
        ids.push(scenemgr.addToScene(obj.mesh, id));
    }
    if (obj.body) {
        obj.body.position.copy(obj.pos);
        ids.push(scenemgr.addToWorld(obj.body, id));
    }
};

exports.spawnFromDesc = function (desc, id) {
    ocl.load(desc, function (obj) {
        exports.spawn(obj, id);
    });
};

exports.load = function (str) {
    ocl.load(str, function (objList) {
        objList.forEach(exports.spawn);
        console.log("Level loaded");
    });
};

exports.commands = {};

exports.commands.lv_clear = {
    isCvar: false,
    name: 'lv_clear',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate([], args);
        exports.clear();
    }
};

exports.commands.lv_load = {
    isCvar: false,
    name: 'lv_load',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        new Sexhr().req({
            url: args[1],
            done: function (err, res) {
                if (err) {
                    throw err;
                }
                exports.load(res.text);
            }
        });
    }
};

exports.commands.lv_spawn = {
    isCvar: false,
    name: 'lv_spawn',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        try {
            ocl.load(args[1], exports.spawn);
        } catch (e) {
            console.error("Error parsing JSON!");
        }
    }
};
