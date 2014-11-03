Arena.Console = (function () {
    'use strict';
    var Console = function () {
        var self = this, dragging, offsetX, offsetY;
        this.cvars = {};
        this.funcs = {};
        this.cvarChanged = new signals.Signal();
        this.funcInvoked = new signals.Signal();
        this.command = new signals.Signal();

        this.domElement = document.createElement('div');
        this.inElement = document.createElement('input');
        this.outElement = document.createElement('div');

        this.domElement.style.position = "absolute";
        this.domElement.style.left = "100px";
        this.domElement.style.top = "100px";
        this.domElement.style.backgroundColor = "#202020";
        this.domElement.style.padding = "10px";
        this.domElement.style.overflow = "hidden";
        this.inElement.style.backgroundColor = "#505050";
        this.inElement.style.borderWidth = "0px";
        this.inElement.style.marginTop = "10px";
        this.inElement.style.width = "100%";
        this.outElement.style.backgroundColor = "#505050";
        this.outElement.style.padding = "2px";
        this.outElement.style.fontSize = "12px";
        this.outElement.style.maxHeight = "350px";
        this.outElement.style.overflowY = "scroll";

        this.domElement.insertAdjacentHTML('afterbegin', "Console<br>");
        this.domElement.appendChild(this.outElement);
        this.domElement.appendChild(this.inElement);

        this.inElement.addEventListener('keypress', function (e) {
            var which = e.which || e.charCode || e.keyCode;
            if (which === keycode.enter) {
                self.execute(self.inElement.value);
                self.inElement.value = "";
            }
        });

        // Make the console draggable
        this.domElement.addEventListener('mousedown', function (e) {
            var rect = self.domElement.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            if (offsetY <= 26) {
                dragging = true;
                self.domElement.style.cursor = "default";
            }
        });

        window.addEventListener('mousemove', function (e) {
            if (dragging) {
                self.domElement.style.left = (e.clientX - offsetX) + "px";
                self.domElement.style.top = (e.clientY - offsetY) + "px";
                e.preventDefault();
            }
        });

        this.domElement.addEventListener('mouseup', function () {
            dragging = false;
            self.domElement.style.cursor = "";
        });
    };

    Console.prototype.registerCvar = function (name, defVal) {
        this.cvars[name] = defVal;
    };

    Console.prototype.setCvar = function (name, val) {
        var oldVal = this.cvars[name];
        this.cvars[name] = val;
        this.cvarChanged.dispatch(name, oldVal, val);
    };

    Console.prototype.getCvar = function (name) {
        return this.cvars[name];
    };

    Console.prototype.registerFunc = function (name, handler) {
        this.funcs[name] = handler;
    };

    Console.prototype.execute = function (cmd) {
        /// <param name="cmd" type="String"></param>
        var args, name, val;
        this.command.dispatch(cmd);
        args = cmd.split(' ');
        if (args.length < 1) { return; }
        name = args[0];
        if (this.funcs[name] !== undefined) {
            this.funcs[name](cmd, args);
            this.funcInvoked(name, args);
        } else if (this.cvars[name] !== undefined) {
            if (args.length === 1) {
                this.writeLine(this.getCvar(name));
            } else {
                val = args[1];
                if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                    val = parseFloat(val);
                }
                this.setCvar(name, val);
            }
        } else {
            this.writeLine("No such command: " + args[0], 'darkred');
        }
    };

    Console.prototype.write = function (str, color) {
        if (color) {
            str = '<span style="color: ' + color + '">' + str + '</span>';
        }
        this.outElement.insertAdjacentHTML('beforeend', str);
        this.outElement.scrollTop = this.outElement.scrollHeight;
    };

    Console.prototype.writeLine = function (str, color) {
        str = str || "";
        if (color) {
            str = '<span style="color: ' + color + '">' + str + '</span>';
        }
        this.outElement.insertAdjacentHTML('beforeend', str + "<br>");
        this.outElement.scrollTop = this.outElement.scrollHeight;
    };

    return Console;
}());