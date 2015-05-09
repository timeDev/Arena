require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
// Polyfill and globals
if (Math.clamp === undefined) {
    Math.clamp = function (n, min, max) {
        return Math.min(Math.max(n, min), max);
    };
}

if (Math.HALF_PI === undefined) {
    Math.HALF_PI = Math.PI / 2;
}

// Thanks to Stackoverflow user fearphage
if (!String.format) {
    String.format = function (format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/\{(\d+)}/g, function (match, number) {
            return args[number] !== undefined ? args[number] : match;
        });
    };
}


var arena = require('../common/arena'),
    settings = require('../client/settings'),
    config = require('../common/config'),
    console = require('../dom/console'),
    PHYSI = require('../vendor/physi'),
    THREE = require('../vendor/three'),
    cmdEngine = require('../console/engine'),
    cmdBuiltins = require('../console/builtins'),
    overlay = require('../client/overlay-mgr');


console.log("Playing Arena version", arena.version);
if (arena.debug) {
    console.warn("Debug mode is enabled");
    window.debugging = true;
}

var game = window.game = require('../game');

config.loadCfg();

// Add common data
game.data.clientside = true;
game.data.scene = new PHYSI.Scene();
game.data.bodies = []; // ID-Body lookup
game.data.entities = []; // EntityId-BodyId lookup

game.data.server = {};
game.data.players = [];
game.data.gameState = {};
game.data.packets = [];

game.data.cameratype = "first person";
game.data.camera = new THREE.PerspectiveCamera(settings.graphics.fov, window.innerWidth / (window.innerHeight), 0.1, 1000);

// Add components
game.addComponent(game.data.protocol = require('../net/client'));
game.addComponent(require('../client/display'));
game.addComponent(require('../client/controls'));
game.addComponent(require('../phys/simulator'));
game.addComponent(require('../client/client'));
game.addComponent(require('../client/chat'));
game.addComponent(require('../client/level'));

require('../phys/scenehelper').init(game.data);
require('../common/rcon').init(game.data);
require('../common/cheat').init(game.data);
require('../common/replicated').init(game.data);
game.init();

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
}

// Add command shorthand
console.executeFn = window.c = function (str) {
    return cmdEngine.executeString(str, require('../dom/console'));
};

// Entry point
function entrypoint() {
    game.initDom();

    overlay.add('sv-startup', 'The server has not yet startet the game.<p>Please wait.');
    overlay.show('sv-startup');

    game.run();
}

if (document.readyState === 'interactive') {
    entrypoint();
} else {
    document.addEventListener('DOMContentLoaded', entrypoint);
}

},{"../client/chat":9,"../client/client":10,"../client/controls":11,"../client/display":12,"../client/level":13,"../client/overlay-mgr":14,"../client/settings":15,"../common/arena":16,"../common/cheat":17,"../common/config":18,"../common/rcon":21,"../common/replicated":22,"../console/builtins":23,"../console/engine":25,"../dom/console":29,"../game":32,"../net/client":33,"../phys/scenehelper":38,"../phys/simulator":39,"../vendor/physi":54,"../vendor/three":56}],13:[function(require,module,exports){
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
    _ = require('lodash'),
    ocl = require('../util/ocl'),
    command = require('../console/command'),
    scenehelper = require('../phys/scenehelper'),
// Local
    ids = [];

require('../common/level');

exports.spawn = function (obj, id) {
    if (!obj.pos) {
        console.warn("Skipping map object without position.");
        return;
    }
    if (obj.mesh) {
        obj.mesh.position.copy(obj.pos);
        obj.mesh.__dirtyPosition = true;
        scenehelper.add(obj.mesh, id);
        ids.push(id);
    }
};

exports.spawnFromDesc = function (desc, id) {
    ocl.load(desc, function (obj) {
        exports.spawn(obj, id);
    });
};

exports.load = function (str) {
    ocl.load(str, function (objList) {
        objList.forEach(exports.spawn);
        console.log("Level loaded");
    });
};

exports.init = _.noop;
exports.initDom = _.noop;
exports.render = _.noop;

exports.update = function (dt, data) {
    _(data.packets).where({type: 'spawnObj'}).forEach(function (pck) {
        exports.spawnFromDesc(pck.string, pck.eid);
    });

    _(data.packets).where({type: 'spawnMany'}).pluck('list').flatten().forEach(function (pck) {
        if (obj.str) {
            exports.spawnFromDesc(obj.str, obj.id);
        }
    });
};

},{"../common/level":19,"../console/command":24,"../phys/scenehelper":38,"../util/ocl":48,"lodash":6}],12:[function(require,module,exports){
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
    THREE = require('../vendor/three'),
    Stats = require('../vendor/Stats'),
    command = require('../console/command'),
    console = require('../dom/console'),
    settings = require('./settings'),
    input = require('./../util/input'),
    makeDraggable = require('../dom/draggable'),
    overlay = require('./overlay-mgr'),
// Local
    scene, renderer, light, ol, renderStats;

exports.init = function (data) {
    scene = data.scene;

    scene.add(new THREE.AmbientLight(0x404040));

    light = new THREE.PointLight(0xffffff, 1, 20);
    light.position.set(10, 10, 10);
    scene.add(light);

    renderer = new THREE.WebGLRenderer();
    // The -5 is to hide scrollbars
    renderer.setSize(window.innerWidth, window.innerHeight);

    input.pointerlocked.add(function () {
        if (overlay.active == 'pause')
            overlay.hide();
    });
    input.pointerunlocked.add(overlay.show.bind(null, 'pause'));
    input.escape.add(overlay.show.bind(null, 'pause'));

    // -- Stats --
    renderStats = new Stats();
    renderStats.domElement.style.position = 'absolute';
    renderStats.domElement.style.left = '0px';
    renderStats.domElement.style.top = '0px';

    if (settings.debug.showGrid) {
        var gridXZ = new THREE.GridHelper(100, 1),
            gridXY = new THREE.GridHelper(100, 1),
            gridYZ = new THREE.GridHelper(100, 1);

        gridXZ.setColors(0xf00000, 0xff0000);
        gridXY.setColors(0x00f000, 0x00ff00);
        gridYZ.setColors(0x0000f0, 0x0000ff);

        gridXZ.position.set(100, 0, 100);
        gridXY.position.set(100, 100, 0);
        gridYZ.position.set(0, 100, 100);

        gridXY.rotation.x = Math.HALF_PI;
        gridYZ.rotation.z = Math.HALF_PI;

        scene.add(gridXZ);
        scene.add(gridXY);
        scene.add(gridYZ);
    }

    // -- Commands --
    command("cl_refresh_vp", {}, 'cl_refresh_vp', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        data.camera.aspect = window.innerWidth / (window.innerHeight);
        data.camera.fov = settings.graphics.fov;
        data.camera.updateProjectionMatrix();
    });
};

exports.render = function (dt, data) {
    renderStats.begin();
    renderer.render(data.scene, data.camera);
    renderStats.end();
};

exports.initDom = function (data) {
    window.addEventListener('resize', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        data.camera.aspect = window.innerWidth / (window.innerHeight);
        data.camera.updateProjectionMatrix();
    });
    document.body.appendChild(renderer.domElement);

    overlay.reference = renderer.domElement;

    ol = overlay.add('pause', "<p>Click to play!<p>Use the mouse to look around, WASD to walk, SPACE to jump<p>Have fun!");

    ol.domElement.onclick = renderer.domElement.onclick = function () {
        input.trylockpointer(renderer.domElement);
    };

    makeDraggable(console.domElement);
    document.body.appendChild(console.domElement);
    document.body.appendChild(renderStats.domElement);
};

exports.update = function() {

};

},{"../console/command":24,"../dom/console":29,"../dom/draggable":30,"../vendor/Stats":51,"../vendor/three":56,"./../util/input":46,"./overlay-mgr":14,"./settings":15}],51:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 */

var Stats = function () {

	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;

	var container = document.createElement( 'div' );
	container.id = 'stats';
	container.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); setMode( ++ mode % 2 ) }, false );
	container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

	var fpsDiv = document.createElement( 'div' );
	fpsDiv.id = 'fps';
	fpsDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#002';
	container.appendChild( fpsDiv );

	var fpsText = document.createElement( 'div' );
	fpsText.id = 'fpsText';
	fpsText.style.cssText = 'color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	fpsText.innerHTML = 'FPS';
	fpsDiv.appendChild( fpsText );

	var fpsGraph = document.createElement( 'div' );
	fpsGraph.id = 'fpsGraph';
	fpsGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0ff';
	fpsDiv.appendChild( fpsGraph );

	while ( fpsGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#113';
		fpsGraph.appendChild( bar );

	}

	var msDiv = document.createElement( 'div' );
	msDiv.id = 'ms';
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;display:none';
	container.appendChild( msDiv );

	var msText = document.createElement( 'div' );
	msText.id = 'msText';
	msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	msText.innerHTML = 'MS';
	msDiv.appendChild( msText );

	var msGraph = document.createElement( 'div' );
	msGraph.id = 'msGraph';
	msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
	msDiv.appendChild( msGraph );

	while ( msGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
		msGraph.appendChild( bar );

	}

	var setMode = function ( value ) {

		mode = value;

		switch ( mode ) {

			case 0:
				fpsDiv.style.display = 'block';
				msDiv.style.display = 'none';
				break;
			case 1:
				fpsDiv.style.display = 'none';
				msDiv.style.display = 'block';
				break;
		}

	};

	var updateGraph = function ( dom, value ) {

		var child = dom.appendChild( dom.firstChild );
		child.style.height = value + 'px';

	};

	return {

		REVISION: 12,

		domElement: container,

		setMode: setMode,

		begin: function () {

			startTime = Date.now();

		},

		end: function () {

			var time = Date.now();

			ms = time - startTime;
			msMin = Math.min( msMin, ms );
			msMax = Math.max( msMax, ms );

			msText.textContent = ms + ' MS (' + msMin + '-' + msMax + ')';
			updateGraph( msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

			frames ++;

			if ( time > prevTime + 1000 ) {

				fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );
				fpsMin = Math.min( fpsMin, fps );
				fpsMax = Math.max( fpsMax, fps );

				fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';
				updateGraph( fpsGraph, Math.min( 30, 30 - ( fps / 100 ) * 30 ) );

				prevTime = time;
				frames = 0;

			}

			return time;

		},

		update: function () {

			startTime = this.end();

		}

	}

};

if ( typeof module === 'object' ) {

	module.exports = Stats;

}
},{}],30:[function(require,module,exports){
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

module.exports = function (domElement) {
    domElement.style.position = "absolute";
    domElement.style.left = "100px";
    domElement.style.top = "100px";

    var dragging, offsetX, offsetY;

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
};

},{}],11:[function(require,module,exports){
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
    _ = require('lodash'),
    input = require('../util/input'),
    keycode = require('../util/keycode'),
    THREE = require('../vendor/three'),
    PHYSI = require('../vendor/physi'),
    command = require('../console/command'),
    settings = require('./settings'),
    protocol = require('../net/client'),
    scenehelper = require('../phys/scenehelper'),
    simulator = require('../phys/simulator'),
// Local
    paused = true,
    onground = true, jumpPrg = 0,
    pitchObj = new THREE.Object3D(),
    yawObj = new THREE.Object3D(),
    vec3a = new THREE.Vector3(),
    downAxis = new THREE.Vector3(0, -1, 0),
    mesh;

exports.init = function (data) {
    if (data.cameratype === "first person") {
        exports.firstPersonCam(data.camera);
    }

    input.pointerlocked.add(function () {
        paused = false;
        input.prevent = true;
    });

    input.pointerunlocked.add(function () {
        paused = true;
        input.prevent = false;
    });

    input.escape.add(function () {
        paused = true;
        input.prevent = false;
    });

    input.bind('mouseaxis', 2, 'lookx');
    input.bind('mouseaxis', 3, 'looky');
    input.bind('key', keycode.w, 'movf');
    input.bind('key', keycode.a, 'movl');
    input.bind('key', keycode.s, 'movb');
    input.bind('key', keycode.d, 'movr');
    input.bind('key', keycode.space, 'jump');
    input.bind('mouse', 0, 'shoot');

    mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(simulator.player.radius, simulator.player.radius, simulator.player.height),
        PHYSI.createMaterial(new THREE.MeshBasicMaterial({visible: false}), 0.1, 0.0), simulator.player.mass);

    mesh.addEventListener('ready', function () {
        mesh.setAngularFactor(new THREE.Vector3(0, 0, 0));
    });

    mesh.addEventListener('collision', function (other_object, relative_velocity, relative_rotation, contact_normal) {
        // `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`
        if (contact_normal.dot(downAxis) > 0.5) {
            onground = true;
            jumpPrg = 0;
        }
    });

    mesh.add(yawObj);

    yawObj.rotation.y = 1.25 * Math.PI;

    mesh.position.set(0, 2, 0);
    scenehelper.add(mesh, 0);
    data.playermesh = mesh;
};

exports.initDom = function () {
};
exports.render = function () {
};

exports.update = function (dt, data) {
    input.updateGamepad();

    _(data.packets).where({type: 'playerDataC'}).forEach(_.partial(handlePlayerData, data));

    if (!data.gameState.started) {
        return;
    }

    var accdt = simulator.player.acc * dt;
    if (paused) {
        vec3a.set(0, 0, 0);
    } else {
        updateView();
        updateMovement();
    }

    var vel = mesh.getLinearVelocity(), changeVel = new THREE.Vector3().subVectors(vec3a, vel);
    if (changeVel.length > accdt) {
        changeVel.setLength(accdt);
    }

    changeVel.y = -40 * dt;

    if (onground === false) {
        changeVel.multiplyScalar(0.1);
    }

    if (jumpPrg < simulator.player.jumpDur && input.check('jump') > 0.2) {
        if (onground) {
            changeVel.multiplyScalar(1.2);
        }
        changeVel.y = simulator.player.simulator * dt;
        onground = false;
        jumpPrg += dt;
    }

    mesh.setLinearVelocity(vel.add(changeVel));
    sendPlayerData({p: mesh.position.toArray(), v: vel.toArray()});

    input.resetDelta();
};

function updateView() {
    yawObj.rotation.y -= input.check('lookx') * settings.mouse.sensitivityX;
    pitchObj.rotation.x -= input.check('looky') * settings.mouse.sensitivityY;
    pitchObj.rotation.x = Math.clamp(pitchObj.rotation.x, -Math.HALF_PI, Math.HALF_PI);
}

function updateMovement() {
    vec3a.set((input.check('movr') - input.check('movl')), 0, (input.check('movb') - input.check('movf')));
    if (vec3a.length() > 1) {
        vec3a.normalize();
    }
    vec3a.multiplyScalar(simulator.player.speed);
    vec3a.applyQuaternion(yawObj.quaternion);
}

var pktnr = 0,
    unackPkts = [],
    packetStat = 0;

function handlePlayerData(data, pck) {
    var pid = pck.pid, action = pck.action, pkdata = pck.data, eid;
    if (action === 0) {
        console.log('Logged on');
        data.players[pid] = 0;
    }
    if (action === 1) {
        eid = data.players[pid];
        if (eid === 0) {
            var pnr = pkdata.pnr;
            var pkt = unackPkts[pnr];
            // Only correct position as player acceleration is pretty high
            var corr = {x: pkdata.p[0] - pkt.p[0], y: pkdata.p[1] - pkt.p[1], z: pkdata.p[2] - pkt.p[2]};
            data.playermesh.position.add(corr);
            delete unackPkts[pnr];
            packetStat--;
        } else {
            scenehelper.updateBody(eid, pkdata);
        }
        if (packetStat < 1) {
            unackPkts = [];
            // Reset the counter so everyone is happy
            pktnr = 0;
        }
    }
    // Action 2 handled by cl/client
    if (action === 3) {
        data.players[pid] = undefined;
    }
}

function sendPlayerData(data) {
    protocol.send(protocol.makePacket('playerDataS', data, ++pktnr));
    unackPkts[pktnr] = data;
    packetStat++;
}

exports.firstPersonCam = function (camera) {
    pitchObj.add(camera);
    yawObj.add(pitchObj);
};

},{"../console/command":24,"../net/client":33,"../phys/scenehelper":38,"../phys/simulator":39,"../util/input":46,"../util/keycode":47,"../vendor/physi":54,"../vendor/three":56,"./settings":15,"lodash":6}],46:[function(require,module,exports){
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
    Signal = require('signals'),
// Local
    gamepad, pointerLockElmt, handlers,
    keybinds = {},
    registry = {key: {}, mouse: {}},
    pointerLocked = false,
    prevent = false,
    mousepos = [0, 0, 0, 0],
// Functions
    updateMouseMoveHandler, lockChangeCb, lockErrorCb;

// Signals
exports.escape = new Signal();
exports.pointerlocked = new Signal();
exports.pointerunlocked = new Signal();

handlers = {
    keydown: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = e.which || e.charCode || e.keyCode;
        if (e === 27) {
            exports.escape.dispatch();
        }
        registry.key[which] = 1.0;
    },
    keyup: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = e.which || e.charCode || e.keyCode;
        registry.key[which] = 0.0;
    },
    mousedown: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
        registry.mouse[which] = 1.0;
    },
    mouseup: function (e) {
        if (prevent) {
            e.preventDefault();
        }
        var which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
        registry.mouse[which] = 0.0;
    },
    mousemove1: function (e) {
        var prevX = mousepos[0], prevY = mousepos[1],
            deltaX = e.movementX || e.webkitMovementX || e.mozMovementX || prevX - e.pageX,
            deltaY = e.movementY || e.webkitMovementY || e.mozMovementY || prevY - e.pageY;
        mousepos = [e.pageX, e.pageY, mousepos[2] + deltaX, mousepos[3] + deltaY];
    },
    mousemove2: function (e) {
        var deltaX = e.movementX || e.webkitMovementX || e.mozMovementX || 0,
            deltaY = e.movementY || e.webkitMovementY || e.mozMovementY || 0;
        mousepos = [mousepos[0] + deltaX, mousepos[1] + deltaY, mousepos[2] + deltaX, mousepos[3] + deltaY];
    }
};
handlers.mousemove = handlers.mousemove1;

updateMouseMoveHandler = function () {
    document.removeEventListener("mousemove", handlers.mousemove, false);
    handlers.mousemove = pointerLocked ? handlers.mousemove2 : handlers.mousemove1;
    document.addEventListener("mousemove", handlers.mousemove, false);
};

lockChangeCb = function () {
    if (document.pointerLockElement === pointerLockElmt || document.mozPointerLockElement === pointerLockElmt || document.webkitPointerLockElement === pointerLockElmt) {
        pointerLocked = true;
        exports.pointerlocked.dispatch();
    } else {
        pointerLocked = false;
        exports.pointerunlocked.dispatch();
    }
    updateMouseMoveHandler();
};

lockErrorCb = function () {
    window.console.error('Error requesting pointer lock! Please report this issue.');
};

window.addEventListener('keydown', handlers.keydown, false);
window.addEventListener('keyup', handlers.keyup, false);
window.addEventListener('mousedown', handlers.mousedown, false);
window.addEventListener('mouseup', handlers.mouseup, false);

document.addEventListener("mousemove", handlers.mousemove, false);

document.addEventListener('pointerlockchange', lockChangeCb, false);
document.addEventListener('mozpointerlockchange', lockChangeCb, false);
document.addEventListener('webkitpointerlockchange', lockChangeCb, false);

document.addEventListener('pointerlockerror', lockErrorCb, false);
document.addEventListener('mozpointerlockerror', lockErrorCb, false);
document.addEventListener('webkitpointerlockerror', lockErrorCb, false);

// TODO: Proper polyfill
navigator.getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || function () {
    return [];
};

exports.updateGamepad = function () {
    var pads = navigator.getGamepads(), pad;
    if (!pads || pads.length === 0 || !pads[0]) {
        return;
    }

    pad = pads[0];
    if (pad.mapping === "standard") {
        gamepad = pad;
    } else {
        window.console.log("Non standard gamepad detected: " + pad.id);
    }
};

exports.trylockpointer = function (element) {
    if (pointerLocked) {
        return;
    }
    element.requestPointerLock = element.requestPointerLock || element.webkitRequestPointerLock || element.mozRequestPointerLock;
    exports.exitPointerLock = document.exitPointerLock || document.webkitExitPointerLock || document.mozExitPointerLock;
    if (!element.requestPointerLock) {
        return false;
    }
    pointerLockElmt = element;
    element.requestPointerLock();
    return true;
};

exports.bind = function (what, key, name) {
    keybinds[name] = {what: what, key: key};

    // Init keys so that they don't have to be pressed once
    if (what === "key" || what === "mouse") {
        registry[what][key] = 0.0;
    }
};

exports.unbind = function (name) {
    delete keybinds[name];
};

exports.unbindKey = function (what, key) {
    var bindings = keybinds, prop;
    for (prop in bindings) {
        if (bindings.hasOwnProperty(prop) && bindings[prop].what === what && bindings[prop].key === key) {
            bindings[prop] = null;
        }
    }
};

exports.check = function (name) {
    var binding = keybinds[name], what = binding.what, key = binding.key;
    if (what === "key" || what === "mouse") {
        return registry[what][key];
    }
    if (what === "padkey") {
        return gamepad && gamepad.buttons[key].value;
    }
    if (what === "padaxis") {
        return gamepad && gamepad.axes[key];
    }
    if (what === "mouseaxis") {
        return mousepos[key];
    }
};

exports.resetDelta = function () {
    mousepos[2] = 0.0;
    mousepos[3] = 0.0;
};

},{"signals":7}],15:[function(require,module,exports){
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
var cmdEngine = require('../console/engine');

exports.mouse = {
    sensitivityX: 2.0 / 1000,
    sensitivityY: 2.0 / 1000
};

exports.graphics = {
    fov: 75.0
};

exports.debug = {
    showGrid: true
};

cmdEngine.registerCvar('inp_mousex', exports.mouse, 'sensitivityX');
cmdEngine.registerCvar('inp_mousey', exports.mouse, 'sensitivityY');
cmdEngine.registerCvar('g_fov', exports.graphics, 'fov');
cmdEngine.registerCvar('debug_grid', exports.debug, 'showGrid');

},{"../console/engine":25}],10:[function(require,module,exports){
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
var
// Module
    _ = require('lodash'),
    command = require('../console/command'),
    Connection = require('../net/connection'),
    protocol = require('./../net/client'),
    PHYSI = require('../vendor/physi'),
    scenehelper = require('../phys/scenehelper'),
    simulator = require('../phys/simulator'),
    THREE = require('../vendor/three'),
    overlay = require('./overlay-mgr'),
    rcon = require('../common/rcon'),
    console = require('../dom/console'),
// Local
    data;

exports.playerName = "Bob";

exports.render = _.noop;
exports.initDom = _.noop;

exports.init = function (gamedata) {
    data = gamedata;
};

exports.update = function (dt, data) {
    _(data.packets).where({type: 'gameState'}).pluck('state').forEach(exports.updateGameState);

    _(data.packets).where({type: 'playerDataC', action: 2}).forEach(function (pck) {
        exports.spawnPlayer(pck.pid, pck.data);
    });

    _(data.packets).where({type: 'rconStatus'}).forEach(function (pck) {
        if (pck.action == 'auth') {
            data.rconAuth = !!data.arg;
        } else if (pck.action == 'changeCvar') {
            command.engine.setCvarNocheck(pck.arg[0], pck.arg[1]);
        } else if (pck.action == 'error') {
            console.warn(pck.arg);
        } else if (pck.action == 'cmd') {
            var err = _.attempt(function () {
                command.engine.executeString(pck.arg, console);
            });
            if (_.isError(err)) {
                console.error("[server command]", err);
            }
        } else if (pck.action == 'msg') {
            console.log('>', pck.arg);
        }
    });
};

exports.connect = function (address) {
    data.connection = new Connection();
    data.connection.message.add(protocol.receive);
    data.connection.connect(address);
    protocol.send(protocol.makePacket('logon', exports.playerName));
};

exports.spawnPlayer = function (pid, pdata) {
    var eid = pdata.id;
    data.players[pid] = eid;
    var pos = pdata.pos;
    pos = {x: pos[0], y: pos[1], z: pos[2]};
    var mesh = new PHYSI.CapsuleMesh(new THREE.CylinderGeometry(simulator.player.radius, simulator.player.radius, simulator.player.height), new THREE.MeshBasicMaterial({color: 0xc80000}), simulator.player.mass);
    mesh.position.copy(pos);
    mesh.addEventListener('ready', function () {
        mesh.setAngularFactor(new THREE.Vector3(0, 0, 0));
    });
    scenehelper.add(mesh, eid);
};

exports.updateGameState = function (state) {
    if (state.started === true && overlay.active == 'sv-startup') {
        overlay.show('pause');
    }
    if (state.started === false && overlay.active != 'sv-startup') {
        overlay.show('sv-startup');
    }

    _.assign(data.gameState, state);
};

command("connect <address>",
    {mandatory: [{name: 'address', type: 'string'}]},
    'connect',
    function (match) {
        exports.connect(match.address);
    });

command("rcon <cmd>",
    {mandatory: [{name: 'cmd', type: 'string'}]},
    'rcon', function (match) {
        rcon.execCommand(match.cmd);
    });

command("auth <pwd>",
    {mandatory: [{name: 'pwd', type: 'string'}]},
    'auth', function (match) {
        rcon.authorize(match.pwd);
    });

command.engine.registerCvar('name', exports, 'playerName');

},{"../common/rcon":21,"../console/command":24,"../dom/console":29,"../net/connection":34,"../phys/scenehelper":38,"../phys/simulator":39,"../vendor/physi":54,"../vendor/three":56,"./../net/client":33,"./overlay-mgr":14,"lodash":6}],14:[function(require,module,exports){
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
var
// Module
    makeOverlay = require('../dom/overlay'),
// Local
    overlays = {},
    active = null;

Object.defineProperty(exports, 'active', {
    get: function () {
        return active;
    }
});

exports.reference = document.body;

exports.show = function (name) {
    exports.hide();
    overlays[name].show();
    active = name;
};

exports.hide = function () {
    if (active !== null) {
        overlays[active].hide();
        active = null;
    }
};

exports.add = function (name, text, cl) {
    var ol = makeOverlay(text, cl);
    overlays[name] = ol;
    exports.reference.parentNode.insertBefore(ol.domElement, exports.reference.nextSibling);
    ol.hide();
    return ol;
};

},{"../dom/overlay":31}],31:[function(require,module,exports){
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
module.exports = function (text, cl) {
    var domElement = document.createElement('div');
    domElement.classList.add('overlay');
    if (cl) {
        domElement.classList.add(cl);
    }
    domElement.insertAdjacentHTML('afterbegin', text);
    domElement.style.height = window.innerHeight;
    domElement.style.width = window.innerWidth;

    return {
        domElement: domElement,
        hide: function () {
            domElement.style.display = 'none';
        },
        show: function () {
            domElement.style.display = 'flex';
        }
    }
};

},{}],9:[function(require,module,exports){
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

var
// Module
    _ = require('lodash'),
    keycode = require('../util/keycode'),
    protocol = require('../net/client'),
// Local
    domElement = document.createElement('div'),
    inElement = document.createElement('input'),
    outElement = document.createElement('div');

exports.init = _.noop;
exports.render = _.noop;

exports.initDom = function () {
    document.body.appendChild(domElement);
};

exports.update = function (dt, data) {
    _(data.packets).where({type: 'chatMsg'}).forEach(function (pck) {
        exports.write(pck.msg);
        exports.refresh();
    });
};

domElement.classList.add("chat-container");
inElement.classList.add("chat-input");
outElement.classList.add("chat-output");

domElement.style.position = 'absolute';
domElement.style.left = '0';
domElement.style.bottom = '0';

domElement.insertAdjacentHTML('afterbegin', "Chat<br>");
domElement.appendChild(outElement);
domElement.appendChild(inElement);

inElement.addEventListener('keypress', function (e) {
    var which = e.which || e.charCode || e.keyCode;
    if (which === keycode.enter) {
        protocol.send(protocol.makePacket('chatMsg', inElement.value));
        inElement.value = "";
    }
});

exports.write = function (str) {
    outElement.insertAdjacentHTML('beforeend', str);
    outElement.scrollTop = outElement.scrollHeight;
};

exports.refresh = function () {
    window.clearInterval(fadeId);
    window.clearTimeout(fadeWaitId);
    if (!focused) {
        fadeWaitId = _.delay(exports.fade, 3000);
    }
};

document.addEventListener('keydown', function (e) {
    var which = e.which || e.charCode || e.keyCode;
    var el = document.activeElement;
    if (el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
        el.tagName.toLowerCase() == 'textarea')) {
        // focused element is a text input or textarea
        return;
    }
    if (which === keycode.t) {
        exports.focus();
        e.preventDefault();
    }
}, false);

var focused;

exports.focus = function () {
    focused = true;
    exports.refresh();
    domElement.style.display = '';
    domElement.style.opacity = '1';
    domElement.style.filter = '';
    inElement.focus();
};

inElement.addEventListener('blur', function () {
    focused = false;
    exports.fade();
}, false);

var fadeId = -1, fadeWaitId = -1;

exports.fade = function () {
    var op = 1;  // initial opacity
    fadeId = setInterval(function () {
        if (op <= 0.05) {
            clearInterval(fadeId);
            fadeId = -1;
            domElement.style.display = 'none';
        }
        domElement.style.opacity = op;
        domElement.style.filter = "alpha(opacity=" + op * 100 + ")";
        op *= 0.95;
    }, 20);
    fadeWaitId = -1;
};

},{"../net/client":33,"../util/keycode":47,"lodash":6}],33:[function(require,module,exports){
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
    _ = require('lodash'),
    arena = require('../common/arena'),
    protocol = require('./protocol'),
// Local
    packets = [], queue = [], data;

exports.init = function (gamedata) {
    data = gamedata;
    protocol.registerPackets(packets);
    exports.makePacket = protocol.makePacket;
};
exports.initDom = _.noop;
exports.render = _.noop;

exports.receive = function (d) {
    if (arena.debug) {
        console.log("[in]", d);
    }
    var type = d[0];
    var pck = packets[type].receive(d);
    queue.push(pck);
};

exports.update = function (dt, data) {
    data.packets = queue;
    queue = [];

    handleCommon(data);
};

exports.send = function (pck) {
    packets[pck.id].send(sendRaw, pck);
};

function sendRaw(d) {
    data.connection.send(d);
    if (arena.debug) {
        console.log("[out]", d);
    }
}

function handleCommon(data) {
    // Handle all easy packets (simple response) here
    _(data.packets).where({type:'keepAlive'}).forEach(exports.send);
}

},{"../common/arena":16,"./protocol":36,"lodash":6}]},{},[1]);
