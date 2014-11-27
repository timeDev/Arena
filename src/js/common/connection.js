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
var Signal = require('../vendor/signals'),
    key = require('./arena').peerJsKey,
    console = require('./console');

require('../vendor/peer');

function PeerInterface(peer, connection) {
    this.peer = peer;
    this.connection = connection;
    peer.on('data', this.connection.receive);
}

PeerInterface.prototype.send = function (data) {
    this.connection.send(data);
};


function ConnectionInterface(remote, connection) {
    this.remote = remote;
    this.connection = connection;
    this.receive = new Signal();
}

ConnectionInterface.prototype.send = function (data) {
    this.connection.receive(data);
};


function Connection() {
    this.target = null;
    this.message = new Signal();
}

Connection.prototype.connect = function (target) {
    if (target instanceof Connection) {
        this.target = new ConnectionInterface(target, this);
        target.accept(this);
    } else if (typeof target === 'string') {
        this.peer = new Peer({key: key});
        this.peer.on('open', function (id) {
            console.log("Connection id (client): {0}", id);
        });
        this.target = new PeerInterface(this.peer.connect(target), this);
    }
};

Connection.prototype.accept = function (target) {
    if (target instanceof Connection) {
        this.target = new ConnectionInterface(target, this);
    } else if (target instanceof DataConnection) {
        this.target = new PeerInterface(target, this);
    }
};

Connection.prototype.send = function (data) {
    if (this.target === null) {
        console.error("Cannon send data without connection!");
    } else {
        this.target.send(data);
    }
};

Connection.prototype.receive = function (data) {
    this.message.dispatch(data);
};

Connection.listen = function (id, cb) {
    var host = id === undefined ? new Peer({key: key}) : new Peer(id, {key: key});
    host.on('open', function (_id) {
    });
    host.on('connection', function (connection) {
        var conn = new Connection();
        conn.accept(connection);
        cb(conn);
    });
    return host;
};

module.exports = Connection;
module.exports.PeerInterface = PeerInterface;
module.exports.ConnectionInterface = ConnectionInterface;