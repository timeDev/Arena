/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Oskar Homburg
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
/*global require, module, exports:true */
var
// Module
    commands = require('../common/commands'),
    protocol = require('./protocol'),
    console = require('./console'),
// Local
    cvarCache;

commands.contexts.rcon = exports = module.exports = commands.makeContext();
console.log("rcon context made");

protocol.rconHandler = {
    status: function (msg) {
        console.log(msg);
    },
    error: function (msg) {
        console.warn(msg);
    },
    cvar: function (name, value) {
        cvarCache[name] = value;
    },
    command: function (cmd) {
        // Execute command as server
        commands.execute(cmd, 'sv');
    }
};

exports.cacheCvars = function () {
    cvarCache = {};
    protocol.sendRconQueryAll();
};

exports.execute = function (cmd, args) {
    protocol.sendRconCommand(cmd.name, args);
};

exports.setCvar = function (name, value) {
    protocol.sendRconCommand(name, [value]);
};

exports.getCvar = function (name) {
    // Refresh even if we already know it
    protocol.sendRconQuery(name);
    return cvarCache[name];
};

exports.commands = {};

exports.commands.rcon = {
    isCvar: false,
    name: 'rcon',
    ctx: {cl: commands.contexts.host},
    handler: function (args) {
        if (args[1] === "status") {
            protocol.sendRconStatus();
        } else if (args[1] === "auth") {
            protocol.sendRconAuthorize(args[2]);
        } else {
            throw "Usage: rcon status | rcon auth <pwd>";
        }
    }
};
