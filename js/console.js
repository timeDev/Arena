define(['vendor/signals', 'keycode'], function (signals, keycode) {
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
        /// <field name="cvarChanged" type="signals.Signal">Dispatched when any cvar is changed. Arguments: name, old value, new value</field>
        cvarChanged: new signals.Signal(),
        /// <field name="funcInvoced" type="signals.Signal">Dispatched when any command function is invoked. Arguments: name, args array</field>
        funcInvoked: new signals.Signal(),
        /// <field name="command" type="signals.Signal">Dispatched when any command is executed. Args: command string</field>
        command: new signals.Signal(),
        /// <field name="domElement" type="HTMLDivElement">The DOM display element for the console.</field>
        domElement: domElement,
        /// <field name="w" type="Console">Shorthand for window.console</field>
        w: window.console,

        execute: function (cmd) {
            /// <param name="cmd" type="String">The command to execute. Multiple commands can be executed, seperated by semicolons.</param>
            if (cmd.indexOf(';') >= 0) {
                var cmdList = cmd.split(';');
                cmdList.forEach(this.execute, this);
                return;
            }
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

        registerCvar: function (name, value) {
            /// <summary>Registers a console variable (cvar) with the given name and value.</summary>
            /// <signature>
            /// <param name="name" type="String">The identifier of the cvar.</param>
            /// <param name="value" type="Object">The initial value of the cvar.</param>
            /// </signature>
            /// <signature>
            /// <param name="name" type="String">The identifier of the cvar.</param>
            /// <param name="value" type="Function">A function that will get the cvar when called
            /// without arguments and set the cvar when called with the value as the only argument.</param>
            /// </signature>
            cvars[name] = value;
        },

        setCvar: function (name, val) {
            /// <summary>Sets the cvar with the given name to the given value.</summary>
            /// <param name="name" type="String">The identifier of the cvar.</param>
            /// <param name="val" type="Object">The new value to assign to the cvar.</param>
            var fn, oldVal, newVal;
            if (typeof cvars[name] === 'function') {
                fn = cvars[name];
                oldVal = fn();
                fn(val);
                newVal = fn();
                this.cvarChanged.dispatch(name, oldVal, newVal);
            } else {
                oldVal = cvars[name];
                cvars[name] = val;
                this.cvarChanged.dispatch(name, oldVal, val);
            }
        },

        getCvar: function (name) {
            /// <summary>Returns the value of the cvar with the given name.</summary>
            /// <param name="name" type="String">The identifier of the cvar.</param>
            /// <returns type="Object">The value of the cvar with the given name.</returns>
            return typeof cvars[name] === 'function' ? cvars[name]() : cvars[name];
        },

        registerFunc: function (name, handler) {
            /// <summary>Registers a console command.</summary>
            /// <param name="name" type="String">The command name.</param>
            /// <param name="handler" type="Function">A function that will be called when the command is executed.</param>
            funcs[name] = handler;
        },

        log: function () {
            /// <summary>Logs a formatted string to the console.</summary>
            var str = String.format.apply(null, arguments);
            this.writeLine(str);
            // Mirror output to web console
            window.console.log(str);
        },

        warn: function () {
            /// <summary>Writes a formatted warning string to the console in yellow.</summary>
            var str = String.format.apply(null, arguments);
            this.writeLine(str, 'yellow');
            // Mirror output to web console
            window.console.warn(str);
        },

        error: function () {
            /// <summary>Writes a formatted error string to the console in red.</summary>
            var str = String.format.apply(null, arguments);
            this.writeLine(str, 'red');
            // Mirror console output to web console
            window.console.error(str);
        },

        write: function (str, color) {
            /// <summary>Writes a colored string to the console.</summary>
            /// <param name="str" type="String">A string.</param>
            /// <param name="color" type="String" optional="true">A css color.</param>
            if (color) {
                str = '<span style="color: ' + color + '">' + str + '</span>';
            }
            outElement.insertAdjacentHTML('beforeend', str);
            outElement.scrollTop = outElement.scrollHeight;
        },

        writeLine: function (str, color) {
            /// <summary>Writes a colored string to the console, followed by a line break.</summary>
            /// <param name="str" type="String">A string.</param>
            /// <param name="color" type="String" optional="true">A css color.</param>
            str = str || "";
            if (color) {
                str = '<span style="color: ' + color + '">' + str + '</span>';
            }
            outElement.insertAdjacentHTML('beforeend', str + "<br>");
            outElement.scrollTop = outElement.scrollHeight;
        },

        getCfgString: function () {
            /// <summary>Returns a command string that will set
            /// all cvars to the current values when executed.</summary>
            var str = "";
            for (var key in cvars) {
                if (cvars.hasOwnProperty(key)) {
                    str = str.concat(key, " ", this.getCvar(key), ";");
                }
            }
        }
    };

    return module;
});