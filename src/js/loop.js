/*global require, module, exports */
var // Module
    signals = require('./vendor/signals'),
    // Local
    rtime, rid, render,
    utime, uid, update,
    // Function
    renderloop, updateloop;

renderloop = function () {
    var now = Date.now();
    rid = window.requestAnimationFrame(renderloop);
    render.dispatch((now - rtime) / 1000.0);
    rtime = now;
};

updateloop = function () {
    var now = Date.now();
    update.dispatch((now - utime) / 1000.0);
    utime = now;
};

render = new signals.Signal();
update = new signals.Signal();

module.exports = {
    render: render,
    update: update,

    start: function () {
        rtime = utime = Date.now();
        rid = window.requestAnimationFrame(renderloop);
        uid = window.setInterval(updateloop, 1000 / 60);
    },
    stop: function () {
        window.cancelAnimationFrame(rid);
        window.clearInterval(uid);
    },
    renderloop: renderloop,
    updateloop: updateloop
};
