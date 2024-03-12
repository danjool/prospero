import * as THREE from 'three';
import { etchingShader } from '/etchingShader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const generatedBlankTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); // white texture

let cityMaterial = new THREE.ShaderMaterial(etchingShader);
cityMaterial.uniforms.texture1.value = generatedBlankTexture;
cityMaterial.uniforms.tilingFactor.value = 16.0;
cityMaterial.uniforms.posCamVsUV.value = 0.0;
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

const randomizeMatrix = function () {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  return function ( matrix ) {
    position.x = Math.random() * 40 - 20;
    position.y = Math.random() * 40 - 20;
    position.z = Math.random() * 40 - 20;
    quaternion.random();
    scale.x = scale.y = scale.z = Math.random() * 1;
    matrix.compose( position, quaternion, scale );
  };
}

// function makeMerged( geometry ) {
//   const geometries = [];
//   const matrix = new THREE.Matrix4()
//   for ( let i = 0; i < api.count; i ++ ) {
//     const instanceGeometry = geometry.clone()
//     instanceGeometry.applyMatrix4( matrix )
//     geometries.push( instanceGeometry )
//   }
//   const mergedGeometry = BufferGeometryUtils.mergeGeometries( geometries )
//   return mergedGeometry;
// }

function createGeometryBooksInARow(count = 10, width=2, height=.15, depth=.1) {
  const geometries = [];
  const matrix = new THREE.Matrix4()
  for ( let i = 0; i < count; i ++ ) {
    const w = width + Math.random() * .5;
    const h = height + Math.random() * .5;
    const d = depth + Math.random() * .5;
    const geometry = new THREE.BoxGeometry( w, h, d );
    // scooch over
    matrix.makeTranslation( i * w, 0, 0 );
    geometry.applyMatrix4( matrix )
    geometries.push( geometry )
  }
  const mergedGeometry = BufferGeometryUtils.mergeGeometries( geometries )
  return mergedGeometry;  
}

function createGeometryBookShelvesWithBooksOnShelves(count = 10, width=2, height=.15, depth=.1) {
  const geometries = [];
  const matrix = new THREE.Matrix4()
  for ( let i = 0; i < count; i ++ ) {
    // 
    const geometry = new THREE.BoxGeometry( w, h, d );
    // scooch over
    matrix.makeTranslation( i * w, 0, 0 );
    geometry.applyMatrix4( matrix )
    geometries.push( geometry )
  }
  const mergedGeometry = BufferGeometryUtils.mergeGeometries( geometries )
  return mergedGeometry;  
}

const material = new THREE.MeshLambertMaterial( { color: 0x00ffff } );

//////////////////////////////////////
// load the gltf model 'old_shelves'
async function loadOldShelves(scene) {
  let oldShelvesTexture = new THREE.TextureLoader().load('/old_shelves/textures/Shelves_material_baseColor.png');
  const loader = new GLTFLoader();
  let oldShelves;
  const etchingShaderDeepCopy = JSON.parse(JSON.stringify(etchingShader))
  let oldShelvesEtchingMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
    uniforms: {
      ...etchingShaderDeepCopy.uniforms,
      texture1: { value: oldShelvesTexture },
      tilingFactor: { value: 32.0 },
      posCamVsUV: { value: 1.0 },
    }
  });
  loader.load( '/old_shelves/scene.gltf', function ( gltf ) {
    oldShelves = gltf.scene;
    oldShelves.scale.set( .01, .01, .01 );
    oldShelves.position.set( 0, 0, 0 );
    oldShelves.rotation.y = Math.PI;
    const material = new THREE.MeshLambertMaterial( { color: 0x00ffff } );
    oldShelves.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.material = oldShelvesEtchingMaterial;
      }
    } );
    scene.add(oldShelves);
  }, undefined, function (error) {console.error('error', error);});
}

function architecturalFeatures(scene) {
  distributeArchitecturalFeatures(createPillar, scene, 50);
  distributeArchitecturalFeatures(createStair, scene, 50);
  const oldShelves = loadOldShelves(scene);
}

export { architecturalFeatures };