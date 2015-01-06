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
    funcs = {},
    cvars = {};

exports.validate = function (expected, args) {
    var i, result = true;
    if (args.length !== expected.length + 1) {
        throw String.format("Mismatched arguments! Expected {0}, got {1}", expected.length, args.length - 1);
    }
    for (i = 0; i < expected.length; i++) {
        if (expected[i] === 'number') {
            var val = args[i + 1];
            if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                val = parseFloat(val);
            }
            args[i + 1] = val;
        }
        if (typeof args[i + 1] !== expected[i]) {
            throw String.format("Mismatched argument types! [{0}] Expected {1}, got {2}", i + 1, expected[i], typeof args[i + 1]);
        }
    }
    return result;
};

exports.register = function (list) {
    for (var key in list) {
        if (list.hasOwnProperty(key)) {
            var cmd = list[key];
            if (cmd.isCvar) {
                exports.registerCvar(cmd.name, cmd.value, cmd.ctx);
            } else {
                exports.registerFunc(cmd.name, cmd.handler, cmd.ctx);
            }
        }
    }
};

exports.registerFunc = function (key, handler, ctx) {
    var cmd = {name: key, handler: handler};
    for (var k in ctx) {
        if (ctx.hasOwnProperty(k)) {
            cmd[k] = ctx[k];
        }
    }
    funcs[key] = cmd;
};

exports.registerCvar = function (name, value, ctx) {
    var cv = {name: name, value: value};
    for (var k in ctx) {
        if (ctx.hasOwnProperty(k)) {
            cv[k] = ctx[k];
        }
    }
    cvars[name] = cv;
};

exports.execute = function (cmd, context) {
    if (cmd.indexOf(';') >= 0) {
        var cmdList = cmd.split(';');
        return cmdList.map(function (c) {
            exports.execute(c, context);
        });
    }
    var args, name, val, ctx;
    args = cmd.split(' ');
    if (args.length < 1) {
        return undefined;
    }
    name = args[0];
    if (funcs[name] !== undefined) {
        var command = funcs[name];
        ctx = command[context] || command.ctx;
        return ctx.execute(command, args);
    } else if (cvars[name] !== undefined) {
        ctx = cvars[name][context] || cvars[name].ctx;
        if (args.length === 1) {
            return ctx.getCvar(name);
        } else {
            val = args[1];
            if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                val = parseFloat(val);
            }
            ctx.setCvar(name, val);
        }
    } else {
        throw "No such command: " + args[0];
    }
};

exports.getCvar = function (name, context) {
    var ctx = cvars[name][context] || cvars[name].ctx;
    return ctx.getCvar(name);
};

exports.getCvars = function () {
    return cvars;
};

exports.getCfgString = function (context) {
    var str = "";
    for (var key in cvars) {
        if (cvars.hasOwnProperty(key)) {
            str = str.concat(key, " ", exports.getCvar(key, context), ";");
        }
    }
    return str;
};

exports.makeContext = function () {
    var ctx = {};

    var notImplFn = function () {
        throw "Not implemented!";
    };

    ctx.execute = notImplFn;
    ctx.getCvar = notImplFn;
    ctx.setCvar = notImplFn;

    return ctx;
};

exports.contexts = {};

exports.contexts.host = exports.makeContext();

exports.contexts.host.execute = function (cmd, args) {
    cmd.handler(args);
};

exports.contexts.host.getCvar = function (name) {
    if (cvars[name] === undefined) {
        return;
    }
    return typeof cvars[name].value === 'function' ? cvars[name].value.call() : cvars[name].value;
};

exports.contexts.host.setCvar = function (name, value) {
    if (cvars[name] === undefined) {
        return;
    }
    var cvar = cvars[name];
    if (cvar.value === 'function') {
        cvar.value(value);
    } else {
        cvar.value = value;
    }
};
