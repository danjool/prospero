//  a threejs scene with floor and boxes

import * as THREE from 'three';
// I don't have my own scene manager, we're 
function createLibraryScene() {
    // Create a new scene
    const scene = new THREE.Scene("Library");

    // Add a floor to the scene
    const floor = new THREE.BoxGeometry()
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const floorMesh = new THREE.Mesh(floor, floorMaterial);
    floorMesh.position.y = -10;
    scene.add(floorMesh);

    // Add some boxes to the scene
    const boxGeometry = new THREE.BoxGeometry();
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.position.x = 0;
    boxMesh.position.y = 0;
    boxMesh.position.z = 0;
    scene.add(boxMesh);

    console.log("loaded library scene")

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