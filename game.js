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
        return format.replace(/\{(\d+)\}/g, function (match, number) {
            return args[number] !== undefined ? args[number] : match;
        });
    };
}

var Clock = require('../common/clock'),
    settings = require('../common/settings'),
    controls = require('../client/controls'),
    simulator = require('../common/simulator'),
    commands = require('../common/commands'),
    level = require('../client/level'),
// Load rcon after level to avoid issues with cyclic deps
    rcon = require('../client/rcon'),
    scenemgr = require('../client/scene-manager'),
    protocol = require('../client/protocol'),
    arena = require('../common/arena'),
    client = require('../client/client'),
    console = require('../dom/console');

console.log("Playing Arena version {0}", arena.version);
if (arena.debug) {
    console.warn("Debug mode is enabled");
    window.debugging = true;
}

function update(time) {
    controls.update(time);
    simulator.update(time);
    scenemgr.copyWorldToScene();
}

settings.api.init();

protocol.clientInterface = {
    spawnFromDesc: level.spawnFromDesc
};

// Add command shorthand
console.executeFn = window.c = function (str) {
    return commands.execute(str, 'cl');
};

commands.register(level.commands);
commands.register(controls.commands);
commands.register(rcon.commands);
commands.register(client.commands);

// Entry point
function entrypoint() {
    var display = require('../client/display');

    scenemgr.init(display.scene);

    controls.firstPersonCam(display.camera);
    controls.sceneObj.position.set(0, 2, 0);
    controls.physBody.position.set(0, 2, 0);
    controls.physBody.linearDamping = 0.95;
    display.scene.add(controls.sceneObj);
    simulator.add(controls.physBody, 0);

    commands.register(display.commands);

    display.render();

    Clock.startNew(16, update);
}

if (document.readyState === 'interactive') {
    entrypoint();
} else {
    document.addEventListener('DOMContentLoaded', entrypoint);
}
},{"../client/client":5,"../client/controls":6,"../client/display":7,"../client/level":10,"../client/protocol":11,"../client/rcon":12,"../client/scene-manager":13,"../common/arena":14,"../common/clock":15,"../common/commands":16,"../common/settings":21,"../common/simulator":22,"../dom/console":23}],10:[function(require,module,exports){
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
    ocl = require('../common/ocl'),
    scenemgr = require('./scene-manager'),
    commands = require('../common/commands'),
    Sexhr = require('../vendor/SeXHR'),
// Local
    ids = [];

require('../common/level');
require('./rcon');

exports.load = function () {
    throw "deprecated";
};

exports.spawn = function (obj, id) {
    if (!obj.pos) {
        console.warn("Skipping map object without position.");
        return;
    }
    if (obj.mesh) {
        obj.mesh.position.copy(obj.pos);
        ids.push(scenemgr.addToScene(obj.mesh, id));
    }
    if (obj.body) {
        obj.body.position.copy(obj.pos);
        ids.push(scenemgr.addToWorld(obj.body, id));
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

exports.commands = {};

exports.commands.lv_clear = {
    isCvar: false,
    name: 'lv_clear',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate([], args);
        exports.clear();
    }
};

exports.commands.lv_load = {
    isCvar: false,
    name: 'lv_load',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        new Sexhr().req({
            url: args[1],
            done: function (err, res) {
                if (err) {
                    throw err;
                }
                exports.load(res.text);
            }
        });
    }
};

exports.commands.lv_spawn = {
    isCvar: false,
    name: 'lv_spawn',
    ctx: {cl: commands.contexts.rcon, sv: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        try {
            ocl.load(args[1], exports.spawn);
        } catch (e) {
            console.error("Error parsing JSON!");
        }
    }
};

},{"../common/commands":16,"../common/level":18,"../common/ocl":19,"../vendor/SeXHR":29,"./rcon":12,"./scene-manager":13}],13:[function(require,module,exports){
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
    simulator = require('../common/simulator'),
// Local
    sceneObjects = [],
    worldObjects = [];

exports.init = function (scene) {
    exports.scene = scene;
};

exports.addToScene = function (obj, id) {
    obj.tracker = {id: id, type: "scene"};
    exports.scene.add(obj);
    sceneObjects[id] = obj;
};

exports.addToWorld = function (obj, id) {
    obj.tracker = {id: id, type: "world"};
    simulator.add(obj, id);
    worldObjects[id] = obj;
};

exports.addLink = function (s, w) {
    this.addToScene(s);
    this.addToWorld(w);
    this.link(s, w);
};

exports.copyWorldToScene = function () {
    var i, w, s;
    for (i = 0; i < worldObjects.length; i++) {
        if (worldObjects[i] !== undefined && sceneObjects[i] !== undefined) {
            w = worldObjects[i];
            s = sceneObjects[i];
            s.position.copy(w.position);
            s.quaternion.copy(w.quaternion);
        }
    }
};

exports.copySceneToWorld = function () {
    var i, s, w;
    for (i = 0; i < sceneObjects.length; i++) {
        if (sceneObjects[i] !== undefined && worldObjects[i] !== undefined) {
            s = worldObjects[i];
            w = sceneObjects[i];
            w.position.copy(s.position);
            w.quaternion.copy(s.quaternion);
        }
    }
};

exports.remove = function (id) {
    var s = sceneObjects[id];
    exports.scene.remove(s);
    simulator.remove(id);
    delete sceneObjects[id];
    delete worldObjects[id];
};

},{"../common/simulator":22}],12:[function(require,module,exports){
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
/*global require, module, exports:true */
var
// Module
    commands = require('../common/commands'),
    protocol = require('./protocol'),
    console = require('../dom/console'),
// Local
    cvarCache;

commands.contexts.rcon = exports = module.exports = commands.makeContext();

protocol.rconHandler = {
    status: function (msg) {
        console.log(msg);
    },
    error: function (msg) {
        console.warn(msg);
    },
    cvar: function (name, value) {
        cvarCache[name] = value;
    },
    command: function (cmd) {
        // Execute command as server
        commands.execute(cmd, 'sv');
    }
};

exports.cacheCvars = function () {
    cvarCache = {};
    protocol.sendRconQueryAll();
};

exports.execute = function (cmd, args) {
    protocol.sendRconCommand(cmd.name, args);
};

exports.setCvar = function (name, value) {
    protocol.sendRconCommand(name, [value]);
};

exports.getCvar = function (name) {
    // Refresh even if we already know it
    protocol.sendRconQuery(name);
    return cvarCache[name];
};

exports.commands = {};

exports.commands.rcon = {
    isCvar: false,
    name: 'rcon',
    ctx: {cl: commands.contexts.host},
    handler: function (args) {
        if (args[1] === "status") {
            protocol.sendRconStatus();
        } else if (args[1] === "auth") {
            protocol.sendRconAuthorize(args[2]);
        } else {
            throw "Usage: rcon status | rcon auth <pwd>";
        }
    }
};

},{"../common/commands":16,"../dom/console":23,"./protocol":11}],7:[function(require,module,exports){
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
    THREE = require('three'),
    Stats = require('../vendor/Stats'),
    commands = require('../common/commands'),
    console = require('../dom/console'),
    settings = require('../common/settings'),
    input = require('./input'),
    makeDraggable = require('../dom/draggable'),
// Local
    scene, camera, renderer,
// Function
    render, start;

// -- Setup --
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(settings.graphics.fov, window.innerWidth / (window.innerHeight - 5), 0.1, 1000);

renderer = new THREE.WebGLRenderer();
// The -5 is to hide scrollbars
renderer.setSize(window.innerWidth, window.innerHeight - 5);
renderer.domElement.onclick = function () {
    input.trylockpointer(renderer.domElement);
};
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    camera.aspect = window.innerWidth / (window.innerHeight - 5);
    camera.updateProjectionMatrix();
});
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight());

makeDraggable(console.domElement);
document.body.appendChild(console.domElement);

// -- Stats --
var renderStats = new Stats();
renderStats.domElement.style.position = 'absolute';
renderStats.domElement.style.left = '0px';
renderStats.domElement.style.top = '0px';
document.body.appendChild(renderStats.domElement);

render = function () {
    window.requestAnimationFrame(render);
    renderStats.begin();
    renderer.render(scene, camera);
    renderStats.end();
};

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

exports.scene = scene;
exports.render = render;
exports.camera = camera;

// -- Commands --
exports.commands = {};
exports.commands.cl_refresh_vp = {
    isCvar: false,
    name: 'cl_refresh_vp',
    ctx: {cl: commands.contexts.host},
    handler: function (args) {
        commands.api.validate([], args);
        renderer.setSize(window.innerWidth, window.innerHeight - 5);
        camera.aspect = window.innerWidth / (window.innerHeight - 5);
        camera.fov = settings.graphics.fov;
        camera.updateProjectionMatrix();
    }
};

},{"../common/commands":16,"../common/settings":21,"../dom/console":23,"../dom/draggable":24,"../vendor/Stats":30,"./input":8,"three":4}],30:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
    input = require('./input'),
    keycode = require('./keycode'),
    THREE = require('three'),
    CANNON = require('../vendor/cannon'),
    settings = require('../common/settings'),
    commands = require('../common/commands'),
    protocol = require('./protocol'),
// Local
    paused = true, shape, physBody,
    onground = false,
    pitchObj = new THREE.Object3D(), yawObj = new THREE.Object3D(),
    vec3a = new THREE.Vector3(), contactNormal = new CANNON.Vec3(),
    upAxis = new CANNON.Vec3(0, 1, 0);

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

exports.update = function () {
    input.updateGamepad();
    if (paused === true) {
        input.resetDelta();
        yawObj.position.copy(physBody.position);
        return;
    }

    yawObj.rotation.y -= input.check('lookx') * settings.mouse.sensitivityX;
    pitchObj.rotation.x -= input.check('looky') * settings.mouse.sensitivityY;
    pitchObj.rotation.x = Math.clamp(pitchObj.rotation.x, -Math.HALF_PI, Math.HALF_PI);

    vec3a.set((input.check('movr') - input.check('movl')) * settings.player.speed, 0, (input.check('movb') - input.check('movf')) * settings.player.speed);
    vec3a.applyQuaternion(yawObj.quaternion);

    var vel = physBody.velocity, changeVel = new THREE.Vector3().subVectors(vec3a, vel);
    changeVel.x = Math.clamp(changeVel.x, -settings.player.maxAcc, settings.player.maxAcc);
    changeVel.y = -1;
    changeVel.z = Math.clamp(changeVel.z, -settings.player.maxAcc, settings.player.maxAcc);

    if (onground === false) {
        changeVel.multiplyScalar(0.1);
    }

    if (onground && input.check('jump') > 0.2) {
        changeVel.y = settings.player.jumpVel;
        onground = false;
    }

    physBody.velocity.vadd(changeVel, physBody.velocity);
    protocol.sendUpdatePlayer({p: physBody.position.toArray(), v: physBody.velocity.toArray()});
    yawObj.position.copy(physBody.position);

    input.resetDelta();
};

physBody = new CANNON.Body({mass: settings.player.mass});
shape = new CANNON.Sphere(settings.player.radius);
physBody.addShape(shape);

physBody.addEventListener('collide', function (e) {
    var contact = e.contact;

    // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
    // We do not yet know which one is which! Let's check.
    if (contact.bi.id === physBody.id) { // bi is the player body, flip the contact normal
        contact.ni.negate(contactNormal);
    } else {
        contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
    }
    // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
    if (contactNormal.dot(upAxis) > 0.5) { // Use a "good" threshold value between 0 and 1 here!
        onground = true;
    }
});

yawObj.rotation.y = 1.25 * Math.PI;

exports.physBody = physBody;
exports.sceneObj = yawObj;

exports.firstPersonCam = function (camera) {
    pitchObj.add(camera);
    yawObj.add(pitchObj);
};

exports.commands = {};
exports.commands.tp = {
    isCvar:false,
    name:'tp',
    ctx:{'cl':commands.contexts.host},
    handler: function (args) {
        commands.validate(['number', 'number', 'number'], args);
        exports.physBody.position.set(args[0], args[1], args[2]);
        exports.sceneObj.position.set(args[0], args[1], args[2]);
    }
};

},{"../common/commands":16,"../common/settings":21,"../vendor/cannon":31,"./input":8,"./keycode":9,"./protocol":11,"three":4}],11:[function(require,module,exports){
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
    arena = require('../common/arena'),
    client = require('./client'),
    simulator = require('../common/simulator'),
// Local
    cli,
    receivers = [];

Object.defineProperty(exports, 'clientInterface', {
    get: function () {
        return cli;
    },
    set: function (val) {
        cli = val;
    }
});

exports.receive = function (d) {
    if (arena.debug) {
        console.log(d);
    }
    var type = d[0];
    receivers[type](d);
};

function sendRaw(d) {
    client.connection.send(d);
}

// KeepAlive 0 num S<>C

receivers[0] = exports.receiveKeepAlive = function (d) {
    // Send it right back
    sendRaw(d);
};

// UpdatePlayer 1 state S<>C

exports.sendUpdatePlayer = function (state) {
    sendRaw([1, state]);
};

receivers[1] = exports.receiveUpdatePlayer = function (d) {
    simulator.updateBody(0, d[1]);
};

// SpawnObject 2 desc id S>C

receivers[2] = exports.receiveSpawnObject = function (d) {
    cli.spawnFromDesc(d[1], d[2]);
};

// RCON protocol
// rcon status 200 - C>S | msg S>C
// rcon error 201 msg S>C
// rcon command 202 cmd args C>S
// rcon query 203 cvarname C>S
// rcon cvar 204 cvarname value S>C
// rcon reversecmd (sent by server, must not be questioned) 205 cmd S>C
// rcon authorize 206 password C>S
// rcon queryall 207 C>S
// Important: messages are not encrypted! Do not reuse the rcon password
// for things like email and stuff! Someone getting into your server
// should not be a big deal, as you can easily restart it via ssh or whatever

var rconHandler;
Object.defineProperty(exports, 'rconHandler', {
    get: function () {
        return rconHandler;
    },
    set: function (val) {
        rconHandler = val;
    }
});

receivers[200] = exports.receiveRconStatus = function (d) {
    rconHandler.status(d[1]);
};

receivers[201] = exports.receiveRconError = function (d) {
    rconHandler.error(d[1]);
};

receivers[204] = exports.receiveRconCvar = function (d) {
    if (arena.debug) {
        console.log("RCON response:", d[1], d[2]);
    }
    rconHandler.cvar(d[1], d[2]);
};

receivers[205] = exports.receiveRconRevCmd = function (d) {
    if (arena.debug) {
        console.log("Server command:", d[1]);
    }
    rconHandler.command(d[1]);
};

exports.sendRconStatus = function () {
    sendRaw([200]);
};

exports.sendRconCommand = function (cmd, args) {
    sendRaw([202, cmd, args]);
};

exports.sendRconQuery = function (cvar) {
    sendRaw([203, cvar]);
};

exports.sendRconAuthorize = function (pwd) {
    sendRaw([206, pwd]);
};

exports.sendRconQueryAll = function () {
    sendRaw([207]);
};

},{"../common/arena":14,"../common/simulator":22,"./client":5}],8:[function(require,module,exports){
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
    updateMouseMoveHandler, lockChangeCb, lockErrorCb,
    bind, unbind, check;

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

},{"signals":3}],5:[function(require,module,exports){
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
    commands = require('../common/commands'),
    Connection = require('../common/connection');

exports.connection = null;

exports.connect = function (address) {
    exports.connection = new Connection();
    exports.connection.connect(address);
};

exports.commands = {};

exports.commands.connect = {
    isCvar: false,
    name: 'connect',
    ctx: {cl: commands.contexts.host},
    handler: function (args) {
        commands.validate(['string'], args);
        exports.connect(args[1]);
    }
};

},{"../common/commands":16,"../common/connection":17}]},{},[1]);
