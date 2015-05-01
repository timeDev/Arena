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
