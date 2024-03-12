//  a threejs scene with floor and boxes
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { etchingShader } from './etchingShader.js';


import * as THREE from 'three';
// I don't have my own scene manager, we're 
function createLibraryScene() {
    // Create a new scene
    const scene = new THREE.Scene("Library");

    // Add a floor to the scene
    const floor = new THREE.BoxGeometry()
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x600060 });
    const floorMesh = new THREE.Mesh(floor, floorMaterial);
    floorMesh.position.y = -10;
    floorMesh.scale.set(100, 1, 100);
    scene.add(floorMesh);

    console.log("loaded library scene")
    async function loadOldShelves(scene) {
        let oldShelvesTexture = new THREE.TextureLoader().load('/old_shelves/textures/Shelves_material_baseColor.png');
        const loader = new GLTFLoader();
        let oldShelves;
        const etchingShaderDeepCopy = JSON.parse(JSON.stringify(etchingShader))
        let oldShelvesEtchingMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
          uniforms: {
            ...etchingShaderDeepCopy.uniforms,
            texture1: { value: oldShelvesTexture },
            tilingFactor: { value: 100.0 },
            posCamVsUV: { value: 1.0 }, // 1.0 is vPositionCamera, 0.0 is vUv
            noiseScale: { value: 0.5 },
            noiseFactor: { value: 0.5 },
          }
        });
        loader.load( '/old_shelves/scene.gltf', function ( gltf ) {
          oldShelves = gltf.scene;
          oldShelves.scale.set( .01, .01, .01 );
          oldShelves.position.set( 0, 0, 0 );
          oldShelves.rotation.y = Math.PI;
          oldShelves.traverse( function ( child ) {
            if ( child.isMesh ) {
              child.material = oldShelvesEtchingMaterial;
            }
          } );
          scene.add(oldShelves);
        }, undefined, function (error) {console.error('error', error);});
      }
    const shelves = loadOldShelves(scene);
    // duplicate the shelves which are a scene
    // const shelves2 = shelves.clone(); nOT CLONE




    // set the fog to white
    scene.fog = new THREE.Fog(0xffffff, 0.015, 100);
    // and clear with white
    scene.background = new THREE.Color(0xffffff);

    //lights?
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);

    scene.add(light);

    return scene;
}

export { createLibraryScene };