import {
	Vector3
} from 'three';

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
    uniform float noiseFactor;
    uniform float noiseScale;

    uniform float gamma;
    uniform float angleFactor;
    uniform float theta;
    uniform float angleClampDivisor;
    uniform float textureFactor;

    uniform float burstRadius;
    uniform float burstX;
    uniform float burstY;
    uniform float burstZ;

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
        // if (vPositionWorld.z <dd 0.0) discard; // how to 'clip' like with clipping planes, used sometimes with portals
        float lighting = max(dot(vNormalObj, normalize(dirLight1)) * .1, 0.0);
        lighting +=      max(dot(vNormalObj, normalize(dirLight2)) * 0.2, 0.0);

        float distFromBurst = distance(vPositionWorld, vec3(burstX, burstY, burstZ));
        float burstIntensity = 1. - distFromBurst / burstRadius;

        float angle = atan2(vNormalCam.y, vNormalCam.x); // Angle between the normal and the x-axis
        float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);// Normalize the angle to [0, 1]
        float steppedAngle = floor(normalizedAngle * 4.) / 4.;// Step the angle to create the lines
        float rotation = steppedAngle * angleFactor + theta;
        rotation = 0.;

        vec2 convertedUV = vec2( vUv.x, 1.- vUv.y); // because the uv data from the gltf is flipped, we need to convert it by flipping the x and y

        vec3 translating = vec3(0.0, 0.0, 0.0);

        // float n = noise(vPositionCamera.xy*100.0);
        float n = noise(convertedUV.xy*noiseScale);
        rotation += n * noiseFactor;
        // float pn = perlinNoise(vPositionCamera.xy, 10.0, 4, 10.5/vPositionCamera.z);
        // vec3 fpn = fractalPerlinNoise(vPositionCamera, 4.0, 1, 0.5, 0.1); 

        // posCamVsUV is a uniform that drives the shader to use the position in camera space or the uv coordinates to drive the etching lines
        // blend between the two by using the posCamVsUV uniform
        vec3 driver = posCamVsUV * vPositionCamera + (1.0 - posCamVsUV) * vec3(convertedUV.xy, 0.);

        vec3 transformed = blenderMappingTransform(driver, rotation, tilingFactor / (vPositionCamera.z), translating + driver);

        float ramped = rampFromBlackToWhiteThenBlack( transformed.y) ;
        vec3 rampColor = vec3(ramped, ramped, ramped);
        rampColor = vec3(gammaFunction(rampColor.x, gamma), gammaFunction(rampColor.y, gamma), gammaFunction(rampColor.z, gamma));
    
        vec4 textureColor = texture2D(texture1, convertedUV);
        float textureIntensity = 1. - ( textureColor.r * 0.3 + textureColor.g * 0.59 + textureColor.b * 0.11 ) ;

        //gl_FragColor = vec4(hash3(.000001*vPositionCamera.xyz), 1.0);
    
        vec3 color = ( lightFactor * lighting * (burstIntensity) ) - rampFactor * rampColor * ( 1. - textureFactor * textureIntensity );

        // uncomment these to visualize the different components of the shader
        // gl_FragColor = vec4( steppedAngle, steppedAngle, steppedAngle, 1.0);
        // gl_FragColor = vec4(lighting, lighting, lighting, 1.0);
        // gl_FragColor = vec4(vNormalObj, 1.0);
        // gl_FragColor = vec4(vNormalCam.x, vNormalCam.y, vNormalCam.z, 1.0);
        // gl_FragColor = vec4(rampColor, 1.0);
        // gl_FragColor = vec4(vPositionCamera.x/vPositionCamera.z, vPositionCamera.y/vPositionCamera.z, 1.0, 1.0);
        // gl_FragColor = vec4(vUv.x, vUv.y, 1.0, 1.0);
        // gl_FragColor = vec4(convertedUV.xy, 1.0, 1.0);
        // gl_FragColor = vec4(textureColor.rgb, 1.0);
        // gl_FragColor = vec4(vec3(n,n,n), 1.0);
        // gl_FragColor = vec4(fpn, 1.0);
        // gl_FragColor = vec4(distFromBurst, distFromBurst, distFromBurst, 1.0);
        gl_FragColor = vec4(color.rgb, 1.0);
    }
    `,

    uniforms: {
        time: { value: 0.0 },
        posCamVsUV: { value: 1.0 },
        tilingFactor: { value: 100.0},
        texture1: { value: null },
        dirLight1: { value: new Vector3(.2, -.6, .8) },
        dirLight2: { value: new Vector3(-.8, .2, .1) },
        lightFactor: { value: 3.0 },
        textureFactor: { value: 0.5 },
        rampFactor: { value: 0.9 },
        noiseFactor: { value: .002 },
        noiseScale: { value: 500.0 },
        gamma: { value: 1.53 },
        angleFactor: { value: 0.0 },
        theta: { value: 0.0 },
        angleClampDivisor: { value: 10.0 },
        burstRadius: { value: 4.5 },
        burstX: { value: 0.0 },
        burstY: { value: 0.0 },
        burstZ: { value: 0.0 },

    }
};

export { etchingShader };