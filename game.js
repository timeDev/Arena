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

var Clock = require('../util/clock'),
    settings = require('../common/settings'),
    controls = require('../client/controls'),
    simulator = require('../phys/simulator'),
    cmdEngine = require('../console/engine'),
    cmdBuiltins = require('../console/builtins'),
    scenemgr = require('../client/scene-manager'),
    arena = require('../common/arena'),
    console = require('../dom/console');

require('../client/rcon');

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

if (!cmdBuiltins.registered) {
    console.warn("Built-in commands have not been registered!");
}

// Add command shorthand
console.executeFn = window.c = function (str) {
    return cmdEngine.executeString(str, window.console);
};

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

    display.render();

    Clock.startNew(16, update);
}

if (document.readyState === 'interactive') {
    entrypoint();
} else {
    document.addEventListener('DOMContentLoaded', entrypoint);
}
},{"../client/controls":5,"../client/display":6,"../client/rcon":8,"../client/scene-manager":9,"../common/arena":10,"../common/settings":13,"../console/builtins":14,"../console/engine":16,"../dom/console":21,"../phys/simulator":28,"../util/clock":32}],8:[function(require,module,exports){
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
    command = require('../console/command'),
    cmdEngine = require('../console/engine'),
    protocol = require('./../net/client'),
    console = require('../dom/console'),
// Local
    cvarCache;

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
        cmdEngine.executeString(cmd, window.console);
    }
};

exports.cacheCvars = function () {
    cvarCache = {};
    protocol.sendRconQueryAll();
};

exports.execute = function (str) {
    protocol.sendRconCommand(str);
};

exports.setCvar = function (name, value) {
    protocol.sendRconCommand(name, value);
};

exports.getCvar = function (name) {
    // Refresh even if we already know it
    protocol.sendRconQuery(name);
    return cvarCache[name];
};

command("rcon auth <pwd> | status | cmd <cmd>", [{
    mandatory: [{name: 'mode', type: 'value', value: 'auth'},
        {name: 'pwd', type: 'string'}]
}, {
    mandatory: [{name: 'mode', type: 'value', value: 'status'}]
}, {
    mandatory: [{name: 'mode', type: 'value', value: 'cmd'},
        {name: 'cmd', type: 'string'}]
}], 'rcon', function (match) {
    if (match.matchI === 0) {
        protocol.sendRconAuthorize(match.pwd);
    } else if (match.matchI === 1) {
        protocol.sendRconStatus();
    } else if (match.matchI === 2) {
        protocol.sendRconCommand(match.cmd);
    }
});

},{"../console/command":15,"../console/engine":16,"../dom/console":21,"./../net/client":24}],6:[function(require,module,exports){
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
    settings = require('../common/settings'),
    chat = require('../dom/chat'),
    input = require('./../util/input'),
    makeDraggable = require('../dom/draggable'),
    makeOverlay = require('../dom/overlay'),
// Local
    scene, camera, renderer, overlay,
// Function
    render, start;

// -- Setup --
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(settings.graphics.fov, window.innerWidth / (window.innerHeight), 0.1, 1000);

scene.add(new THREE.AmbientLight());

renderer = new THREE.WebGLRenderer();
// The -5 is to hide scrollbars
renderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.updateProjectionMatrix();
});
document.body.appendChild(renderer.domElement);

overlay = makeOverlay("<p>Click to play!<p>Use the mouse to look around, WASD to walk, SPACE to jump<p>Have fun!");

input.pointerlocked.add(overlay.hide);
input.pointerunlocked.add(overlay.show);
input.escape.add(overlay.show);

overlay.domElement.onclick = function () {
    input.trylockpointer(overlay.domElement);
};
document.body.appendChild(overlay.domElement);

makeDraggable(console.domElement);
document.body.appendChild(console.domElement);

document.body.appendChild(chat.domElement);

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
command("cl_refresh_vp", {}, 'cl_refresh_vp', function (match) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.fov = settings.graphics.fov;
    camera.updateProjectionMatrix();
});

},{"../common/settings":13,"../console/command":15,"../dom/chat":20,"../dom/console":21,"../dom/draggable":22,"../dom/overlay":23,"../vendor/Stats":37,"../vendor/three":40,"./../util/input":33}],37:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
    input = require('./../util/input'),
    keycode = require('./../util/keycode'),
    THREE = require('../vendor/three'),
    CANNON = require('../vendor/cannon'),
    settings = require('../common/settings'),
    command = require('../console/command'),
    protocol = require('./../net/client'),
    materials = require('../phys/materials'),
// Local
    paused = true, shape, physBody,
    onground = false, jumpPrg = Infinity,
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

exports.update = function (dt) {
    input.updateGamepad();

    var accdt = settings.player.acc * dt;
    if (paused) {
        vec3a.set(0, 0, 0);
    } else {
        yawObj.rotation.y -= input.check('lookx') * settings.mouse.sensitivityX;
        pitchObj.rotation.x -= input.check('looky') * settings.mouse.sensitivityY;
        pitchObj.rotation.x = Math.clamp(pitchObj.rotation.x, -Math.HALF_PI, Math.HALF_PI);

        vec3a.set((input.check('movr') - input.check('movl')), 0, (input.check('movb') - input.check('movf')));
        if (vec3a.length() > 1) {
            vec3a.normalize();
        }
        vec3a.multiplyScalar(settings.player.speed);
        vec3a.applyQuaternion(yawObj.quaternion);
    }

    var vel = physBody.velocity, changeVel = new THREE.Vector3().subVectors(vec3a, vel);
    if (changeVel.length > accdt) {
        changeVel.setLength(accdt);
    }

    changeVel.y = -1;

    if (onground === false) {
        changeVel.multiplyScalar(0.1);
    }

    if (jumpPrg < settings.player.jumpDur && input.check('jump') > 0.2) {
        if (onground) {
            changeVel.multiplyScalar(1.2);
        }
        changeVel.y = settings.player.jumpVel;
        onground = false;
        jumpPrg += dt;
    }

    physBody.velocity.vadd(changeVel, physBody.velocity);
    protocol.sendPlayerData({p: physBody.position.toArray(), v: physBody.velocity.toArray()});
    yawObj.position.copy(physBody.position);

    input.resetDelta();
};

physBody = new CANNON.Body({mass: settings.player.mass});
shape = new CANNON.Sphere(settings.player.radius);
physBody.addShape(shape);
physBody.material = materials.playerMaterial;
physBody.fixedRotation = true;
physBody.updateMassProperties();

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
        jumpPrg = 0;
    }
});

yawObj.rotation.y = 1.25 * Math.PI;

exports.physBody = physBody;
exports.sceneObj = yawObj;

exports.firstPersonCam = function (camera) {
    pitchObj.add(camera);
    yawObj.add(pitchObj);
};

},{"../common/settings":13,"../console/command":15,"../phys/materials":27,"../vendor/cannon":38,"../vendor/three":40,"./../net/client":24,"./../util/input":33,"./../util/keycode":34}],33:[function(require,module,exports){
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

},{"signals":3}],24:[function(require,module,exports){
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
    client = require('./../client/client'),
    simulator = require('../phys/simulator'),
    chat = require('../dom/chat'),
// Local
    receivers = [];

exports.receive = function (d) {
    if (arena.debug) {
        console.log("[in]", d);
    }
    var type = d[0];
    receivers[type](d);
};

function sendRaw(d) {
    client.connection.send(d);
    if (arena.debug) {
        console.log("[out]", d);
    }
}

// KeepAlive 0 num S<>C

receivers[0] = exports.receiveKeepAlive = function (d) {
    // Send it right back
    sendRaw(d);
};

// PlayerData 1 playerId type data S>C
//            1 data pktnr C>S
// Types:
// 0 = welcome, 1 = position
// 2 = connect, 3 = disconnect

var pktnr = 0,
    unackPkts = [];

exports.sendPlayerData = function (data) {
    sendRaw([1, data, ++pktnr]);
    unackPkts[pktnr] = data;
};

receivers[1] = exports.receivePlayerData = function (d) {
    var eid, pid = d[1], type = d[2], data = d[3];
    if (type === 0) {
        client.players[pid] = 0;
    }
    if (type === 1) {
        eid = client.players[pid];
        var pcktcount = unackPkts.filter(function (e) {
            return e !== undefined;
        }).length;
        if (eid === 0) {
            var pnr = data.pnr;
            var pkt = unackPkts[pnr];
            // Only correct position as player acceleration is pretty high
            var corr = {x: data.p[0] - pkt.p[0], y: data.p[1] - pkt.p[1], z: data.p[2] - pkt.p[2]};
            // Avoid cyclic deps
            var controls = require('./../client/controls');
            //noinspection JSCheckFunctionSignatures
            controls.physBody.position.vadd(corr, controls.physBody.position);
            controls.sceneObj.position.copy(controls.physBody.position);
            delete unackPkts[pnr];
        } else {
            simulator.updateBody(eid, data);
        }
        if (pcktcount < 1) {
            unackPkts = [];
            // Reset the counter so everyone is happy
            pktnr = 0;
        }
    }
    if (type === 2) {
        client.spawnPlayer(pid, data);
    }
    if (type === 3) {
        client.players[pid] = undefined;
    }
};

// Logon 3 name C>S

exports.sendLogon = function (name) {
    sendRaw([3, name]);
};

// Chat Message 4 msg C<>S

chat.submitFn = exports.sendChatMsg = function (str) {
    sendRaw([4, str]);
};

receivers[4] = exports.receiveChatMsg = function (d) {
    chat.refresh();
    chat.write(d[1]);
};

// === Entities ===

// Spawn object from string 10 id string S>C

receivers[10] = exports.receiveSpawnObject = function (d) {
    // Avoid cyclic dependency -> load module in function
    require('./../client/level').spawnFromDesc(d[2], d[1]);
};

// Spawn entity by name 11 id name meta S>C

receivers[11] = exports.receiveSpawnEntity = function (d) {
    throw 'Not implemented';
};

// Update entity by id 12 id meta S>C

receivers[12] = exports.receiveUpdateEntity = function (d) {
    if (d[2].ph) {
        simulator.updateBody(d[1], d[2].ph);
    }
};

// Kill entity by id 13 id S>C

receivers[13] = exports.receiveKillEntity = function (d) {
    simulator.remove(d[1]);
};

// Spawn many 14 list
// list: array of {id,str/name,meta}

receivers[14] = exports.receiveSpawnMany = function (d) {
    for (var i = 0; i < d[1].length; i++) {
        var obj = d[1][i];
        if (obj.str) {
            require('./../client/level').spawnFromDesc(obj.str, obj.id);
        }
    }
};

// RCON protocol
// rcon status 200 - C>S | msg S>C
// rcon error 201 msg S>C
// rcon command 202 str C>S
// rcon query 203 cvarname C>S
// rcon cvar 204 cvarname value S>C
// rcon reversecmd (sent by server, must not be questioned) 205 cmd S>C
// rcon authorize 206 password C>S
// rcon queryall 207 C>S
// rcon consolemessage 208 msg S>C
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

receivers[208] = exports.receiveRconMessage = function (d) {
    rconHandler.status(d[1]);
};

exports.sendRconStatus = function () {
    sendRaw([200]);
};

exports.sendRconCommand = function (str) {
    sendRaw([202, str]);
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

},{"../common/arena":10,"../dom/chat":20,"../phys/simulator":28,"./../client/client":4,"./../client/controls":5,"./../client/level":7}],20:[function(require,module,exports){
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
    keycode = require('../util/keycode'),
// Local
    domElement = document.createElement('div'),
    inElement = document.createElement('input'),
    outElement = document.createElement('div');

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
        exports.submitFn(inElement.value);
        inElement.value = "";
    }
});

exports.submitFn = null;

exports.domElement = domElement;

exports.write = function (str) {
    outElement.insertAdjacentHTML('beforeend', str);
    outElement.scrollTop = outElement.scrollHeight;
};

exports.refresh = function () {
    window.clearInterval(fadeId);
    window.clearTimeout(fadeWaitId);
    if (!focused) {
        fadeWaitId = window.setTimeout(exports.fade, 3000);
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

},{"../util/keycode":34}],7:[function(require,module,exports){
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
    ocl = require('../util/ocl'),
    scenemgr = require('./scene-manager'),
    command = require('../console/command'),
    Sexhr = require('../vendor/SeXHR'),
// Local
    ids = [];

require('../common/level');

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

},{"../common/level":11,"../console/command":15,"../util/ocl":35,"../vendor/SeXHR":36,"./scene-manager":9}],4:[function(require,module,exports){
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
    command = require('../console/command'),
    Connection = require('../net/connection'),
    protocol = require('./../net/client'),
    CANNON = require('../vendor/cannon'),
    settings = require('../common/settings'),
    THREE = require('../vendor/three'),
    scenemgr = require('./scene-manager'),
    materials = require('../phys/materials');

exports.connection = null;

exports.connect = function (address) {
    exports.connection = new Connection();
    exports.connection.message.add(protocol.receive);
    exports.connection.connect(address);
    protocol.sendLogon("Bob");
};

// Maps player ids to entity ids
exports.players = [];

exports.spawnPlayer = function (pid, data) {
    var eid = data.id;
    exports.players[pid] = eid;
    var pos = data.pos;
    pos = {x: pos[0], y: pos[1], z: pos[2]};
    var body = new CANNON.Body({mass: settings.player.mass});
    body.addShape(new CANNON.Sphere(settings.player.radius));
    body.material = materials.playerMaterial;
    body.fixedRotation = true;
    body.updateMassProperties();
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(settings.player.radius), new THREE.MeshBasicMaterial({color: 0xc80000}));
    mesh.position.copy(pos);
    scenemgr.addToScene(mesh, eid);
    body.position.copy(pos);
    scenemgr.addToWorld(body, eid);
};

command("connect <address>",
    {mandatory: [{name: 'address', type: 'string'}]},
    'connect',
    function (match) {
        exports.connect(match.address);
    });

},{"../common/settings":13,"../console/command":15,"../net/connection":25,"../phys/materials":27,"../vendor/cannon":38,"../vendor/three":40,"./../net/client":24,"./scene-manager":9}],9:[function(require,module,exports){
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
    simulator = require('../phys/simulator'),
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

},{"../phys/simulator":28}]},{},[1]);
