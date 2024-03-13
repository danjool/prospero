import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { etchingShader } from './etchingShader.js';

import * as THREE from 'three';
function createLibraryScene() {
    const scene = new THREE.Scene("Library");
    const loader = new GLTFLoader();
    const shelvesWidth = 1.0464344024658203;
    const shelvesHeight = 2.0928688439471554;
    const shelvesDepth = 0.29300195939947404;

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
        // const loader = new GLTFLoader();
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
      console.log('loaded old shelves');
    });


    ////////////////////
    const etchingShaderDeepCopy = JSON.parse(JSON.stringify(etchingShader))
      
      const baseColorTexture = new THREE.TextureLoader().load('/book1/textures/BookA_baseColor.png');
      // skip other textures for now
      const book1EtchingMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
        uniforms: {
          ...etchingShaderDeepCopy.uniforms,
          texture1: { value: baseColorTexture },
          tilingFactor: { value: 90.0 },
          textureFactor: { value: 1.0 },  
          posCamVsUV: { value: 1.0 }, // 1.0 is vPositionCamera, 0.0 is vUv
          noiseScale: { value: 0.5 },
          noiseFactor: { value: 0.5 },
        }
      });

      loader.load( '/book1/scene.gltf', function ( gltf ) {
        const book1 = gltf.scene;
        book1.position.set( 0, .5, 0 );
        // book1.rotation.x = Math.PI/2;
        book1.rotation.z = Math.PI;
        book1.rotation.y = Math.PI/2;
        book1.scale.set( .01, .01, .01 );
        book1.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.material = book1EtchingMaterial
          }
        } );
        // console.log('book1 bounding box', new THREE.Box3().setFromObject(book1).getSize(new THREE.Vector3()));
        // console.log('book1', book1)
        // scene.add(book1);
      }, undefined, function (error) {console.error('error', error);});
      // book2
        // public/book2/textures/Scene_-_Root_baseColor.png public/book2/textures/Scene_-_Root_metallicRoughness.png public/book2/textures/Scene_-_Root_normal.png
        
      const baseColorTexture2 = new THREE.TextureLoader().load('/book2/textures/Scene_-_Root_baseColor.png');
      // skip other textures for now
      const book2EtchingMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
        uniforms: {
          ...etchingShaderDeepCopy.uniforms,
          texture1: { value: baseColorTexture2 },
          tilingFactor: { value: 90.0 },
          textureFactor: { value: 1.0 },  
          posCamVsUV: { value: 1.0 }, // 1.0 is vPositionCamera, 0.0 is vUv
          noiseScale: { value: 0.5 },
          noiseFactor: { value: 0.5 },
        }
      });
      loader.load( '/book2/scene.gltf', function ( gltf ) {
        const book2 = gltf.scene;
        console.log('book2', book2)
        book2.updateMatrixWorld(true, true)
        book2.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.material = book2EtchingMaterial
            const geometry = child.geometry;
            geometry.applyMatrix4(child.matrixWorld);
          }
          if (child.isObject3D){
            child.rotation.x = 0;
            child.rotation.y = 0;
            child.rotation.z = 0;
            child.position.x = 0;
            child.position.y = 0;
            child.position.z = 0;
            child.scale.x = 1.
            child.scale.y = 1.
            child.scale.z = 1.

          }
        } );
        book2.position.set( .2, 1., 0 );
        book2.scale.set( .008, .008, .008 );
        book2.rotateZ(Math.PI/2);
        book2.rotateY(Math.PI);
        // scene.add(book2);

        const bb = new THREE.Box3().setFromObject(book2).getSize(new THREE.Vector3());
        console.log('book2 bounding box', bb);
        const book2width = bb.x;
        const book2height = bb.y;
        const book2depth = bb.z;
        const bookGap = 0.005;

        // use book2 to place a bunch of book2's on shelves
        const book2ShelfRow = new THREE.Group();
        for (let i = 0; i < 14  ; i++) {
          const book2Clone = book2.clone();
          book2Clone.position.set( ( book2width + bookGap ) * i, 0, 0. );
          book2ShelfRow.add(book2Clone);
        }
        book2ShelfRow.position.set(0, 0, 0);


        const wholeShelfOfBookes = new THREE.Group();
        //there's five rows vertically at shelvesHeight
        for (let i = 0; i < 5; i++) {
          const book2ShelfRowClone = book2ShelfRow.clone();
          book2ShelfRowClone.position.set( -1.7, i * (book2height +.05)+.35, 0);
          wholeShelfOfBookes.add(book2ShelfRowClone);
        }
        wholeShelfOfBookes.position.set(0, 0, -5);
        scene.add(wholeShelfOfBookes);

        
      }, undefined, function (error) {console.error('error', error);});

      // book3
      // book_baseColor.png
      const baseColorTexture3 = new THREE.TextureLoader().load('/book3/textures/book_baseColor.png');
      // skip other textures for now
      const book3EtchingMaterial = new THREE.ShaderMaterial({...etchingShaderDeepCopy,
        uniforms: {
          ...etchingShaderDeepCopy.uniforms,
          texture1: { value: baseColorTexture3 },
          tilingFactor: { value: 90.0 },
          textureFactor: { value: 1.0 },  
          posCamVsUV: { value: 1.0 }, // 1.0 is vPositionCamera, 0.0 is vUv
          noiseScale: { value: 0.5 },
          noiseFactor: { value: 0.5 },
        }
      });
      loader.load( '/book3/scene.gltf', function ( gltf ) {
        const book3 = gltf.scene;
        book3.position.set( 1.4, 1.0, 0 );
        book3.scale.set( .001, .001, .001 );
        // book3.rotation.z = Math.PI;
        book3.rotation.y = -Math.PI/2.;
        // book3.rotation.x = Math.PI/2;
        book3.traverse( function ( child ) {
          if ( child.isMesh ) {
            // zero out the rotation
            child.rotation.x = 0;
            child.rotation.y = 0;
            child.rotation.z = 0;

            child.material = book3EtchingMaterial
          }
        } );
        // book3 bounding box?
        const bb = new THREE.Box3().setFromObject(book3).getSize(new THREE.Vector3());
        // scene.add(book3);
      }, undefined, function (error) {console.error('error', error);});
    
    scene.fog = new THREE.Fog(0x000000, 0.015, 100);
    scene.background = new THREE.Color(0x000000);
    return scene;
}

export { createLibraryScene };