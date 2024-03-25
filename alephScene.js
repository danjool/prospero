import * as THREE from 'three';
import { alephLineShader } from './alephLineShader.js';
import * as dat from 'dat.gui';

// the plan is to create a scene with an instance mesh of n instances of a ShaderMaterial built from custom vertex and frag shaders, 
// shading like a line geometry, for now just let the shaders be very typical, for the line geometry that gets instanceded
// pass a random color to each instance and a random 'offset'

const pointsPerLine = 40000;
const numLines = 800;

const alephLineMaterial = new THREE.ShaderMaterial({
    uniforms: {
        // random color
        color: { value:  new THREE.Color( 0xff0000 )
        },
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

// points.push( point.x, point.y, point.z );
// const randomness = .0018;

var randomness = 2.5;
points.push( point.x, point.y, point.z );

for ( var i = 0; i < 40000; i ++ ) {

    direction.x += (Math.random() - 0.5) * randomness;
    direction.y += (Math.random() - 0.5) * randomness;
    direction.z += (Math.random() - 0.5) * randomness;
    direction.normalize().multiplyScalar( 10 );
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
// set the Color attribute
const colors = new Float32Array( numLines * 3 );
for ( let i = 0; i < numLines; i ++ ) {
    const color = new THREE.Color();
    color.setHSL( Math.random(), 1.0, i/numLines );
    color.toArray( colors, i * 3 );
}
lineGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

function createAlephScene() {
    const alephGUI = new dat.GUI();
    alephGUI.add( alephLineMaterial.uniforms.t, 'value', 0, 1 ).name('t');

    const scene = new THREE.Scene();
    const line = new THREE.Line( lineGeometry, alephLineMaterial );
    line.computeLineDistances();

    for ( let i = 0; i < numLines; i ++ ) {
        const randColor = new THREE.Color();
        randColor.setHSL( Math.random(), 1.0, 0.5 ).getHex();
        
        // const lineInstance = line.clone();
        const lineInstance = new THREE.Line( lineGeometry, 
            new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: randColor },
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
        lineInstance.position.z = -4.5
        const s= 0.0001;
        lineInstance.scale.set( s, s, s);
        lineInstance.rotation.x = Math.random() * Math.PI * 2.;
        lineInstance.rotation.y = Math.random() * Math.PI * 2.;
        lineInstance.rotation.z = Math.random() * Math.PI * 2.;
        // lineInstance.scale.x = lineInstance.scale.y = lineInstance.scale.z = Math.random() * 2;
        // set the lineInstance's shader mat's uniforms' color to a random color
        const color = new THREE.Color();
        color.setHSL( Math.random()*.1, 1.0, i/numLines );
        lineInstance.material.uniforms.color.value = color; // this is just overwriting the color uniform of the original line material

        // add scene helper
        // scene.add( new THREE.ArrowHelper( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, 0 ), 1, 0x00ff00 ) );
        scene.add( lineInstance );
    }

    console.log('alephLineMaterial', alephLineMaterial, line)
    scene.add( line );
    // how to get access to the line material of the line instance outside of this func, so it can be updated?
    // i'm already returning scene, so i can't return the line material as well

    // A: you can return an object with the scene and the line material
    // return { scene, alephLineMaterial };

    // or after import and creation, alephScene.findObjectByName('lineMaterial').uniforms.t.value = 0.5;
    const sceneScale = 10.0;
    scene.scale.set(    sceneScale, sceneScale, sceneScale );
    return scene;
}

export { createAlephScene };