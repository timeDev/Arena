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
    command = require('../console/command'),
    cmdEngine = require('../console/engine'),
    protocol = require('./protocol'),
    console = require('../dom/console'),
// Local
    cvarCache;

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
        cmdEngine.executeString(cmd, window.console);
    }
};

exports.cacheCvars = function () {
    cvarCache = {};
    protocol.sendRconQueryAll();
};

exports.execute = function (str) {
    protocol.sendRconCommand(str);
};

exports.setCvar = function (name, value) {
    protocol.sendRconCommand(name, value);
};

exports.getCvar = function (name) {
    // Refresh even if we already know it
    protocol.sendRconQuery(name);
    return cvarCache[name];
};

command("rcon auth <pwd> | status | cmd <cmd>", [{
    mandatory: [{name: 'mode', type: 'value', value: 'auth'},
        {name: 'pwd', type: 'string'}]
}, {
    mandatory: [{name: 'mode', type: 'value', value: 'status'}]
}, {
    mandatory: [{name: 'mode', type: 'value', value: 'cmd'},
        {name: 'cmd', type: 'string'}]
}], 'rcon', function (match) {
    if (match.matchI === 0) {
        protocol.sendRconAuthorize(match.pwd);
    } else if (match.matchI === 1) {
        protocol.sendRconStatus();
    } else if (match.matchI === 2) {
        protocol.sendRconCommand()
    }
});
