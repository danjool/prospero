import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { etchingShader, etchingShaderInstanced } from './etchingShader.js';
import * as THREE from 'three';

function loadGLTFAsset(path, material, onLoadCallback) {
    console.log('loading gltf asset', path)
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
        const asset = gltf.scene;
        asset.updateMatrixWorld(true, true)
        asset.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
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
        });
        onLoadCallback(asset);
    }, undefined, (error) => {
        console.error('Error loading GLTF asset:', error);
    });
}

function createEtchingMaterial(texturePath, uniformsOverrides = {}, shader=etchingShader) {
    const texture = new THREE.TextureLoader().load(texturePath);
    const uniforms = {
        ...JSON.parse(JSON.stringify(shader)).uniforms,
        texture1: { value: texture },
        ...uniformsOverrides,
    };
    return new THREE.ShaderMaterial({ ...shader, uniforms });
}

function setupBooks(scene, shelves) {
    // const book1Material = createEtchingMaterial('/book1/textures/BookA_baseColor.png', {
    //     tilingFactor: { value: 90.0 },
    //     textureFactor: { value: 1.0 },
    //     posCamVsUV: { value: 1.0 },
    //     noiseScale: { value: 0.5 },
    //     noiseFactor: { value: 0.5 },
    // });

    const book2Material = createEtchingMaterial('/book2/textures/Scene_-_Root_baseColor.png', {
        tilingFactor: { value: 90.0 },
        textureFactor: { value: 1.0 },
        posCamVsUV: { value: 1.0 },
        noiseScale: { value: 0.5 },
        noiseFactor: { value: 0.5 },
    });

    // const book3Material = createEtchingMaterial('/book3/textures/book_baseColor.png', {
    //     tilingFactor: { value: 90.0 },
    //     textureFactor: { value: 1.0 },
    //     posCamVsUV: { value: 1.0 },
    //     noiseScale: { value: 0.5 },
    //     noiseFactor: { value: 0.5 },
    // });

    // loadGLTFAsset('/book1/scene.gltf', book1Material, onBookReady);
    loadGLTFAsset('/book2/scene.gltf', book2Material, (book) => {
        // clone and place a bunch of book2's on shelves
        const scale = 0.9;
        book.scale.set(scale, scale, scale);
        book.rotateZ(Math.PI/2);
        book.rotateY(Math.PI);
        const bb = new THREE.Box3().setFromObject(book).getSize(new THREE.Vector3());
        const book2width = bb.x;
        const book2height = bb.y;
        const book2depth = bb.z;
        const bookGap = bb.x*.05;
        const book2ShelfRow = new THREE.Group();
        for (let i = 0; i < 14  ; i++) {
            const book2Clone = book.clone();
            book2Clone.position.set( 11.0 + ( book2width + bookGap ) * i, 0, 13. );
            book2ShelfRow.add(book2Clone);
        }
        book2ShelfRow.position.set(0, 0, 0);
        const wholeShelfOfBookes = new THREE.Group();
        const firstShelfHeight = 13.5
        for (let i = 0; i < 5; i++) {
            const book2ShelfRowClone = book2ShelfRow.clone();
            book2ShelfRowClone.position.set( 0., i * (book2height +7.9) + firstShelfHeight, 0.);
            wholeShelfOfBookes.add(book2ShelfRowClone);
        }
        shelves.add(wholeShelfOfBookes);

        const dx = 1.0;
        const dy = 2.0
        const dz = 2.0
        const mult = 1.;
        for (let i = 0; i < 4; i++) { 
            for(let j = 0; j < 2; j++) { 
                for(let k = 0; k < 5; k++) {
                    const shelvesClone = shelves.clone();
                    shelvesClone.rotateY(Math.PI/2);
                    shelvesClone.position.set(i * dx, j * dy, k * dz);
                    scene.add(shelvesClone);
                }
            }
        }
    });
}

function setupBooksInstancedOnlyBook2(scene, shelves) {
    const book2Material = createEtchingMaterial('/book2/textures/Scene_-_Root_baseColor.png', {
        tilingFactor: { value: 10.0 },
        textureFactor: { value: 1.0 },
        posCamVsUV: { value: 1.0 },
        noiseScale: { value: 0.5 },
        noiseFactor: { value: 0.0 },
    }, etchingShaderInstanced);
    // make two InstancedMeshes, one for the shelves, and one for the books, and add them to the scene with 4*2*5 = 40 instances of shelves, 5*14 = 70 instances of books per shelf, and 4*2*5*70 = 2800 books in total
    // bookgeometry from the book2 scene 
    // so first find the geometry of the book2 scene
    
    loadGLTFAsset('/book2/scene.gltf', book2Material, (book) => {
        const book2Geometry = book.getObjectByName('Cube__0').geometry;
        console.log('book2Geometry', book2Geometry);
        const fakeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const book2InstancedMesh = new THREE.InstancedMesh(book2Geometry, book2Material, 28);// 2800
        book2InstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(book2InstancedMesh);
        const dummy = new THREE.Object3D();
        const scale = 0.009;
        for(let i = 0; i < 28; i++) {
            dummy.position.x = Math.random() * 1 - .5;
            dummy.position.y = Math.random() * 1;
            dummy.position.z = Math.random() * 1 - .5;
            dummy.scale.x = dummy.scale.y = dummy.scale.z = scale;
            dummy.rotation.z = Math.PI*.5;
            dummy.updateMatrix();
            book2InstancedMesh.setMatrixAt(i, dummy.matrix);
            
        }
        console.log('book2InstancedMesh', book2InstancedMesh);
        book2InstancedMesh.instanceMatrix.needsUpdate = true;

    });
}


function setupShelves(scene) {
    const oldShelvesMaterial = createEtchingMaterial('/old_shelves/textures/Shelves_material_baseColor.png', {
        tilingFactor: { value: 90.0 },
        textureFactor: { value: 1.0 },
        posCamVsUV: { value: 1.0 },
        noiseScale: { value: 0.5 },
        noiseFactor: { value: 0.5 },
    });

    loadGLTFAsset('/old_shelves/scene.gltf', oldShelvesMaterial, (shelves) => {
        const bookScaleMult = 0.008;
        shelves.scale.set(bookScaleMult, bookScaleMult, bookScaleMult);
        shelves.position.set(0, 0, 0);
        setupBooksInstancedOnlyBook2(scene, shelves);
    });
}

function createLibraryScene() {
    const scene = new THREE.Scene("Library");
    const loader = new GLTFLoader();
    const shelvesWidth = 1.0464344024658203;
    const shelvesHeight = 2.0928688439471554;
    const shelvesDepth = 0.29300195939947404;
    // Floor setup remains the same, so
    // Add a floor to the scene
    const floor = new THREE.BoxGeometry();
    const generatedBlankTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); // white texture
    // use the new approach to create the floor material
    const floorEtchingMaterial = createEtchingMaterial('/old_shelves/textures/Shelves_material_baseColor.png', {
        tilingFactor: { value: 100.0 },
        posCamVsUV: { value: 1.0 },
        noiseScale: { value: 0.5 },
        noiseFactor: { value: 0.9 },
    });
    const floorMesh = new THREE.Mesh(floor, floorEtchingMaterial);
    floorMesh.scale.set(100, 1, 100);
    floorMesh.position.set(0, -.5, 0);
    scene.add(floorMesh);

    // Now setup shelves and books with the new approach
    setupShelves(scene);

    scene.fog = new THREE.Fog(0x000000, 0.015, 100);
    scene.background = new THREE.Color(0x000000);
    return scene;
}

export { createLibraryScene };