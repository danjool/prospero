import * as THREE from 'three';
import { etchingShader } from '/etchingShader.js';

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

function architecturalFeatures(scene) {
    distributeArchitecturalFeatures(createPillar, scene, 50);
    distributeArchitecturalFeatures(createStair, scene, 50);
}

export { architecturalFeatures };