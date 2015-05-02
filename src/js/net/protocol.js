/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Oskar Homburg
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

var makePacket = require('./packet'),
    packets;

exports.registerPackets = function (packetList) {
// 0:KeepAlive [S<->C] num
    packetList[0] = makePacket(['num'], 0, 'keepAlive');
// 1:PlayerDataC [S->C] pid action data
    packetList[1] = makePacket(['pid', 'action', 'data'], 1, 'playerDataC');
// 2:PlayerDataS [C->S] data pknr
    packetList[2] = makePacket(['data', 'pknr'], 2, 'playerDataS');
// 3:Logon [C->S] name
    packetList[3] = makePacket(['name'], 3, 'logon');
// 4:Chat Message [S<->C] msg
    packetList[4] = makePacket(['msg'], 4, 'chatMsg');
// 10:Spawn Object from String [S->C] id string
    packetList[10] = makePacket(['eid', 'string'], 10, 'spawnObj');
// 11:Spawn entity by name [S->C] id name meta
    packetList[11] = makePacket(['eid', 'name', 'meta'], 11, 'spawnEnt');
// 12:Update Entity [S->C] id data
    packetList[12] = makePacket(['eid', 'data'], 12, 'updateEnt');
// 13:Kill entity [S->C] id
    packetList[13] = makePacket(['eid'], 13, 'killEnt');
// 14:Spawn many [S->C] list
    packetList[14] = makePacket(['list'], 14, 'spawnMany');
// 20:Game State [S->C] state
    packetList[20] = makePacket(['state'], 20, 'gameState');

    packets = packetList;
};

exports.makePacket = function (type) {
    for (var i = 0; i < packets.length && typeof type === 'string'; i++) {
        if (packets[i] && packets[i].type === type) {
            type = packets[i].id;
            break;
        }
    }
    if (typeof type !== 'number' || !packets[type]) {
        throw "Invalid packet id: " + type;
    }
    var args = [];
    for (var j = 1; j < arguments.length; j++) {
        args[j - 1] = (arguments[j]);
    }
    return packets[type].make.apply(this, args);
};