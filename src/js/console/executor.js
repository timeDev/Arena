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
/*global require, module, exports */
var parser = require('./parser');

var stack = [];

Object.defineProperty(stack, "last", {
    get: function () {
        return this[this.length - 1];
    },
    set: function (v) {
        this[this.length - 1] = v;
    }
});

exports.commandEngine = null;

exports.execute = function (commands, ctx) {
    if (!ctx) {
        ctx = {};
    }
    while (stack.length > 0) {
        stack.pop();
    }
    stack.push(ctx);
    var lastVal;
    for (var i = 0; i < commands.length && !stack.last.returned; i++) {
        var cmd = commands[i];
        lastVal = executeCmdline(cmd);
    }
    ctx = stack.pop();
    console.assert(stack.length === 0, "Stack size after execution is not zero!");
    return ctx.retval === undefined ? lastVal : ctx.retval;
};

function executeCmdline(cmdline) {
    if (cmdline === ';') {
        return;
    }
    if (cmdline.type === 'block') {
        return executeBlock(cmdline.body);
    } else if (cmdline.type === 'cmd') {
        return executeCmd(cmdline.name, cmdline.args);
    } else if (cmdline.type === 'ret') {
        stack.last.returned = true;
        return stack.last.retval = executeCmdline(cmdline.body);
    } else if (cmdline.type === 'ass') {
        return stack.last[cmdline.name] = cmdline.value;
    }
}

function executeCmd(name, args) {
    var argsList = args.map(executeValue);
    exports.commandEngine.executeCommand(name, argsList);
}

function executeValue(value) {
    if (typeof value === 'string') {
        if (value[0] === '$') {
            // Variables cannot be set yet, therefor none exist
            var i = stack.length - 1;
            while (i >= 0 && !stack[i].hasOwnProperty(value.substr(1))) {
                i--;
            }
            if (i < 0) {
                throw "Variable '" + value + "' not found!";
            }
            return stack[i][value.substr(1)];
        }
        return value;
    }
    if (typeof value === 'number') {
        return value;
    }
    if (value.type === 'fn') {
        // No need to transform these
        return value;
    }
    return executeExpression(value);
}

function executeExpression(expr) {
    // Not all operations use these but most do
    var r = expr.r, l = expr.l;
    switch (expr.type) {
        case 'expr':
            return executeCmdline(expr.body);
        case '==':
            return l == r;
        case '!=':
            return l != r;
        case '>':
            return l > r;
        case '<':
            return l < r;
        case '+':
            return l + r;
        case '-':
            return l - r;
        case '*':
            return l * r;
        case '/':
            return l / r;
        case '%':
            return l % r;
        case 'u-':
            return -expr.v;
        case 'u!':
            return !expr.v;
        case '>=':
            return l >= r;
        case '<=':
            return l <= r;
        case '&&':
            return l && r;
        case '||':
            return l || r;
    }
}

function executeBlock(body) {
    stack.push({});
    var lastVal = undefined;
    for (var i = 0; i < body.length && !stack.last.returned; i++) {
        var cmd = body[i];
        lastVal = executeCmdline(cmd);
    }
    var ctx = stack.pop();
    return ctx.retval === undefined ? lastVal : ctx.retval;
}
