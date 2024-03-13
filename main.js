import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass';
import * as CameraUtils from 'three/addons/utils/CameraUtils.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { etchingShader, updateEtchingShaderUniformsOfMaterial } from '/etchingShader.js';
import { FirstPersonControlsCustom } from '/FirstPersonControlsCustom.js';
import { architecturalFeatures } from './architecturalFeatures';
import { createLibraryScene } from './libaryScene';

// THREE.LoadingManager

let devScene = new THREE.Scene();
let scene = devScene;
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer(); renderer.setSize(window.innerWidth, window.innerHeight)

let controls = new FirstPersonControlsCustom(camera, renderer.domElement);
controls.enabled = false;
let composer = new EffectComposer( renderer );
let renderPass =  new RenderPass( devScene, camera )
composer.addPass( renderPass ); 
let gtaoPass = new GTAOPass( devScene, camera, window.innerWidth, window.innerHeight);
gtaoPass.blendIntensity = 1.0;
gtaoPass.scale = 1.0;
gtaoPass.output = GTAOPass.OUTPUT.Default;
// composer.addPass( gtaoPass ); // note gtao happens after the render pass, so it's using the render pass output including the etching shader, so the gtao pass is adding unfair shading to the etching shader
composer.addPass( new OutputPass() );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let libraryScene = createLibraryScene();    

function switchActiveScene(toScene) {
    scene = toScene;
    renderPass.scene = toScene;
    gtaoPass.scene = toScene;
    toScene.add( camera );
}

switchActiveScene(libraryScene);
let etchingMaterialFolder = null; 
function addEtchingMaterialFolderToGUI(gui, material) {
    if(etchingMaterialFolder){
        gui.removeFolder(etchingMaterialFolder);
    }
    etchingMaterialFolder = gui.addFolder('Etching Material');
    etchingMaterialFolder.domElement.addEventListener('click', function(event) {
        event.stopPropagation();
    })
    etchingMaterialFolder.add(material.uniforms.tilingFactor, 'value', 0, 300).name('Tiling Factor');
    etchingMaterialFolder.add(material.uniforms.posCamVsUV, 'value', 0, 1).name('PosCamVsUV');
    etchingMaterialFolder.add(material.uniforms.dirLight1.value, 'x', -1, 1).name('Light1 X');
    etchingMaterialFolder.add(material.uniforms.dirLight1.value, 'y', -1, 1).name('Light1 Y');
    etchingMaterialFolder.add(material.uniforms.dirLight1.value, 'z', -1, 1).name('Light1 Z');
    etchingMaterialFolder.add(material.uniforms.dirLight2.value, 'x', -1, 1).name('Light2 X');
    etchingMaterialFolder.add(material.uniforms.dirLight2.value, 'y', -1, 1).name('Light2 Y');
    etchingMaterialFolder.add(material.uniforms.dirLight2.value, 'z', -1, 1).name('Light2 Z');
    etchingMaterialFolder.add(material.uniforms.lightFactor, 'value', 0, 4.0).name('Light Factor');
    etchingMaterialFolder.add(material.uniforms.textureFactor, 'value', 0, 2.).name('Texture Factor')
    etchingMaterialFolder.add(material.uniforms.noiseFactor, 'value', 0, 2.).name('Noise Factor')
    etchingMaterialFolder.add(material.uniforms.noiseScale, 'value', 0, 1000.).name('Noise Scale')
    etchingMaterialFolder.add(material.uniforms.rampFactor, 'value', 0, 2.).name('Ramp Factor')
    etchingMaterialFolder.add(material.uniforms.gamma, 'value', 0, 2.).name('Gamma Factor')
    etchingMaterialFolder.add(material.uniforms.angleFactor, 'value', 0, 2.).name('Angle Factor')
    etchingMaterialFolder.add(material.uniforms.theta, 'value', 0, 6.28).name('Theta Factor')
    etchingMaterialFolder.add(material.uniforms.angleClampDivisor, 'value', 0, 100.).name('Angle Clamp Divisor')
    etchingMaterialFolder.open();
}

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
    if(event.key === " "){
        controls.enabled = !controls.enabled;        
    }
    if(event.key === "1" ){
        switchActiveScene(libraryScene);
    }
    if(event.key === "2" ){
        switchActiveScene(devScene);
    }

    if(event.key === "j" || event.key === "J"){
        stats.dom.style.display = stats.dom.style.display === 'none' ? 'block' : 'none';
    }
    if (transformControls) {
        if(event.key === "t" || event.key === "T"){
            transformControls.setMode("translate");
        }
        if(event.key === "r" || event.key === "R"){
            transformControls.setMode("rotate");
        }
        if(event.key === "s" || event.key === "S"){
            transformControls.setMode("scale");
        }
        // world vs local
        if(event.key === "w" || event.key === "W"){
            transformControls.setSpace(transformControls.space === "local" ? "world" : "local");
            console.log('transformControls space', transformControls.space)
        }
        // close transform controls
        if(event.key === "q" || event.key === "Q"){
            scene.remove(transformControls);
            transformControls = null;
        }
    }
  });
let transformControls = null;

});

document.addEventListener('click', function(event) {
    const menu = document.querySelector('.menu');
    if(menu.classList.contains('menu-visible')){
        // menu stuff??
    } else {
        // raycasting stuff
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            console.log('mouse ray interstected', intersects[0].object);
            if (intersects[0].object.material) {
                if(intersects[0].object.material.uniforms && gui) addEtchingMaterialFolderToGUI(gui, intersects[0].object.material);
                // addObjectPosRotScaleFolderToGUI(gui, intersects[0].object);
                // instead turn on transform controls for the object
                if(transformControls){
                    devScene.remove(transformControls);
                }
                transformControls = new TransformControls(camera, composer.renderer.domElement);
                transformControls.attach(intersects[0].object);
                scene.add(transformControls);
                

            }
        }
    }
})
});

// ------------------- Portal -------------------
const planeGeo = new THREE.PlaneGeometry( 100.1, 100.1 );
const portalPlane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0.0 );
let portalCamera = new THREE.PerspectiveCamera( 45, 1.0, 0.1, 500.0 );
devScene.add( portalCamera );
// let portalCameraHelper = new THREE.CameraHelper( portalCamera ); scene.add( portalCameraHelper );
let bottomLeftCorner = new THREE.Vector3();
let bottomRightCorner = new THREE.Vector3();
let topLeftCorner = new THREE.Vector3();
let reflectedPosition = new THREE.Vector3();

const renderTargetResolution = 1024;
let leftPortalTexture = new THREE.WebGLRenderTarget( renderTargetResolution, renderTargetResolution );
let leftPortal = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { map: leftPortalTexture.texture } ) );
let leftPortalFrame = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { color: 0x00ffff, side: THREE.DoubleSide } ) );
leftPortalFrame.scale.set( 1.03, 1.03, 1.03 );
leftPortalFrame.position.z = -.1;
leftPortal.add( leftPortalFrame );
leftPortal.position.x = 2;
leftPortal.position.y = 2;
leftPortal.position.z = -3;
leftPortal.rotateY( 0. );
leftPortal.scale.set( 0.03, 0.03, 0.03 );
devScene.add( leftPortal );

let rightPortalTexture = new THREE.WebGLRenderTarget( renderTargetResolution, renderTargetResolution );
let rightPortal = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { map: rightPortalTexture.texture } ) );
let rightPortalFrame = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } ) );
rightPortalFrame.scale.set( 1.03, 1.03, 1.03 );
rightPortalFrame.position.z = -.1;
rightPortal.add( rightPortalFrame );
rightPortal.position.x = -2;
rightPortal.position.y = 2;
rightPortal.position.z = -3;
rightPortal.rotateY( 0. );
rightPortal.scale.set( 0.03, 0.03, 0.03 );
devScene.add( rightPortal );

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
    renderer.render( devScene, portalCamera );
    thisPortalMesh.visible = true; // re-enable this portal's visibility for general rendering
    leftPortalFrame.visible = true; rightPortalFrame.visible = true; // unhide the portal frames

}

// ------------------- Assets -------------------
const generatedBlankTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); // white texture
let sculptureTexture = new THREE.TextureLoader().load('/public/spirit_of_life_sculpture/Textures/material_0_baseColor.jpeg');
const etchingShaderDeepCopy = JSON.parse(JSON.stringify(etchingShader))
let sculptureMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
    uniforms: {
        ...etchingShaderDeepCopy.uniforms,
        texture1: { value: sculptureTexture },
        tilingFactor: { value: 100.0 },
        posCamVsUV: { value: 1.0 },
    }
});
const loader = new GLTFLoader();
loader.load('/spirit_of_life_sculpture/scene.gltf', async function (gltf) {
    devScene.add(gltf.scene);
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
devScene.add(groundPlane);

cube.position.x = -3
torus.position.x = 3
sphere.position.y = 5

devScene.add(cube);
devScene.add(sphere);
devScene.add(torus);

camera.position.z = 0.8;
camera.position.y = 1.0;
camera.position.x = 0.1;

let sunlight = new THREE.DirectionalLight(0xffffff, .3);
devScene.add(sunlight);
renderer.setClearColor(0x032288, 1);

architecturalFeatures(devScene);

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
} 
window.addEventListener('resize', handleResize);

const stats = new Stats(); stats.dom.style.display = 'none'
document.body.appendChild(stats.dom);
function animate() {
    requestAnimationFrame(animate);
    const rotSpeed = 0.005;
    cube.rotation.x += rotSpeed;
    cube.rotation.y += rotSpeed;
    sphere.rotation.x += rotSpeed;
    sphere.rotation.y += rotSpeed;
    torus.rotation.x += rotSpeed;
    torus.rotation.y += rotSpeed;

    rightPortal.rotateY(0.01);

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

    // portalCameraHelper.update(); // these will be helpful for debugging the portal camera, which probably isn't correct when rotated, but need 2 helpers
    stats.update();
    composer.render();
}
animate();

let gui;
function setupGUI() {
    gui = new dat.GUI();
    gui.hide();

    gui.add( gtaoPass, 'output', {
        'Default': GTAOPass.OUTPUT.Default,
        'Diffuse': GTAOPass.OUTPUT.Diffuse,
        'AO Only': GTAOPass.OUTPUT.AO,
        'AO Only + Denoise': GTAOPass.OUTPUT.Denoise,
        'Depth': GTAOPass.OUTPUT.Depth,
        'Normal': GTAOPass.OUTPUT.Normal
    } ).onChange( function ( value ) {
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
    gui.add( gtaoPass, 'blendIntensity' ).min( 0 ).max( 1 ).step( 0.01 );
    gui.add( aoParameters, 'radius' ).min( 0.01 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'distanceExponent' ).min( 1 ).max( 4 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'thickness' ).min( 0.01 ).max( 10 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'distanceFallOff' ).min( 0 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'scale' ).min( 0.01 ).max( 2.0 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add(controls, 'deadZone').min(0.).max(1000.).step(0.01).name('Dead Zone');
    // make it such that clicking on gui doesn't onClick the canvas
    gui.domElement.addEventListener('click', function(event) {
        event.stopPropagation();
    })
}
setupGUI();