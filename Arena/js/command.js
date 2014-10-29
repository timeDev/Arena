var Console = (function () {
    'use strict';
    var Console = function () {
        this.cvars = {};
        this.funcs = {};
        this.cvarChanged = new signals.Signal();
        this.funcInvoked = new signals.Signal();
        this.command = new signals.Signal();


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
        var args, name, val, floatVal;
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
                if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(val)) {
                    //
                }
                this.setCvar(name, val);
            }
        }
    };

    Console.prototype.write = function (str) {

    };

    Console.prototype.writeLine = function (str) {
        str = str || "";
        this.write(str + '\n');
    };

    return Console;
}());