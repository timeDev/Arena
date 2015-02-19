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
command("cl_refresh_vp", {}, 'cl_refresh_vp', function (match) {
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    camera.aspect = window.innerWidth / (window.innerHeight - 5);
    camera.fov = settings.graphics.fov;
    camera.updateProjectionMatrix();
});
