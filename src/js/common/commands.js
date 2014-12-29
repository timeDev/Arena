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
    Signal = require('signals'),
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

exports.register = function (ctx, list) {
    for (var key in list) {
        if (list.hasOwnProperty(key)) {
            exports.registerFunc(key, list[key], ctx);
            ctx.registerFunc(key, list[key]);
        }
    }
};

exports.registerFunc = function (key, handler, ctx) {
    if (ctx) {
        handler.ctx = ctx;
    }
    funcs[key] = handler;
};

exports.registerCvar = function (name, value, ctx) {
    cvars[name] = {value: value, ctx: ctx};
};

exports.setCvar = function (name, value) {
    var fn, oldVal, newVal;
    if (cvars[name] === undefined) {
        return;
    }
    var cvar = cvars[name];
    if (cvar.value === 'function') {
        fn = cvar.value;
        oldVal = fn();
        fn(value);
        newVal = fn();
        cvar.ctx.cvarChanged.dispatch(name, oldVal, newVal);
    } else {
        oldVal = cvar.value;
        cvar.value = value;
        cvar.ctx.cvarChanged.dispatch(name, oldVal, value);
    }
};

exports.getCvar = function (name) {
    if (cvars[name] === undefined) {
        return;
    }
    return typeof cvars[name].value === 'function' ? cvars[name].value.call() : cvars[name].value;
};

exports.execute = function (cmd) {
    if (cmd.indexOf(';') >= 0) {
        var cmdList = cmd.split(';');
        return cmdList.map(exports.execute);
    }
    var args, name, val;
    args = cmd.split(' ');
    if (args.length < 1) {
        return undefined;
    }
    name = args[0];
    if (funcs[name] !== undefined) {
        funcs[name].ctx.command.dispatch(cmd);
        var res = funcs[name].call(null, cmd, args);
        funcs[name].ctx.funcInvoked.dispatch(name, args);
        return res;
    } else if (cvars[name] !== undefined) {
        if (args.length === 1) {
            return commands.getCvar(name);
        } else {
            val = args[1];
            if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                val = parseFloat(val);
            }
            commands.setCvar(name, val);
            return undefined;
        }
    } else {
        throw "No such command: " + args[0];
    }
};

exports.getCfgString = function () {
    var str = "";
    for (var key in cvars) {
        if (cvars.hasOwnProperty(key)) {
            str = str.concat(key, " ", exports.getCvar(key), ";");
        }
    }
    return str;
};

exports.makeContext = function () {
    var ctx = {};

    ctx.cvarChanged = new Signal();
    ctx.funcInvoked = new Signal();
    ctx.command = new Signal();

    return ctx;
};