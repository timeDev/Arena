/*global require, module, exports */
function Clock(period, callback, thisArg) {
    this.period = period;
    this.callback = callback;
    this.id = -1;
    this.thisArg = thisArg;
}

function loopfn(self) {
    var ts = Date.now();
    return function () {
        var now = Date.now(), dt = (now - ts) / 1000.0;
        self.callback.call(self.thisArg, dt);
        ts = now;
    }
}

Clock.prototype.start = function () {
    this.id = setInterval(loopfn(this), this.period);
};

Clock.prototype.stop = function () {
    clearInterval(this.id);
};

Clock.startNew = function (period, callback, thisArg) {
    var obj = new Clock(period, callback, thisArg);
    obj.start();
    return obj;
};

module.exports = Clock;
