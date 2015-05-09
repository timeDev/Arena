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
    gamepad, pointerLockElmt, handlers,
    keybinds = {},
    registry = {key: {}, mouse: {}},
    pointerLocked = false,
    prevent = false,
    mousepos = [0, 0, 0, 0],
// Functions
    updateMouseMoveHandler, lockChangeCb, lockErrorCb;

// Signals
exports.escape = new Signal();
exports.pointerlocked = new Signal();
exports.pointerunlocked = new Signal();

handlers = {
    keydown: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = e.which || e.charCode || e.keyCode;
        if (e === 27) {
            exports.escape.dispatch();
        }
        registry.key[which] = 1.0;
    },
    keyup: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = e.which || e.charCode || e.keyCode;
        registry.key[which] = 0.0;
    },
    mousedown: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
        registry.mouse[which] = 1.0;
    },
    mouseup: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
        registry.mouse[which] = 0.0;
    },
    mousemove1: function (e) {
        var prevX = mousepos[0], prevY = mousepos[1],
            deltaX = e.movementX || e.webkitMovementX || e.mozMovementX || prevX - e.pageX,
            deltaY = e.movementY || e.webkitMovementY || e.mozMovementY || prevY - e.pageY;
        mousepos = [e.pageX, e.pageY, mousepos[2] + deltaX, mousepos[3] + deltaY];
    },
    mousemove2: function (e) {
        var deltaX = e.movementX || e.webkitMovementX || e.mozMovementX || 0,
            deltaY = e.movementY || e.webkitMovementY || e.mozMovementY || 0;
        mousepos = [mousepos[0] + deltaX, mousepos[1] + deltaY, mousepos[2] + deltaX, mousepos[3] + deltaY];
    }
};
handlers.mousemove = handlers.mousemove1;

updateMouseMoveHandler = function () {
    document.removeEventListener("mousemove", handlers.mousemove, false);
    handlers.mousemove = pointerLocked ? handlers.mousemove2 : handlers.mousemove1;
    document.addEventListener("mousemove", handlers.mousemove, false);
};

lockChangeCb = function () {
    if (document.pointerLockElement === pointerLockElmt || document.mozPointerLockElement === pointerLockElmt || document.webkitPointerLockElement === pointerLockElmt) {
        pointerLocked = true;
        exports.pointerlocked.dispatch();
    } else {
        pointerLocked = false;
        exports.pointerunlocked.dispatch();
    }
    updateMouseMoveHandler();
};

lockErrorCb = function () {
    window.console.error('Error requesting pointer lock! Please report this issue.');
};

window.addEventListener('keydown', handlers.keydown, false);
window.addEventListener('keyup', handlers.keyup, false);
window.addEventListener('mousedown', handlers.mousedown, false);
window.addEventListener('mouseup', handlers.mouseup, false);

document.addEventListener("mousemove", handlers.mousemove, false);

document.addEventListener('pointerlockchange', lockChangeCb, false);
document.addEventListener('mozpointerlockchange', lockChangeCb, false);
document.addEventListener('webkitpointerlockchange', lockChangeCb, false);

document.addEventListener('pointerlockerror', lockErrorCb, false);
document.addEventListener('mozpointerlockerror', lockErrorCb, false);
document.addEventListener('webkitpointerlockerror', lockErrorCb, false);

// TODO: Proper polyfill
navigator.getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || function () {
    return [];
};

exports.updateGamepad = function () {
    var pads = navigator.getGamepads(), pad;
    if (!pads || pads.length === 0 || !pads[0]) {
        return;
    }

    pad = pads[0];
    if (pad.mapping === "standard") {
        gamepad = pad;
    } else {
        window.console.log("Non standard gamepad detected: " + pad.id);
    }
};

exports.trylockpointer = function (element) {
    if (pointerLocked) {
        return;
    }
    element.requestPointerLock = element.requestPointerLock || element.webkitRequestPointerLock || element.mozRequestPointerLock;
    exports.exitPointerLock = document.exitPointerLock || document.webkitExitPointerLock || document.mozExitPointerLock;
    if (!element.requestPointerLock) {
        return false;
    }
    pointerLockElmt = element;
    element.requestPointerLock();
    return true;
};

exports.bind = function (what, key, name) {
    keybinds[name] = {what: what, key: key};

    // Init keys so that they don't have to be pressed once
    if (what === "key" || what === "mouse") {
        registry[what][key] = 0.0;
    }
};

exports.unbind = function (name) {
    delete keybinds[name];
};

exports.unbindKey = function (what, key) {
    var bindings = keybinds, prop;
    for (prop in bindings) {
        if (bindings.hasOwnProperty(prop) && bindings[prop].what === what && bindings[prop].key === key) {
            bindings[prop] = null;
        }
    }
};

exports.check = function (name) {
    var binding = keybinds[name], what = binding.what, key = binding.key;
    if (what === "key" || what === "mouse") {
        return registry[what][key];
    }
    if (what === "padkey") {
        return gamepad && gamepad.buttons[key].value;
    }
    if (what === "padaxis") {
        return gamepad && gamepad.axes[key];
    }
    if (what === "mouseaxis") {
        return mousepos[key];
    }
};

exports.resetDelta = function () {
    mousepos[2] = 0.0;
    mousepos[3] = 0.0;
};
