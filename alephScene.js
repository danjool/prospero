import * as THREE from 'three';
import { alephLineShader } from './alephLineShader.js';
import * as dat from 'dat.gui';

// the plan is to create a scene with an instance mesh of n instances of a ShaderMaterial built from custom vertex and frag shaders, 
// shading like a line geometry, for now just let the shaders be very typical, for the line geometry that gets instanceded
// pass a random color to each instance and a random 'offset'

const pointsPerLine = 10000;
const numLines = 800;

const alephLineMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xff00ff) },
        colorsArray: { value: new Float32Array( numLines * 3 ) }, // will show up in the shader as a uniform float array
        // uniform float colorsArray[20]; // where 20 is numLines * 3 bc each color is 3 floats
        t: { value: 0 },
    },
    vertexShader: alephLineShader.vertexShader,
    fragmentShader: alephLineShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
});

// create a geometry
let lineGeometry = new THREE.BufferGeometry();
let points = [];
let point = new THREE.Vector3( 0, 0, 0);
let direction = new THREE.Vector3(1, 1, 1);
direction.normalize().multiplyScalar( 1.0 );

const randomness = .0018;
points.push( point.x, point.y, point.z );

for ( let i = 0; i < pointsPerLine; i ++ ) {
    direction.x += (Math.random() - 0.5) * randomness;
    direction.y += (Math.random() - 0.5) * randomness;
    direction.z += (Math.random() - 0.5) * randomness;
    direction.normalize().multiplyScalar( .005 );
    point.add( direction );
    points.push( point.x, point.y, point.z );
}
const indices = new Uint16Array( pointsPerLine );
for ( let i = 0; i < pointsPerLine; i ++ ) {
    indices[i] = i;
}
lineGeometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
// indices may be accessed in the vertex shader as gl_VertexID, 
// which is a built-in variable that holds the index of the vertex being processed
// out of the total number of vertices in the draw call,  gl_VerticesIn
lineGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( points, 3 ) );

function createAlephScene() {
    const alephGUI = new dat.GUI();
    alephGUI.add( alephLineMaterial.uniforms.t, 'value', 0, 1 ).name('t');

    const scene = new THREE.Scene();
    const line = new THREE.Line( lineGeometry, alephLineMaterial );
    line.computeLineDistances();

    for ( let i = 0; i < numLines; i ++ ) {
        const randColor = new THREE.Color();
        randColor.setHSL( Math.random(), 1.0, 0.5 );
        
        // const lineInstance = line.clone();
        const lineInstance = new THREE.Line( lineGeometry, 
            new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: randColor },
                    colorsArray: { value: new Float32Array( numLines * 3 ) }, // will show up in the shader as a uniform float array
                    // uniform float colorsArray[20]; // where 20 is numLines * 3 bc each color is 3 floats
                    t: { value: 0 },
                },
                vertexShader: alephLineShader.vertexShader,
                fragmentShader: alephLineShader.fragmentShader,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true,
            }) );
        lineInstance.position.x = 0
        lineInstance.position.y = 1.0
        lineInstance.position.z = -12.5
        lineInstance.rotation.x = Math.random() * Math.PI * 2.;
        lineInstance.rotation.y = Math.random() * Math.PI * 2.;
        lineInstance.rotation.z = Math.random() * Math.PI * 2.;
        // lineInstance.scale.x = lineInstance.scale.y = lineInstance.scale.z = Math.random() * 2;
        // set the lineInstance's shader mat's uniforms' color to a random color
        // populate the colorsArray uniform with random colors
        const color = new THREE.Color();
        color.setHSL( Math.random(), 1.0, i/numLines );
        lineInstance.material.uniforms.color.value = color; // this is just overwriting the color uniform of the original line material

        scene.add( lineInstance );
    }

    scene.add( line );
    // how to get access to the line material of the line instance outside of this func, so it can be updated?
    // i'm already returning scene, so i can't return the line material as well

    // A: you can return an object with the scene and the line material
    // return { scene, alephLineMaterial };

    // or after import and creation, alephScene.findObjectByName('lineMaterial').uniforms.t.value = 0.5;

    return scene;
}

export { createAlephScene };