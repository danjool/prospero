import * as THREE from 'three';
import * as dat from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FirstPersonControlsCustom } from '/FirstPersonControlsCustom.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer(); renderer.setSize(window.innerWidth, window.innerHeight)
let fpControls = new FirstPersonControlsCustom(camera, renderer.domElement);
fpControls.lookSpeed = 0.05;
fpControls.movementSpeed = 1;
fpControls.mouseDragOn = true;
fpControls.mouseLook = false;
fpControls.noFly = true;
fpControls.lookVertical = true;
fpControls.constrainVertical = false; // constrain the vertical look to a specific range
fpControls.verticalMin = 2.0;
fpControls.verticalMax = 2.1;
fpControls.heightSpeed = true;
fpControls.heightMin = 1.0;
fpControls.heightMax = 1.0;
fpControls.constrainHeight = true;
fpControls.activeLook = true;

// let orbitControls = new OrbitControls(camera, renderer.domElement); // leaving this active with other controls bad
// controls.target.y = 2.5;
// controls.enableDamping = true;
// controls.dampingFactor = 0.1;
let controls = fpControls
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

const generatedBlankTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); // white texture

let etchingShader = {
    name: 'EtchingShader',
    vertexShader: `
    // uniform vec3 lightDir; // Direction to the light source in camera space
    uniform float tilingFactor; // To control the tiling of the hatching texture

    varying vec2 vUv;
    varying float vLightIntensity;
    varying vec3 vNormalCam;
    varying vec3 vNormalObj;
    varying vec3 vNormalWorld;
    varying vec3 vPositionCamera;
    varying vec3 vPositionWorld;

    void main() {
        vec3 lightDir = vec3(0.0, 0.0, 1.0); // Example light direction
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);// Transform vertex position to camera space
        
        vUv = uv;
        vPositionCamera = modelViewPosition.xyz / modelViewPosition.w; // represents the position of the vertex in camera space, z is the depth but in camera space, so it's the distance from the camera
        vPositionWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormalCam = normalize(normalMatrix * normal);// Transform normal to camera space
        vNormalObj = normal;
        vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vLightIntensity = max(dot(vNormalCam, normalize(lightDir)), 0.0);// Simple directional light intensity

        gl_Position = projectionMatrix * modelViewPosition;// Transform vertex position to screen space
    }`,
    fragmentShader: `
    uniform sampler2D texture1; 
    uniform float posCamVsUV;
    uniform vec3 dirLight1; 
    uniform vec3 dirLight2; 
    uniform float tilingFactor; // To control the tiling of the hatching texture
    uniform float time;
    uniform float lightFactor;
    uniform float rampFactor;
    uniform float gamma;
    uniform float angleFactor;
    uniform float theta;
    uniform float angleClampDivisor;
    uniform float textureFactor;

    varying vec2 vUv;
    varying vec3 vPositionCamera;
    varying float vLightIntensity;
    varying vec3 vNormalCam;
    varying vec3 vNormalObj;
    varying vec3 vPositionWorld;

    float rampFromBlackToWhiteThenBlack(float x) {
        return 1.0 - 2.0 * abs( mod(x, 1.) - 0.5);
    }

    float gammaFunction(float x, float gamma) {
        return pow(x, 1.0/gamma);
    }

    float atan2(in float y, in float x){
        float PI = 3.1415926535897932384626433832795;
        bool s = (abs(x) > abs(y));
        return mix(PI/2.0 - atan(x,y), atan(y,x), s);
    }

    vec3 blenderMappingTransform(vec3 inputVector, float rotation, float scale, vec3 translation) {
        vec3 p = inputVector;
        float x = p.x * scale;
        float y = p.y * scale;
        float z = p.z * scale;
        float x2 = x * cos(rotation) - y * sin(rotation);
        float y2 = x * sin(rotation) + y * cos(rotation);
        return vec3(x2 + translation.x, y2 + translation.y, z + translation.z);
    }

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
    
        return mix(mix(hash(i + vec2(0.0,0.0)), 
                       hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), 
                       hash(i + vec2(1.0,1.0)), u.x), u.y);
    }
    
    float perlinNoise(vec2 uv, float scale, int octaves, float persistence) {
        float total = 0.0;
        float frequency = scale;
        float amplitude = 1.0;
        float maxValue = 0.0;  // Used for normalizing result to 0.0 - 1.0
        for(int i = 0; i < octaves; i++) {
            total += noise(uv * frequency) * amplitude;
            
            maxValue += amplitude;
            
            amplitude *= persistence;
            frequency *= 2.0;
        }
    
        return total/maxValue;
    }    

    vec3 fractalPerlinNoise(vec3 p, float scale, int octaves, float persistence, float zFactor) {
        float n = perlinNoise(p.xy, scale, octaves, persistence);
        float n2 = perlinNoise(p.xz, scale, octaves, persistence);
        float n3 = perlinNoise(p.yz, scale, octaves, persistence);
        return vec3(n, n2, n3);
    }

    vec3 hash3(vec3 p) {
        return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 515.3)), dot(p, vec3(269.5, 183.3, 419.3)), dot(p, vec3(419.2, 371.9, 619.3)))) * 43758.5453);
    }

    void main() {
        float lighting = max(dot(vNormalObj, normalize(dirLight1)) * .2, 0.0);
        lighting +=      max(dot(vNormalObj, normalize(dirLight2)) * 0.8, 0.0);

        float angle = atan2(vNormalCam.y, vNormalCam.x); // Angle between the normal and the x-axis
        float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);// Normalize the angle to [0, 1]
        float steppedAngle = floor(normalizedAngle * 4.) / 4.;// Step the angle to create the lines
        float rotation = steppedAngle * angleFactor + theta;
        rotation = 0.;
        vec3 translating = vec3(0.0, 0.0, 0.0);
        // posCamVsUV is a uniform that drives the shader to use the position in camera space or the uv coordinates to drive the etching lines
        // blend between the two by using the posCamVsUV uniform
        vec3 driver = posCamVsUV * vPositionCamera + (1.0 - posCamVsUV) * vec3(vUv.xy, 0.);
        // we'll also mutiply tilingFactor by the object's distance from the camera to make the tiling factor smaller as the object gets further away
        // float tilingFactor = tilingFactor / (vPositionCamera.z);
        vec3 transformed = blenderMappingTransform(driver, rotation, tilingFactor / (vPositionCamera.z), translating);

        float ramped = rampFromBlackToWhiteThenBlack( transformed.y) ;
        vec3 rampColor = vec3(ramped, ramped, ramped);
        rampColor = vec3(gammaFunction(rampColor.x, gamma), gammaFunction(rampColor.y, gamma), gammaFunction(rampColor.z, gamma));
    
        vec2 convertedUV = vec2( vUv.x, 1.0 - vUv.y); // because the uv data from the gltf is flipped, we need to convert it by flipping the x and y
        vec4 textureColor = texture2D(texture1, vUv * 10.0); // * 10.0 to tile the texture
        float textureIntensity = textureColor.r * 0.3 + textureColor.g * 0.59 + textureColor.b * 0.11;

        // vec3 fpn = fractalPerlinNoise(vPositionCamera, 4.0, 1, 0.5, 0.1); gl_FragColor = vec4(fpn, 1.0);
        // float n = perlinNoise(vPositionCamera.xy, 10.0, 4, 10.5/vPositionCamera.z);gl_FragColor = vec4(n, n, n, 1.0);

        //gl_FragColor = vec4(hash3(.000001*vPositionCamera.xyz), 1.0);
    
        vec3 color = ( lightFactor * lighting ) - rampFactor * rampColor - textureFactor * textureIntensity;

        // uncomment these to visualize the different components of the shader
        // gl_FragColor = vec4( steppedAngle, steppedAngle, steppedAngle, 1.0);
        // gl_FragColor = vec4(textureColor.rgb, 1.0);
        // gl_FragColor = vec4(lighting, lighting, lighting, 1.0);
        // gl_FragColor = vec4(vNormalObj, 1.0);
        // gl_FragColor = vec4(vNormalCam.x, vNormalCam.y, vNormalCam.z, 1.0);
        // gl_FragColor = vec4(rampColor, 1.0);
        // gl_FragColor = vec4(vPositionCamera.x/vPositionCamera.z, vPositionCamera.y/vPositionCamera.z, 1.0, 1.0);
        // gl_FragColor = vec4(vUv.x, vUv.y, 1.0, 1.0);
        // gl_FragColor = vec4(convertedUV.xy, 1.0, 1.0);
        gl_FragColor = vec4(color.rgb, 1.0);
    }
    `,

    uniforms: {
        time: { value: 0.0 },
        posCamVsUV: { value: 1.0 },
        tilingFactor: { value: 100.0},
        texture1: { value: generatedBlankTexture },
        dirLight1: { value: new THREE.Vector3(.2, -.2, .8) },
        dirLight2: { value: new THREE.Vector3(-.4, .2, .1) },
        lightFactor: { value: 3.0 },
        textureFactor: { value: 0.5 },
        rampFactor: { value: 0.9 },
        gamma: { value: 1.53 },
        angleFactor: { value: 0.0 },
        theta: { value: 0.0 },
        angleClampDivisor: { value: 10.0 },

    }
};

let gui = new dat.GUI();
gui.add(etchingShader.uniforms.tilingFactor, 'value', 0, 300).name('Tiling Factor');
// gui.add(etchingShader.uniforms.posCamVsUV, 'value', 0, 1).name('PosCamVsUV');
gui.add(etchingShader.uniforms.dirLight1.value, 'x', -1, 1).name('Light1 X');
gui.add(etchingShader.uniforms.dirLight1.value, 'y', -1, 1).name('Light1 Y');
gui.add(etchingShader.uniforms.dirLight1.value, 'z', -1, 1).name('Light1 Z');
gui.add(etchingShader.uniforms.dirLight2.value, 'x', -1, 1).name('Light2 X');
gui.add(etchingShader.uniforms.dirLight2.value, 'y', -1, 1).name('Light2 Y');
gui.add(etchingShader.uniforms.dirLight2.value, 'z', -1, 1).name('Light2 Z');
gui.add({ autoRotate: false }, 'autoRotate').onChange((value) => {
    if (value) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
    } else {
        controls.autoRotate = false;
    }
});
gui.add(etchingShader.uniforms.lightFactor, 'value', 0, 4.0).name('Light Factor');
gui.add(etchingShader.uniforms.textureFactor, 'value', 0, 2.).name('Texture Factor')
gui.add(etchingShader.uniforms.rampFactor, 'value', 0, 2.).name('Ramp Factor')
gui.add(etchingShader.uniforms.gamma, 'value', 0, 2.).name('Gamma Factor')
gui.add(etchingShader.uniforms.angleFactor, 'value', 0, 2.).name('Angle Factor')
gui.add(etchingShader.uniforms.theta, 'value', 0, 6.28).name('Theta Factor')
gui.add(etchingShader.uniforms.angleClampDivisor, 'value', 0, 100.).name('Angle Clamp Divisor')

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
gui.add( gtaoPass, 'blendIntensity' ).min( 0 ).max( 1 ).step( 0.01 );
gui.add( aoParameters, 'radius' ).min( 0.01 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
gui.add( aoParameters, 'distanceExponent' ).min( 1 ).max( 4 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
gui.add( aoParameters, 'thickness' ).min( 0.01 ).max( 10 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
gui.add( aoParameters, 'distanceFallOff' ).min( 0 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
gui.add( aoParameters, 'scale' ).min( 0.01 ).max( 2.0 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
gui.add( aoParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );

gui.add(controls, 'deadZone').min(0.).max(1000.).step(0.01).name('Dead Zone');

let sculptureTexture = new THREE.TextureLoader().load('/spirit_of_life_sculpture/Textures/material_0_baseColor.jpeg');
let sculptureMaterial = new THREE.ShaderMaterial(etchingShader);
sculptureMaterial.uniforms.texture1.value = sculptureTexture;
const loader = new GLTFLoader();
loader.load('/spirit_of_life_sculpture/scene.gltf', async function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.traverse((child) => {
        if (child.isMesh) {child.material = new THREE.MeshBasicMaterial({ map: child.material.map });}
        if (child.isObject3D) {child.position.set(0, 0, 0);}
    });
    const sculptureScale = 2.0;
    gltf.scene.scale.set(sculptureScale, sculptureScale, sculptureScale);
    gltf.scene.rotation.y = Math.PI / 2;
    gltf.scene.traverse((child) => {
        if (child.isMesh) {child.material = sculptureMaterial;}
    });
    handleResize();
}, undefined, function (error) {console.error('error', error);});

const textureLessEtchingMaterial = sculptureMaterial.clone();
textureLessEtchingMaterial.uniforms.texture1.value = generatedBlankTexture;
textureLessEtchingMaterial.uniforms.tilingFactor.value = 16.0;
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

// Pillar with base, shaft, and capital
let cityMaterial = textureLessEtchingMaterial
function createPillar() {
    
    const pillar = new THREE.Group();

    // Base
    const baseGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const base = new THREE.Mesh(baseGeometry, cityMaterial);
    base.position.y = 0.1; // Half the height to sit on ground
    pillar.add(base);

    // Shaft (cylinder)
    const shaftGeometry = new THREE.CylinderGeometry(0.3, 0.3, 50, 32);
    const shaft = new THREE.Mesh(shaftGeometry, cityMaterial);
    shaft.position.y = 25 + 0.1; // Half the height plus base's height
    pillar.add(shaft);

    // Capital
    const capitalGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
    const capital = new THREE.Mesh(capitalGeometry, cityMaterial);
    capital.position.y = 50 + 0.2 + 0.1; // Shaft height plus its own half-height plus base height
    pillar.add(capital);

    return pillar;
}

// Simple stair
function createStair(stepsCount = 55) {
    const stair = new THREE.Group();

    for (let i = 0; i < stepsCount; i++) {
    const stepGeometry = new THREE.BoxGeometry(5, 0.5, (i + 1) * 1);
    const step = new THREE.Mesh(stepGeometry, cityMaterial);
    step.position.y = i * 0.5; // Each step is half a meter high
    step.position.z = i * 0.5; // Move each step forward to simulate stair stepping
    stair.add(step);
    }
    stair.rotation.x = Math.PI ; // Rotate the stair to be at an angle
    stair.position.y = 75.0; // Half the height to sit on ground
    return stair;
}

function distributeArchitecturalFeatures(featureCreator, scene, count = 10) {
    const scale = 3.;
    const range = 300;
    
    for (let i = 0; i < count; i++) {
      const feature = featureCreator();
      feature.scale.set(scale, scale, scale);
      
      const distance = 150. + Math.random() * range; // Random distance from origin
      const angle = Math.random() * Math.PI * 2; // Random angle for full 360 distribution
      feature.position.x = Math.cos(angle) * distance;
      feature.position.z = Math.sin(angle) * distance;
    
      feature.rotation.y = Math.random() * Math.PI * 2;
      
      scene.add(feature);
    }
  }
  distributeArchitecturalFeatures(createPillar, scene, 50);
  distributeArchitecturalFeatures(createStair, scene, 100);

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
} 
window.addEventListener('resize', handleResize);

  let t = 0;
function animate() {
    requestAnimationFrame(animate);
    const rotSpeed = 0.005;
    cube.rotation.x += rotSpeed;
    cube.rotation.y += rotSpeed;
    sphere.rotation.x += rotSpeed;
    sphere.rotation.y += rotSpeed;
    torus.rotation.x += rotSpeed;
    torus.rotation.y += rotSpeed;
    etchingShader.uniforms.time.value += 0.05;
    const delta = 0.1;
    controls.update(delta);
    // renderer.render(scene, camera);
    composer.render();
}
animate();