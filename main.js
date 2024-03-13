import * as THREE from 'three';
import * as dat from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass';
import * as CameraUtils from 'three/addons/utils/CameraUtils.js';

import { etchingShader } from '/etchingShader.js';
import { FirstPersonControlsCustom } from '/FirstPersonControlsCustom.js';
import { architecturalFeatures } from './architecturalFeatures';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer(); renderer.setSize(window.innerWidth, window.innerHeight)

let controls = new FirstPersonControlsCustom(camera, renderer.domElement);
let composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) ); 
let gtaoPass = new GTAOPass( scene, camera, window.innerWidth, window.innerHeight);
gtaoPass.blendIntensity = 1.0;
gtaoPass.scale = 1.0;
gtaoPass.output = GTAOPass.OUTPUT.Default;
composer.addPass( gtaoPass ); // note gtao happens after the render pass, so it's using the render pass output including the etching shader, so the gtao pass is adding unfair shading to the etching shader
composer.addPass( new OutputPass() );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize the background music but don't play it yet
let menuMusic = new Audio('/public/menu-music.mp3');
menuMusic.loop = true; // The music will loop
menuMusic.preload = 'auto'; // Preload the audio
menuMusic.volume = 0.5; // Set the initial volume

// Flag to keep track of user interaction with the "Play Game" button
let canPlayMusic = false;

document.addEventListener('DOMContentLoaded', function() {
  const playGameButton = document.getElementById('playGame');
  const menuContainer = document.querySelector('.menu-container');

  playGameButton.addEventListener('click', function() {
    menuContainer.classList.add('menu-hidden'); // Hide the menu
    canPlayMusic = true; // Set the flag to true as user has interacted
    // Here you can initialize your game or handle transitions
    // and play a different audio if needed for the game starting
  });

  // Volume control listener
  document.getElementById('volumeSlider').addEventListener('input', function(event) {
    if (canPlayMusic) { // Only adjust volume if music play has been enabled
      menuMusic.volume = event.target.value;
    }
  });
});

// Toggle the menu with the "E" key
document.addEventListener('keydown', function(event) {
  if (event.key === "e" || event.key === "E") {
    const menuContainer = document.querySelector('.menu-container');
    if (menuContainer.classList.contains('menu-hidden')) {
      menuContainer.classList.remove('menu-hidden');
      // Only play the menu music if the "Play Game" button has been clicked
      if (canPlayMusic) {
        menuMusic.play().catch(e => console.error("Error playing audio:", e));
      }
    } else {
      menuContainer.classList.add('menu-hidden');
      menuMusic.pause();
    }
  }
});

// ------------------- Portal -------------------
const planeGeo = new THREE.PlaneGeometry( 100.1, 100.1 );
const portalPlane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0.0 );
let portalCamera = new THREE.PerspectiveCamera( 45, 1.0, 0.1, 500.0 );
scene.add( portalCamera );
// let portalCameraHelper = new THREE.CameraHelper( portalCamera ); scene.add( portalCameraHelper );
let bottomLeftCorner = new THREE.Vector3();
let bottomRightCorner = new THREE.Vector3();
let topLeftCorner = new THREE.Vector3();
let reflectedPosition = new THREE.Vector3();

const renderTargetResolution = 512;
let leftPortalTexture = new THREE.WebGLRenderTarget( renderTargetResolution, renderTargetResolution );
let leftPortal = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { map: leftPortalTexture.texture } ) );
let leftPortalFrame = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { color: 0x00ffff, side: THREE.FrontSide } ) );
leftPortalFrame.scale.set( 1.03, 1.03, 1.03 );
leftPortalFrame.position.z = -.1;
leftPortal.add( leftPortalFrame );
leftPortal.position.x = 2;
leftPortal.position.y = 2;
leftPortal.position.z = -3;
leftPortal.rotateY( 0. );
leftPortal.scale.set( 0.03, 0.03, 0.03 );
scene.add( leftPortal );

let rightPortalTexture = new THREE.WebGLRenderTarget( renderTargetResolution, renderTargetResolution );
let rightPortal = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { map: rightPortalTexture.texture } ) );
let rightPortalFrame = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.FrontSide } ) );
rightPortalFrame.scale.set( 1.03, 1.03, 1.03 );
rightPortalFrame.position.z = -.1;
rightPortal.add( rightPortalFrame );
rightPortal.position.x = -2;
rightPortal.position.y = 2;
rightPortal.position.z = -3;
rightPortal.rotateY( 0. );
rightPortal.scale.set( 0.03, 0.03, 0.03 );
scene.add( rightPortal );

function renderPortal( thisPortalMesh, otherPortalMesh, thisPortalTexture ) {


    leftPortalFrame.visible = false; rightPortalFrame.visible = false; // hide the portal frames from their own rendering
    // set the portal camera position to be reflected about the portal plane
    thisPortalMesh.worldToLocal( reflectedPosition.copy( camera.position ) );
    reflectedPosition.x *= - 1.0; reflectedPosition.z *= - 1.0;
    otherPortalMesh.localToWorld( reflectedPosition );
    portalCamera.position.copy( reflectedPosition );

    // grab the corners of the other portal
    // - note: the portal is viewed backwards; flip the left/right coordinates
    otherPortalMesh.localToWorld( bottomLeftCorner.set( 50.05, - 50.05, 0.0 ) );
    otherPortalMesh.localToWorld( bottomRightCorner.set( - 50.05, - 50.05, 0.0 ) );
    otherPortalMesh.localToWorld( topLeftCorner.set( 50.05, 50.05, 0.0 ) );
    // set the projection matrix to encompass the portal's frame
    CameraUtils.frameCorners( portalCamera, bottomLeftCorner, bottomRightCorner, topLeftCorner, false );

    // render the portal
    thisPortalTexture.texture.colorSpace = renderer.outputColorSpace;
    renderer.setRenderTarget( thisPortalTexture );
    renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897
    if ( renderer.autoClear === false ) renderer.clear();
    thisPortalMesh.visible = false; // hide this portal from its own rendering
    renderer.render( scene, portalCamera );
    thisPortalMesh.visible = true; // re-enable this portal's visibility for general rendering
    leftPortalFrame.visible = true; rightPortalFrame.visible = true; // unhide the portal frames

}

// ------------------- Assets -------------------
const generatedBlankTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); // white texture
let sculptureTexture = new THREE.TextureLoader().load('/spirit_of_life_sculpture/Textures/material_0_baseColor.jpeg');
const etchingShaderDeepCopy = JSON.parse(JSON.stringify(etchingShader))
let sculptureMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy, clippingPlanes: [ portalPlane ], clipShadows: true, clipping: true, clipIntersection: true});
sculptureMaterial.uniforms.posCamVsUV.value = 1.0;
sculptureMaterial.uniforms.tilingFactor.value = 100.0;
sculptureMaterial.uniforms.texture1.value = sculptureTexture;
console.log(sculptureMaterial)
const loader = new GLTFLoader();
loader.load('/spirit_of_life_sculpture/scene.gltf', async function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.traverse((child) => {
        // if (child.isMesh) {child.material = new THREE.MeshBasicMaterial({ map: child.material.map });}
        if (child.isObject3D) {child.position.set(0, 0, 0);}
    });
    const sculptureScale = 1.0;
    gltf.scene.scale.set(sculptureScale, sculptureScale, sculptureScale);
    gltf.scene.rotation.y = Math.PI / 2;
    gltf.scene.traverse((child) => {
        if (child.isMesh) {child.material = sculptureMaterial;}
    });
    handleResize();
}, undefined, function (error) {console.error('error', error);});

// const textureLessEtchingMaterial = sculptureMaterial.clone();
const textureLessEtchingDeepCopy = JSON.parse(JSON.stringify(etchingShader));
const textureLessEtchingMaterial = new THREE.ShaderMaterial(textureLessEtchingDeepCopy);
textureLessEtchingMaterial.uniforms.texture1.value = generatedBlankTexture;
textureLessEtchingMaterial.uniforms.tilingFactor.value = 160.0;
textureLessEtchingMaterial.uniforms.posCamVsUV.value = 0.0;
let cube = new THREE.Mesh(new THREE.BoxGeometry(), textureLessEtchingMaterial);
const sphereMat = textureLessEtchingMaterial.clone();
sphereMat.uniforms.tilingFactor.value = 100.0;
sphereMat.uniforms.posCamVsUV.value = 1.0;
let sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), sphereMat);
let torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 32, 100), textureLessEtchingMaterial);
let groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), textureLessEtchingMaterial);
groundPlane.rotation.x = -Math.PI / 2;
scene.add(groundPlane);

cube.position.x = -3
torus.position.x = 3
sphere.position.y = 5

scene.add(cube);
scene.add(sphere);
scene.add(torus);

camera.position.z = 3.2;
camera.position.y = .2;
camera.position.x = 1.1;

let sunlight = new THREE.DirectionalLight(0xffffff, .3);
scene.add(sunlight);
renderer.setClearColor(0x032288, 1);

architecturalFeatures(scene);

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
} 
window.addEventListener('resize', handleResize);

function animate() {
    requestAnimationFrame(animate);
    const rotSpeed = 0.005;
    cube.rotation.x += rotSpeed;
    cube.rotation.y += rotSpeed;
    sphere.rotation.x += rotSpeed;
    sphere.rotation.y += rotSpeed;
    torus.rotation.x += rotSpeed;
    torus.rotation.y += rotSpeed;

    // rightPortal.rotateY(0.01);

    etchingShader.uniforms.time.value += 0.05;
    const delta = 0.1;
    controls.update(delta);

    const currentRenderTarget = renderer.getRenderTarget();
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    // render the portal effect
    renderPortal( leftPortal, rightPortal, leftPortalTexture );
    renderPortal( rightPortal, leftPortal, rightPortalTexture );

    // restore the original rendering properties
    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget( currentRenderTarget );

    // portalCameraHelper.update();

    composer.render();
}
animate();

function setupGUI() {
    let gui = new dat.GUI();
// gui.add(etchingShader.uniforms.tilingFactor, 'value', 0, 300).name('Tiling Factor');
// gui.add(etchingShader.uniforms.posCamVsUV, 'value', 0, 1).name('PosCamVsUV');
// gui.add(etchingShader.uniforms.dirLight1.value, 'x', -1, 1).name('Light1 X');
// gui.add(etchingShader.uniforms.dirLight1.value, 'y', -1, 1).name('Light1 Y');
// gui.add(etchingShader.uniforms.dirLight1.value, 'z', -1, 1).name('Light1 Z');
// gui.add(etchingShader.uniforms.dirLight2.value, 'x', -1, 1).name('Light2 X');
// gui.add(etchingShader.uniforms.dirLight2.value, 'y', -1, 1).name('Light2 Y');
// gui.add(etchingShader.uniforms.dirLight2.value, 'z', -1, 1).name('Light2 Z');
gui.add({ autoRotate: false }, 'autoRotate').onChange((value) => {
    if (value) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
    } else {
        controls.autoRotate = false;
    }
});
// gui.add(etchingShader.uniforms.lightFactor, 'value', 0, 4.0).name('Light Factor');
// gui.add(etchingShader.uniforms.textureFactor, 'value', 0, 2.).name('Texture Factor')
// gui.add(etchingShader.uniforms.rampFactor, 'value', 0, 2.).name('Ramp Factor')
// gui.add(etchingShader.uniforms.gamma, 'value', 0, 2.).name('Gamma Factor')
// gui.add(etchingShader.uniforms.angleFactor, 'value', 0, 2.).name('Angle Factor')
// gui.add(etchingShader.uniforms.theta, 'value', 0, 6.28).name('Theta Factor')
// gui.add(etchingShader.uniforms.angleClampDivisor, 'value', 0, 100.).name('Angle Clamp Divisor')

gui.add( gtaoPass, 'output', {
    'Default': GTAOPass.OUTPUT.Default,
    'Diffuse': GTAOPass.OUTPUT.Diffuse,
    'AO Only': GTAOPass.OUTPUT.AO,
    'AO Only + Denoise': GTAOPass.OUTPUT.Denoise,
    'Depth': GTAOPass.OUTPUT.Depth,
    'Normal': GTAOPass.OUTPUT.Normal
} ).onChange( function ( value ) {
    console.log(gtaoPass, value)
    gtaoPass.output = parseInt( value );

} );
const aoParameters = {
    radius: 0.25,
    distanceExponent: 1.,
    thickness: 1.,
    scale: 1.,
    samples: 16,
    distanceFallOff: 1.,
    screenSpaceRadius: false,
};
gtaoPass.updateGtaoMaterial( aoParameters );
// gui.add( gtaoPass, 'blendIntensity' ).min( 0 ).max( 1 ).step( 0.01 );
// gui.add( aoParameters, 'radius' ).min( 0.01 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
// gui.add( aoParameters, 'distanceExponent' ).min( 1 ).max( 4 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
// gui.add( aoParameters, 'thickness' ).min( 0.01 ).max( 10 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
// gui.add( aoParameters, 'distanceFallOff' ).min( 0 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
// gui.add( aoParameters, 'scale' ).min( 0.01 ).max( 2.0 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
// gui.add( aoParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );

gui.add(controls, 'deadZone').min(0.).max(1000.).step(0.01).name('Dead Zone');
}
setupGUI();