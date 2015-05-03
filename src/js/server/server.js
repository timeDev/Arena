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
    cmdEngine = require('../console/engine'),
    arena = require('../common/arena'),
    command = require('../console/command'),
    scenehelper = require('../phys/scenehelper'),
    protocol = require('../net/server'),
    rcon = require('../common/rcon'),
// Local
    idCounter = 1,
    meshI = 0,
    gamedata;

exports.init = function (data) {
    gamedata = data;
};
exports.update = function (dt, data) {
    data.gameState.time += dt;
    // Pick Object to broadcast
    var playerMeshes = data.players.map(function (p) {
        return p.entityId;
    });
    var meshIds = game.data.scene.children.map(scenehelper.getId).filter(function (m) {
        return m > 0 && playerMeshes.indexOf(m) < 0;
    });
    if (meshIds.length > 0) {
        if (meshI >= meshIds.length) {
            meshI = 0;
        }
        var id = meshIds[meshI++];
        protocol.broadcast(protocol.makePacket('updateEnt', id, scenehelper.makeUpdatePacket(id)));
    }

    for (var i = 0; i < data.packets.length; i++) {
        var pck = data.packets[i], player = pck.player;
        if (pck.type == 'playerDataS') {
            player.updateBody(pck.data);
            protocol.broadcast(protocol.makePacket('playerDataC', player.playerId, 1, {
                p: player.mesh.position.toArray(),
                v: player.mesh.getLinearVelocity().toArray(),
                pnr: pck.pknr
            }));
        } else if (pck.type == 'logon') {
            player.name = pck.name;
            protocol.send(player, protocol.makePacket('playerDataC', player.playerId, 0, {}));
            protocol.send(player, protocol.makePacket('spawnMany', data.mapState));
            for (var j = 0; j < data.players.length; j++) {
                var player2 = data.players[j];
                protocol.send(player2, protocol.makePacket('playerDataC', player.playerId, 2, {
                    id: player.entityId,
                    pos: player.mesh.position.toArray()
                }));
                protocol.send(player, protocol.makePacket('playerDataC', player2.playerId, 2, {
                    id: player2.entityId,
                    pos: player2.mesh.position.toArray()
                }));
            }
            protocol.send(player, protocol.makePacket('gameState', data.gameState));
            data.players.push(player);
            scenehelper.add(player.mesh, player.entityId);
        } else if (pck.type == 'chatMsg') {
            var origMsg = pck.msg;
            var playerName = player.name;
            var msg = playerName + ": " + origMsg + "<br>";
            // TODO: filter event exploits
            protocol.broadcast(exports.makePacket('chatMsg', msg));
        } else if (pck.type == 'rconRequest') {
            if (pck.action == 'auth') {
                rcon.authorize(pck.arg, player);
            } else if (pck.action == 'cmd') {
                if (player.privilege > 0) {
                    exports.executeCommand(pck.arg);
                } else {
                    protocol.send(player, protocol.makePacket('rconStatus', 'error', "Not authorized"));
                }
            } else if (pck.action == 'changeCvar') {
                if (player.privilege > 0) {
                    cmdEngine.setCvar(pck.arg[0], pck.arg[1]);
                } else {
                    protocol.send(player, protocol.makePacket('rconStatus', 'error', "Not authorized"));
                }
            }
        }
    }
};

exports.newId = function () {
    return idCounter++;
};

exports.getServerStatusMsg = function () {
    return String.format("Running version {0} | {1} player(s) | Running for {2}s", arena.version, gamedata.players.length, gamedata.gameState.time);
};

exports.executeCommand = null;

exports.matchesRconPassword = function (pwd) {
    // TODO: Make password configurable
    return pwd === "banana";
};

exports.getCvarList = function (/*admin*/) {
    var reg = cmdEngine.getRegistry();
    var list = [];
    for (var k in reg) {
        if (reg.hasOwnProperty(k) && reg[k].type === 'cvar') {
            list.push([k, reg[k].getter()]);
        }
    }
    return list;
};

exports.getCvar = function (name) {
    return commands.getCvar(name, 'sv');
};

exports.execute = function (cmd) {
    return commands.execute(cmd, 'sv');
};

command("tpa <x> <y> <z>", {
    mandatory: [{name: 'x', type: 'number'}, {name: 'y', type: 'number'}, {name: 'z', type: 'number'}]
}, 'tpa', function (match) {
    gamedata.players.forEach(function (p) {
        p.teleport(match.x, match.y, match.z);
    });
});

command("status", {}, 'status', function () {
    this.log(exports.getServerStatusMsg());
});
