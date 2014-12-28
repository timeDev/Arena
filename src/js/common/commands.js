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
    Signal = require('signals');

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
            ctx.registerFunc(key, list[key]);
        }
    }
};

exports.makeContext = function () {
    var ctx = {},
        funcs = {},
        cvars = {};

    ctx.cvarChanged = new Signal();
    ctx.funcInvoked = new Signal();
    ctx.command = new Signal();

    ctx.registerCvar = function (name, value) {
        cvars[name] = value;
    };

    ctx.setCvar = function (name, val) {
        var fn, oldVal, newVal;
        if (typeof cvars[name] === 'function') {
            fn = cvars[name];
            oldVal = fn();
            fn(val);
            newVal = fn();
            ctx.cvarChanged.dispatch(name, oldVal, newVal);
        } else {
            oldVal = cvars[name];
            cvars[name] = val;
            ctx.cvarChanged.dispatch(name, oldVal, val);
        }
    };

    ctx.getCvar = function (name) {
        return typeof cvars[name] === 'function' ? cvars[name]() : cvars[name];
    };

    ctx.registerFunc = function (name, handler) {
        funcs[name] = handler;
    };

    ctx.execute = function (cmd) {
        if (cmd.indexOf(';') >= 0) {
            var cmdList = cmd.split(';');
            return cmdList.map(ctx.execute);
        }
        var args, name, val;
        ctx.command.dispatch(cmd);
        args = cmd.split(' ');
        if (args.length < 1) {
            return undefined;
        }
        name = args[0];
        if (funcs[name] !== undefined) {
            var res = funcs[name](cmd, args);
            ctx.funcInvoked.dispatch(name, args);
            return res;
        } else if (cvars[name] !== undefined) {
            if (args.length === 1) {
                return ctx.getCvar(name);
            } else {
                val = args[1];
                if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                    val = parseFloat(val);
                }
                ctx.setCvar(name, val);
                return undefined;
            }
        } else {
            throw "No such command: " + args[0];
        }
    };

    ctx.getCfgString = function () {
        var str = "";
        for (var key in cvars) {
            if (cvars.hasOwnProperty(key)) {
                str = str.concat(key, " ", this.getCvar(key), ";");
            }
        }
    };

    return ctx;
};