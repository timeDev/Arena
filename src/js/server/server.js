/*global require, module, exports */
var // Module
    Connection = require('../common/connection'),
    protocol = require('./protocol'),
    simulator = require('../common/simulator').make(),
    console = require('../common/console'),
// Local
    connections = [];

exports.connect = function (c) {
    connections.push(c);
};

exports.update = function (time) {
    simulator.update(time);
};

exports.exectute = function (cmd) {
    console.execute(cmd);
};
