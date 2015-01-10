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
    keycode = require('../client/keycode'),
    commands = require('../common/commands'),
// Local
    domElement = document.createElement('div'),
    inElement = document.createElement('input'),
    outElement = document.createElement('div');

domElement.classList.add("console-container");
inElement.classList.add("console-input");
outElement.classList.add("console-output");

domElement.insertAdjacentHTML('afterbegin', "Console<br>");
domElement.appendChild(outElement);
domElement.appendChild(inElement);

inElement.addEventListener('keypress', function (e) {
    var which = e.which || e.charCode || e.keyCode;
    if (which === keycode.enter) {
        try {
            var result = exports.executeFn(inElement.value);
            if (result !== undefined) {
                exports.log(result);
            }
        } catch (e) {
            exports.error(e.toString());
        }
        inElement.value = "";
    }
});

exports.executeFn = null;

exports.domElement = domElement;
exports.w = window.console;

exports.log = function () {
    var str = String.format.apply(null, arguments);
    this.writeLine(str);
};

exports.warn = function () {
    var str = String.format.apply(null, arguments);
    this.writeLine(str, 'yellow');
};

exports.error = function () {
    var str = String.format.apply(null, arguments);
    this.writeLine(str, 'red');
};

exports.write = function (str, color) {
    if (color) {
        str = '<span style="color: ' + color + '">' + str + '</span>';
    }
    outElement.insertAdjacentHTML('beforeend', str);
    outElement.scrollTop = outElement.scrollHeight;
};

exports.writeLine = function (str, color) {
    str = str || "";
    if (color) {
        str = '<span style="color: ' + color + '">' + str + '</span>';
    }
    outElement.insertAdjacentHTML('beforeend', str + "<br>");
    outElement.scrollTop = outElement.scrollHeight;
};
