/**
 * Original flocking experiment. Pointer coordinates, local steering rules, and GUI settings drive a collection of triangle meshes.
 */
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';
import { MapControls } from '../../Lib/Three/MapControls.js';
import { BooleanKeyframeTrack } from 'three';
import { TubeGeometry } from 'three';
let zoom = 1;

const scene = new THREE.Scene();
let camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );

const renderer = new THREE.WebGLRenderer();
let shapes = [];


renderer.setSize( window.innerWidth, window.innerHeight * 0.95);
// Keep visual frames separate from the simulation's own update timing.
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// controls

let controls = new MapControls( camera, renderer.domElement );

controls.addEventListener( 'change', animate ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
controls.zoomToCursor = true;
controls.dampingFactor = 0.05;
// controls.zoom = 10;
// controls.zoom0 = 10;

// controls.zoomSpeed = 0.001;
controls.screenSpacePanning = true;

controls.minDistance = 100;
controls.maxDistance = 500;

// controls.maxPolarAngle = Math.PI / 10;

// const geometry = new THREE.BoxGeometry( size, size, size );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

camera.position.z = 5;

let gui = new GUI();
let mouse;
const settings = {
    numberOfBoids : 300,
    speed : 1,
    distance : 50,
    gridSizeH: window.screen.height,
    gridSizeW: window.screen.width
};
init();

const pointer = new THREE.Vector2();

window.addEventListener( 'mousemove', onPointerMove );

/**
 * Project screen coordinates into the scene so the pointer marker follows the mouse.
 *
 * @param event - Browser input event containing pointer or keyboard coordinates and state.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function onPointerMove( event ) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components   
    let pos = new THREE.Vector3();
    let vec = new THREE.Vector3();
    vec.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1.07,
        0.5,
      );
    vec.unproject( camera );
    // vec.sub( camera.position ).normalize();
        
    // var distance = - camera.position.z / vec.z;
        
    // pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
    pointer.x = vec.x;
    pointer.y = vec.y;
    // pointer.x = pos.x;
    // pointer.y = pos.y;
}

// and the rest of the code for mouse intersection or wathever



/**
 * Adjust the camera projection using the requested field-of-view change.
 *
 * @param delta - Amount added to the camera field of view.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function setCamera(delta) {
    camera.fov += delta;
    // camera.setViewOffset(window.innerWidth, window.innerHeight, window.innerWidth*zoom, window.innerHeight*zoom, 0.1, 1000);
    camera.updateProjectionMatrix()
    // camera = new THREE.PerspectiveCamera( 75, (window.innerWidth*zoom) / (window.innerHeight*zoom), 0.1, 1000 );
}



/**
 * Advance time-dependent simulation work and redraw the view on the next animation frame.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function animate() {
    computeBoids();
    mouse.position.x = pointer.x;
    mouse.position.y = pointer.y;

	renderer.render( scene, camera );
    // controls.update();
}
/**
 * Update the legacy flock using nearby boids and the configured world boundaries.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function computeBoids() {
    for (let current = 0; current < shapes.length; current++) {
        let v1 = new THREE.Vector3(0, 0, 0);
        let v2 = new THREE.Vector3(0, 0, 0);
        let v3 = 0;
        let compute = true;
        if(shapes[current].obj.position.x > settings.gridSizeW || shapes[current].obj.position.x < -settings.gridSizeW || shapes[current].obj.position.y > settings.gridSizeH || shapes[current].obj.position.y < -settings.gridSizeH) {
            shapes[current].obj.position.x = getRandomInt(settings.gridSizeH - 100);
            shapes[current].obj.position.y = getRandomInt(settings.gridSizeW - 100);
            continue;
        }
        for (let other = 0; other < shapes.length; other++) {
            if(current != other) {
                let calc = (shapes[current].obj.position.x - shapes[other].obj.position.x) + (shapes[current].obj.position.y - shapes[other].obj.position.y);
                if(calc < settings.distance && calc > -settings.distance) {
                    // rule1
                    v1.x += shapes[other].obj.position.x;
                    v1.y += shapes[other].obj.position.y;
                    // rule2
                    if (shapes[current].obj.position.x - shapes[other].obj.position.x < 1 && shapes[current].obj.position.y - shapes[other].obj.position.y < 1) {
                        v2.x = (v2.x - ((shapes[other].obj.position.x) - shapes[current].obj.position.x));
                        v2.y = (v2.y - ((shapes[other].obj.position.y) - shapes[current].obj.position.y));
                    }
                    // rule 3
                    v3 += shapes[other].velocity;
                }
            }
        }
        let a = shapes[current].obj.position.x - pointer.x;
        let b = shapes[current].obj.position.y - pointer.y;
        let calc = Math.sqrt((a*a + b*b));
        if(calc < settings.distance*2 && calc > -settings.distance*2) {
            v1.x = ((v1.x - (pointer.x)) / (shapes.length-1))/settings.speed;
            v1.y = ((v1.y - (pointer.y)) / (shapes.length-1))/settings.speed;
            v3 /= (shapes.length-1) / 8;
        } else {
            v1.x = (v1.x / (shapes.length-1))/settings.speed;
            v1.y = (v1.y / (shapes.length-1))/settings.speed;
            v3 /= (shapes.length-1) / 8;
        }
        shapes[current].obj.position.x += (v1.x + v2.x) * v3;
        shapes[current].obj.position.y += (v1.y + v2.y) * v3;
    }
}

initGui();

// Init gui
/**
 * Bind the flock settings to the GUI controls.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function initGui() {
    gui.destroy();
    gui = new GUI();
    gui.domElement.id = 'gui';
    gui.add( settings, 'numberOfBoids',[ 10, 30, 50, 70, 90, 100, 200, 300, 400, 500, 600] ).onChange(function (value) {addOrDeleteBoids();});
    gui.add( settings, 'speed');
    gui.add( settings, 'distance');
    gui.add( settings, 'gridSizeH');
    gui.add( settings, 'gridSizeW');
}

/**
 * Initialize the scene or simulation before it starts.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function init() {
    mousePointer();
    generateBoids(settings.numberOfBoids);
}

/**
 * Create the mesh used to display the pointer in the legacy flock scene.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function mousePointer() {
    const x = 0;
    const y = 0;
    const shape = new THREE.Shape();
    shape.moveTo(x - 4, y - 4);
    shape.lineTo(x + 4, y - 4);
    shape.lineTo(x, y + 4);
    const TriangleGeometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    mouse = new THREE.Mesh( TriangleGeometry, material ) ;
    mouse.position.x = 0;
    mouse.position.y = 0;
    scene.add( mouse );
}

/**
 * Choose an integer position and alternate its sign using the parity helper.
 *
 * @param max - Exclusive upper bound for the random integer magnitude.
 * @returns Integer magnitude below max with a sign chosen by parity.
 */
function getRandomInt(max) {
    let n = Math.floor(Math.random() * max);
    return n * isEven(n);
}
/**
 * Return a sign based on parity; despite the name, this returns +1 or -1.
 *
 * @param e - Integer whose parity determines the returned sign.
 * @returns Positive one for even values and negative one for odd values.
 */
function isEven(e) {
    if (e%2 == 1){
        return -1;
    } 
    return 1;
}

/**
 * Adjust the existing collection to reflect the requested flock count.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function addOrDeleteBoids() {
    if(settings.numberOfBoids > shapes.length) {
        generateBoids(settings.numberOfBoids - shapes.length);
    } else {
        for(let i = shapes.length-1; i > settings.numberOfBoids; i--) {
            scene.remove(shapes[i].obj);
            shapes.pop();
        }
    }
}

/**
 * Create triangle meshes with initial positions and velocities.
 *
 * @param n - Number of boid meshes to generate.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function generateBoids(n) {
    const shape = new THREE.Shape();
    for(let i = 0; i < n; i++) {
        const x = 0;
        const y = 0;
        shape.moveTo(x - 4, y - 4);
        shape.lineTo(x + 4, y - 4);
        shape.lineTo(x, y + 4);
        let posX = getRandomInt(settings.gridSizeH - 100);
        let posY = getRandomInt(settings.gridSizeW - 100);
        const TriangleGeometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        const mesh = new THREE.Mesh( TriangleGeometry, material ) ;
        mesh.position.x = posX;
        mesh.position.y = posY;
        shapes.push(
            {
                obj: mesh,
                velocity: 1
            });
        scene.add( mesh );
    }
}