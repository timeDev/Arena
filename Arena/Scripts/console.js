define(['lib/signals', 'keycode'], function (signals, keycode) {
    'use strict';
    var dragging, offsetX, offsetY, module,
        cvars = {},
        funcs = {},
        domElement = document.createElement('div'),
        inElement = document.createElement('input'),
        outElement = document.createElement('div');

    domElement.style.position = "absolute";
    domElement.style.left = "100px";
    domElement.style.top = "100px";
    domElement.style.backgroundColor = "#202020";
    domElement.style.padding = "10px";
    domElement.style.overflow = "hidden";
    inElement.style.backgroundColor = "#505050";
    inElement.style.borderWidth = "0px";
    inElement.style.marginTop = "10px";
    inElement.style.width = "100%";
    outElement.style.backgroundColor = "#505050";
    outElement.style.padding = "2px";
    outElement.style.fontSize = "12px";
    outElement.style.maxHeight = "350px";
    outElement.style.overflowY = "scroll";

    domElement.insertAdjacentHTML('afterbegin', "Console<br>");
    domElement.appendChild(outElement);
    domElement.appendChild(inElement);

    inElement.addEventListener('keypress', function (e) {
        var which = e.which || e.charCode || e.keyCode;
        if (which === keycode.enter) {
            module.execute(inElement.value);
            inElement.value = "";
        }
    });

    // Make the console draggable
    domElement.addEventListener('mousedown', function (e) {
        var rect = domElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        if (offsetY <= 26) {
            dragging = true;
            domElement.style.cursor = "default";
        }
    });

    window.addEventListener('mousemove', function (e) {
        if (dragging) {
            domElement.style.left = (e.clientX - offsetX) + "px";
            domElement.style.top = (e.clientY - offsetY) + "px";
            e.preventDefault();
        }
    });

    domElement.addEventListener('mouseup', function () {
        dragging = false;
        domElement.style.cursor = "";
    });

    module = {
        cvarChanged: new signals.Signal(),
        funcInvoked: new signals.Signal(),
        command: new signals.Signal(),
        domElement: domElement,
        // Shorthand for window.console
        w: window.console,

        execute: function (cmd) {
            /// <param name="cmd" type="String"></param>
            var args, name, val;
            this.command.dispatch(cmd);
            args = cmd.split(' ');
            if (args.length < 1) { return; }
            name = args[0];
            if (funcs[name] !== undefined) {
                funcs[name](cmd, args);
                this.funcInvoked.dispatch(name, args);
            } else if (cvars[name] !== undefined) {
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
        },

        registerCvar: function (name, defVal) {
            cvars[name] = defVal;
        },

        setCvar: function (name, val) {
            var oldVal = cvars[name];
            cvars[name] = val;
            this.cvarChanged.dispatch(name, oldVal, val);
        },

        getCvar: function (name) {
            return cvars[name];
        },

        registerFunc: function (name, handler) {
            funcs[name] = handler;
        },

        log: function () {
            var str = String.format.apply(null, arguments);
            this.writeLine(str);
            // Mirror output to web console
            window.console.log(str);
        },

        warn: function () {
            var str = String.format.apply(null, arguments);
            this.writeLine(str, 'yellow');
            // Mirror output to web console
            window.console.warn(str);
        },

        error: function () {
            var str = String.format.apply(null, arguments);
            this.writeLine(str, 'red');
            // Mirror console output to web console
            window.console.error(str);
        },

        write: function (str, color) {
            if (color) {
                str = '<span style="color: ' + color + '">' + str + '</span>';
            }
            outElement.insertAdjacentHTML('beforeend', str);
            outElement.scrollTop = outElement.scrollHeight;
        },

        writeLine: function (str, color) {
            str = str || "";
            if (color) {
                str = '<span style="color: ' + color + '">' + str + '</span>';
            }
            outElement.insertAdjacentHTML('beforeend', str + "<br>");
            outElement.scrollTop = outElement.scrollHeight;
        }
    };

    return module;
});