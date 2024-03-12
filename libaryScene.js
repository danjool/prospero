//  a threejs scene with floor and boxes
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { etchingShader } from './etchingShader.js';

import * as THREE from 'three';
function createLibraryScene() {
    const scene = new THREE.Scene("Library");

    // Add a floor to the scene
    const floor = new THREE.BoxGeometry();
    const generatedBlankTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); // white texture
    const floorEtchingMaterial = new THREE.ShaderMaterial({...JSON.parse(JSON.stringify(etchingShader)),
      uniforms: {
        ...JSON.parse(JSON.stringify(etchingShader)).uniforms,
        texture1: { value: generatedBlankTexture },
        tilingFactor: { value: 100.0 },
        posCamVsUV: { value: 1.0 },
        noiseScale: { value: 0.5 },
        noiseFactor: { value: 0.9 },
      }
    
    });
    const floorMesh = new THREE.Mesh(floor, floorEtchingMaterial);
    floorMesh.scale.set(100, 1, 100);
    floorMesh.position.set(0, -.5, 0);
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
            tilingFactor: { value: 90.0 },
            textureFactor: { value: 1.0 },  
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
          console.log('shelves bounding box', new THREE.Box3().setFromObject(oldShelves).getSize(new THREE.Vector3()));

          const oldShelvesGroup = new THREE.Group();
          const dozenShelvesGroup = new THREE.Group();
          const shelvesWidth = 1.0464344024658203;
          const shelvesHeight = 2.0928688439471554;
          const shelvesDepth = 0.29300195939947404;
          const depthGap = 2.0 - shelvesDepth;
          const widthGap = 1.1 - shelvesWidth;
          const widthGapBetweenPairs = 8.0;
          const floorHeight = 3.0;
          const floorCount = 3;
          
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 10; j++) {
              const shelvesClone = oldShelves.clone();
              shelvesClone.position.set( i * (shelvesWidth + widthGap), 0, j * (shelvesDepth + depthGap) );
              dozenShelvesGroup.add(shelvesClone);
            }
          }
          // arrange clones of the dozenShelvesGroup into two rows of four
          const shelvesOnAFloor = new THREE.Group();
          for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 6; j++) {
              const shelvesClone = dozenShelvesGroup.clone();
              shelvesClone.position.set( i * widthGapBetweenPairs - widthGapBetweenPairs*.5, 0, j * (shelvesDepth + depthGap) );
              shelvesOnAFloor.add(shelvesClone);
            }
          }
          
          for (let i = 0; i < floorCount; i++) {
            const shelvesClone = shelvesOnAFloor.clone();
            shelvesClone.position.set( 0, floorCount * i, 0 );
            oldShelvesGroup.add(shelvesClone);
          }
          
          oldShelvesGroup.position.set(0, 0, -5);
          scene.add(oldShelvesGroup);
          // scene.add(oldShelves);
        }, undefined, function (error) {console.error('error', error);});
      }
    loadOldShelves(scene).then(() => {
      console.log('loaded old shelves')
      // load books after old shelves from gltf 'shabby_books'
      // loop through 001 to 007 to load the books ObjectXXX_mtl_baseColor.jpeg
      let booksTextures = [];
      for (let i = 1; i < 8; i++) {
        booksTextures.push(new THREE.TextureLoader().load(`/shabby_books/textures/Object00${i}_mtl_baseColor.jpeg`));
      }
      // new THREE.TextureLoader().load('/shabby_books/textures/Object001_mtl_baseColor.jpeg');
      const etchingShaderDeepCopy = JSON.parse(JSON.stringify(etchingShader))
        let booksEtchingMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
          uniforms: {
            ...etchingShaderDeepCopy.uniforms,
            texture1: { value: booksTextures[1] },
            tilingFactor: { value: 90.0 },
            textureFactor: { value: 1.0 },  
            posCamVsUV: { value: 1.0 }, // 1.0 is vPositionCamera, 0.0 is vUv
            noiseScale: { value: 0.5 },
            noiseFactor: { value: 0.5 },
          }
        });
      const loader = new GLTFLoader();
      loader.load( '/shabby_books/scene.gltf', function ( gltf ) {
        const books = gltf.scene;
        books.scale.set( .1, .1, .1 );
        books.position.set( 0, .5, 0 );
        books.rotation.y = Math.PI;
        books.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.material = booksEtchingMaterial
          }
        } );
        console.log('books bounding box', new THREE.Box3().setFromObject(books).getSize(new THREE.Vector3()));
        console.log('books', books)
        scene.add(books);
      }, undefined, function (error) {console.error('error', error);});
    });
    
    scene.fog = new THREE.Fog(0x000000, 0.015, 100);
    scene.background = new THREE.Color(0x000000);


    return scene;
}

export { createLibraryScene };