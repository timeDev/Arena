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
    Connection = require('../common/connection'),
    protocol = require('./protocol'),
    simulator = require('../common/simulator').make(),
    commands = require('../common/commands'),
    Clock = require('../common/clock'),
    Player = require('./player'),
    arena = require('../common/arena'),
    level = require('./level'),
// Local
    conListener, svCmdCtx,
    players = [],
    idCounter = 1;

exports.newId = function () {
    return idCounter++;
};

level.simulator = simulator;
level.newIdFn = exports.newId;

protocol.players = players;

svCmdCtx = commands.makeContext();

commands.register(svCmdCtx, level.commands);

exports.connect = function (c) {
    var player = new Player(c, simulator);
    if (arena.debug) {
        console.log('[server]', 'player connected:', player);
    }
    players.push(player);
    c.message.add(protocol.receive.bind(null, player));
    simulator.add(player.body, player.entityId);
};

exports.update = function (time) {
    simulator.update(time);
};

exports.execute = function (cmd) {
    commands.execute(cmd);
};

exports.start = function () {
    conListener = Connection.listen('id', exports.connect);
    Clock.startNew(16, exports.update);
};

exports.shutdown = function () {
    players = [];
    conListener.destroy();
    conListener = null;
};
