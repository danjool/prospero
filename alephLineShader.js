import { Vector3 } from 'three';


let alephLineShader = {
    // just like a line geometry will need for a vertex shader:
    vertexShader: `
        uniform float t;
        uniform vec3 color;
        varying float depth;
        varying vec3 pos;
        varying float vU;
        
        // attribute float offset; 

        varying float vAlpha;
        void main() {
            vU = float(gl_VertexID) / 10000.0;
            float lineIndex = color.z; // from 0 to 1.0
            vAlpha = 1.0;    
            vec3 pt = .01 * vec3(sin(t), cos(t), 0.);
            float l = abs(length( position - pt));
            vec3 dir = normalize(position);
            float bigPulse = 1.5 * sin(2.9 * sin( t * 0.06) );
            float littlePulse = .4 * sin( sin( t * .08 ) );
            float bubble = littlePulse + bigPulse;

            float inflate = 4. + 2.5 * sin ( sin( t * .3 + vU * 3.14159 * 1.88 ) );
            inflate= max(inflate, 4. + bigPulse   );

            vec3 p = max(l, .1 + bubble) * dir;
            p = position;
            pos = position; 
            depth = 3.0 / -p.z;

            gl_Position = projectionMatrix * modelViewMatrix * vec4( p+ inflate, 1.0 );
        }
    `,
    fragmentShader: `
        uniform float t;
        uniform vec3 color;
        varying float depth;
        varying vec3 pos;
        varying float vU;
        // varying float vOffset; 
        // attribute float u;

        varying float vAlpha;

        vec3 hsv2rgb(vec3 c)
        {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
            float radius = length(pos);
            float lineIndex = color.z; // from 0 to 1.0 
            //                      speed      offset on line     synch
            float pulse1 = .5 * sin(t*.05 + vU * 3.14159 * .2 + lineIndex * 2. * 3.14159  ) + 0.5;
            float pulse2 = .5 + 0.5 * sin(t * .4 + pulse1 * .5);
            // worm is effectively all values of pulse2 rounded to 0 or 1, vals < .8 are 0, vals >= .8 are 1
            float fadeFromEdges = 1. - smoothstep(.8, 1.0, vU); // smoothstep returns 0 if vU < .8, 1 if vU > 1.0, and a smooth interpolation between 0 and 1 if vU is between .8 and 1.0
            // gl_FragColor = vec4( fadeFromEdges, fadeFromEdges, fadeFromEdges, 1.0);
            float worm = .9*step(.99999, pulse1)* fadeFromEdges + .001;
            float offset = 0.5 + 0.5*sin(t*.005);
            float peak = 0.7*max(floor( mod( 128.83*offset + .2*vU + t * 0.02, 3.004 +pulse2*0.02 )-.2 ), 0.);
            float cycle = depth*.5  + .5*pulse2 + peak;

            float strike = mod(lineIndex + t*.01 + pulse2, 1.0);
            strike = .99999 - smoothstep(.990, .999, strike);

            vec3 rainbowHue = hsv2rgb(vec3(vU * 3.0, 1.0, .01 - worm));
            gl_FragColor = vec4( rainbowHue, 1.0) + worm;

            float x= gl_FragCoord.x;
            float y= gl_FragCoord.y;
            // to get the line index, we can use the gl_FragCoord
            

            // to know 'which' line we are on, we can use the gl_FragCoord
            // gl_FragColor = vec4( gl_FragCoord.x*.5w, gl_FragCoord.y, 0.0, 1.0 );
            // gl_FragColor = vec4( 1.0, 0.0, t, vAlpha );
            // gl_FragColor = vec4( color, 1.0 );
            // gl_FragColor = vec4( colorsArrayColor, 1.0 );
            // gl_FragColor = vec4( cycle, cycle, cycle, 1.0);
            // gl_FragColor = vec4( pulse1, pulse1, pulse1, 1.0);
            // gl_FragColor = vec4( pulse2, pulse2, pulse2, 1.0);
            // gl_FragColor = vec4( offset, offset, offset, 1.0);
            // gl_FragColor = vec4( peak, peak, peak, 1.0);
            // gl_FragColor = vec4( .005 - vU*.01, .1 - strike, worm, 1.);
            // gl_FragColor = vec4( x, y, 0., 1.0);
            // float uu = (1.-vU)*.1; gl_FragColor = vec4( uu, uu, uu, 1.0);
            // gl_FragColor = vec4( radius, .001, radius, 1.0);
        }
    `
};

export { alephLineShader };
