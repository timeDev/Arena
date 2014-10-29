Arena.Input = (function () {
    "use strict";
    var Input = function () {
        this.registry = { key: {}, mouse: {} };
        this.getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || function () { return []; };
        this.gamepad = undefined;
        this.pointerLocked = false;
        this.mousepos = [0, 0, 0, 0];
        this.pointerLockElmt = undefined;
        this.exitPointerLock = undefined;
        this.keybinds = {};

        var self = this;

        this.keydown = function (e) {
            e.preventDefault();
            var which = e.which || e.charCode || e.keyCode;
            if (e === 27) {
                self.onescape();
            }
            self.registry.key[which] = 1.0;
        };
        this.keyup = function (e) {
            e.preventDefault();
            var which = e.which || e.charCode || e.keyCode;
            self.registry.key[which] = 0.0;
        };
        this.mousedown = function (e) {
            e.preventDefault();
            var which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
            self.registry.mouse[which] = 1.0;
        };
        this.mouseup = function (e) {
            e.preventDefault();
            var which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
            self.registry.mouse[which] = 0.0;
        };
        this.mousemove1 = function (e) {
            var prevX = self.mousepos[0], prevY = self.mousepos[1],
                deltaX = e.movementX || e.webkitMovementX || e.mozMovementX || prevX - e.pageX,
                deltaY = e.movementY || e.webkitMovementY || e.mozMovementY || prevY - e.pageY;
            self.mousepos = [e.pageX, e.pageY, self.mousepos[2] + deltaX, self.mousepos[3] + deltaY];
        };
        this.mousemove2 = function (e) {
            var deltaX = e.movementX || e.webkitMovementX || e.mozMovementX || 0,
                deltaY = e.movementY || e.webkitMovementY || e.mozMovementY || 0;
            self.mousepos = [self.mousepos[0] + deltaX, self.mousepos[1] + deltaY, self.mousepos[2] + deltaX, self.mousepos[3] + deltaY];
        };

        this.updateMouseMoveHandler = function () {
            document.removeEventListener("mousemove", self.mousemove, false);
            self.mousemove = self.pointerLocked ? self.mousemove2 : self.mousemove1;
            document.addEventListener("mousemove", self.mousemove, false);
        };

        this.lockChangeCb = function () {
            if (document.pointerLockElement === self.pointerLockElmt || document.mozPointerLockElement === self.pointerLockElmt || document.webkitPointerLockElement === self.pointerLockElmt) {
                self.pointerLocked = true;
                self.onpointerlocked();
            } else {
                self.pointerLocked = false;
                self.onpointerunlocked();
            }
            self.updateMouseMoveHandler();
        };
        this.lockErrorCb = function () {
            console.log('Error requesting pointer lock! Please report this issue.');
        };

        this.mousemove = this.mousemove1;

        window.addEventListener('keydown', this.keydown, false);
        window.addEventListener('keyup', this.keyup, false);
        window.addEventListener('mousedown', this.mousedown, false);
        window.addEventListener('mouseup', this.mouseup, false);

        document.addEventListener("mousemove", this.mousemove, false);

        document.addEventListener('pointerlockchange', this.lockChangeCb, false);
        document.addEventListener('mozpointerlockchange', this.lockChangeCb, false);
        document.addEventListener('webkitpointerlockchange', this.lockChangeCb, false);

        document.addEventListener('pointerlockerror', this.lockErrorCb, false);
        document.addEventListener('mozpointerlockerror', this.lockErrorCb, false);
        document.addEventListener('webkitpointerlockerror', this.lockErrorCb, false);

    };

    Input.prototype.updateGamepad = function () {
        var pads = this.getGamepads(), pad;
        if (!pads || pads.length === 0 || !pads[0]) { return; }

        pad = pads[0];
        if (pad.mapping === "standard") {
            this.gamepad = pad;
        } else {
            console.log("Non standard gamepad detected: " + pad.id);
        }
    };

    Input.prototype.trylockpointer = function (element) {
        if (this.pointerLocked) { return; }
        element.requestPointerLock = element.requestPointerLock || element.webkitRequestPointerLock || element.mozRequestPointerLock;
        this.exitPointerLock = document.exitPointerLock || document.webkitExitPointerLock || document.mozExitPointerLock;
        if (!element.requestPointerLock) { return false; }
        this.pointerLockElmt = element;
        element.requestPointerLock();
        return true;
    };

    Input.prototype.onescape = function () { };
    Input.prototype.onpointerlocked = function () { };
    Input.prototype.onpointerunlocked = function () { };

    Input.prototype.bind = function (what, key, name) {
        this.keybinds[name] = { what: what, key: key };

        // Init keys so that they don't have to be pressed once
        if (what === "key" || what === "mouse") {
            this.registry[what][key] = 0.0;
        }
    };

    Input.prototype.unbind = function (name) {
        delete this.keybinds[name];
    };

    Input.prototype.unbindKey = function (what, key) {
        var bindings = this.keybinds, prop;
        for (prop in bindings) {
            if (bindings.hasOwnProperty(prop) && bindings[prop].what === what && bindings[prop].key === key) {
                bindings[prop] = null;
            }
        }
    };

    Input.prototype.check = function (name) {
        var binding = this.keybinds[name], what = binding.what, key = binding.key;
        if (what === "key" || what === "mouse") {
            return this.registry[what][key];
        }
        if (what === "padkey") {
            return this.gamepad && this.gamepad.buttons[key].value;
        }
        if (what === "padaxis") {
            return this.gamepad && this.gamepad.axes[key];
        }
        if (what === "mouseaxis") {
            return this.mousepos[key];
        }
    };

    Input.prototype.resetDelta = function () {
        this.mousepos[2] = 0.0;
        this.mousepos[3] = 0.0;
    };

    return Input;
}());

var keycode = {
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pause: 19,
    capslock: 20,
    "escape": 27,
    pageup: 33,
    pagedown: 24,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    insert: 45,
    "delete": 46,
    zero: 48,
    one: 49,
    two: 50,
    three: 51,
    four: 52,
    five: 53,
    six: 54,
    seven: 55,
    eight: 56,
    nine: 57,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 70,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    leftwindow: 91,
    rightwindow: 92,
    select: 93,
    num0: 96,
    num1: 97,
    num2: 98,
    num3: 99,
    num4: 100,
    num5: 101,
    num6: 102,
    num7: 103,
    num8: 104,
    num9: 105,
    nummultiply: 106,
    numplus: 107,
    numminus: 109,
    numdot: 110,
    numdivide: 111,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    numlock: 144,
    scrolllock: 145,
    semicolon: 186,
    equals: 187,
    comma: 188,
    dash: 189,
    dot: 190,
    slash: 191,
    grave: 192,
    openparen: 219,
    backslash: 220,
    closeparen: 221,
    singleqoute: 222
};