import { useEffect, useRef, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ══════════════════════════════════════════════════════
   TEXTURE ATLAS — 64 chars 8×8, white-on-black
   Expanded to match the reference look (letters, symbols, slashes)
══════════════════════════════════════════════════════ */
const ATLAS_CHARS = [
    '.', ',', '-', '~', ':', ';', '=', '+', '*', '?', '!', 'i', 'l', 'I', '1', 'r',
    'c', 'v', 'x', 'z', 'o', 'a', 's', 'u', 'n', 'e', 'm', 'w', 'h', 'k', 'p', 'q',
    'd', 'b', 'g', 'y', 'j', 't', 'f', 'J', 'L', 'T', 'Y', 'C', 'V', 'X', 'Z', 'O',
    'U', 'Q', '0', '8', 'S', 'G', 'D', 'B', 'R', 'P', 'A', 'E', 'K', 'M', 'W', '@'
]
const ATLAS_N = 8
const ATLAS_CELL = 36

function buildAtlasTex() {
    const sz = ATLAS_N * ATLAS_CELL
    const cvs = document.createElement('canvas')
    cvs.width = cvs.height = sz
    const ctx = cvs.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, sz, sz)
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(ATLAS_CELL * 0.78)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ATLAS_CHARS.forEach((ch, i) => {
        const col = i % ATLAS_N
        const row = Math.floor(i / ATLAS_N)
        ctx.fillText(ch, col * ATLAS_CELL + ATLAS_CELL / 2, row * ATLAS_CELL + ATLAS_CELL / 2)
    })
    const t = new THREE.CanvasTexture(cvs)
    t.minFilter = t.magFilter = THREE.LinearFilter
    return t
}

/* ══════════════════════════════════════════════════════
   GLSL

   kisnu.jpeg = background-removed portrait of Udupi Krishna.
   The removed bg in JPEG → near-black  (bright < BG_CUT → discard).
   Figure pixels (golden jewels, dark stone face) → render chars.

   KEY: uImgAspect uniform lets the shader letterbox the image
   so that the FULL figure is always visible regardless of
   how wide/tall the canvas is.
══════════════════════════════════════════════════════ */
const VS = /* glsl */`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`

const FS = /* glsl */`
  precision highp float;

  uniform sampler2D uPortrait;
  uniform sampler2D uAtlas;
  uniform vec2      uMouse;
  uniform float     uTime;
  uniform vec2      uRes;          // CSS pixel size of this canvas panel
  uniform float     uImgAspect;    // naturalWidth / naturalHeight of portrait
  uniform float     uLoaded;
  uniform vec2      uClickPos;
  uniform float     uClickTime;
  uniform float     uIsPhoto;

  varying vec2 vUv;

  const float CELL    = 4.5;    // Higher density text scale for smoother volume
  const float ATLAS_N = 8.0;
  const float NUM_CH  = 64.0;
  
  // Random noise function for static grid character assignment
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    // Prevent rendering anything until the texture actually loads
    if (uLoaded < 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Use the perfectly normalized vertex UVs (0 to 1) to completely ignore OS display scaling / device ratio
    vec2 uv = vUv;
    float canvasAspect = uRes.x / uRes.y;
    vec2 aspectVec = vec2(canvasAspect, 1.0);
    // ── Static Layout ────────────
    // Now calculate logical pixel coords
    vec2 frag = uv * uRes; 
    
    vec2 cellIdx = floor(frag / CELL);
    vec2 cellCnt = floor(uRes / CELL);

    // ── Letterboxing logic ────────────────────────────────────
    float coverX=1.0, coverY=1.0;
    vec2 offset = vec2(0.0);

    if (canvasAspect > uImgAspect) {
      coverX = uImgAspect / canvasAspect;
      offset.x = (1.0 - coverX) * 0.5;
    } else {
      coverY = canvasAspect / uImgAspect;
      offset.y = (1.0 - coverY) * 0.5;
    }

    vec2 cellUv = floor(uv * uRes / CELL) * CELL / uRes;

    // Discard pixels outside the letterboxed image
    if (cellUv.x < offset.x || cellUv.x > 1.0 - offset.x ||
        cellUv.y < offset.y || cellUv.y > 1.0 - offset.y) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Map to portrait UV space
    vec2 pUv = (cellUv - offset) / vec2(coverX, coverY);

    // ── Sample portrait ───────────────────────────────────────
    vec4  pTex   = texture2D(uPortrait, pUv);
    vec3  pRGB   = pTex.rgb;
    float pAlpha = pTex.a; // Use the actual transparency of kisnu.png
    float bright = dot(pRGB, vec3(0.299, 0.587, 0.114));

    // 1. Separate Figure from Background
    // Discard immediately if it's the transparent background
    if (pAlpha < 0.1) { gl_FragColor = vec4(0.0); return; }
    // Smooth step is no longer needed to hide the bg since we use the PNG alpha
    float isFigure = pAlpha;

    // ── Mouse Hover Calculation ─────────
    float mDist = distance(uMouse * aspectVec, cellUv * aspectVec);
    float highlightNoise = random(cellIdx) * 0.02;
    float isHovered = step(mDist + highlightNoise, 0.04);

    // ── Dynamic Character Scramble (on hover only) ─────────
    float randVal = random(cellIdx + isHovered * floor(uTime * 15.0));
    float charIdx = floor(randVal * NUM_CH);
    
    float atlasCol = mod(charIdx, ATLAS_N);
    float atlasRow = floor(charIdx / ATLAS_N);
    vec2  frac     = fract(frag / CELL);
    vec2  atlasBase= (vec2(atlasCol, ATLAS_N - 1.0 - atlasRow) + frac) / ATLAS_N;

    // Sample the character atlas (No chromatic aberration = razor-sharp text)
    float cG = texture2D(uAtlas, atlasBase).r;
    if (cG < 0.05) { gl_FragColor = vec4(0.0); return; }

    // ── Good Fella Shading Model (Volumetric Opacity) ─────────
    float figureLuma = smoothstep(0.0, 0.8, bright);
    float textOpacity = isFigure * mix(0.15, 1.0, figureLuma);
    vec3 asciiCol = mix(vec3(0.8, 0.3, 0.05), vec3(1.0, 0.65, 0.15), figureLuma);

    // ── Intro Reveal Animation (Center outwards) ──────────────
    float introTime = uTime * 0.6;
    float distFromCenter = distance(cellUv, vec2(0.5, 0.5));
    float sweepEdge = distFromCenter * 1.5; 
    float popNoise = random(cellIdx) * 0.15; 
    float sweepPos = introTime - (sweepEdge + popNoise);
    float reveal = smoothstep(0.0, 0.01, sweepPos);
    float flash = smoothstep(0.0, 0.05, sweepPos) * (1.0 - smoothstep(0.05, 0.6, sweepPos));
    
    textOpacity *= reveal;
    asciiCol = mix(asciiCol, vec3(1.0, 1.0, 1.0), flash);

    // ── Hover Glitch Highlight ──
    vec3 hoverCol = mix(vec3(1.0), vec3(1.0, 0.45, 0.15), uIsPhoto); // White if ascii, vibrant orange if photo
    asciiCol = mix(asciiCol, hoverCol, isHovered);
    textOpacity = max(textOpacity, isHovered * isFigure);

    vec4 finalAscii = vec4(asciiCol, cG * textOpacity);
    vec4 finalPhoto = vec4(pRGB, isFigure);

    // ── Click Expansion Transition ──
    float clickDist = distance(uClickPos * aspectVec, uv * aspectVec);
    float clickRadius = (uTime - uClickTime) * 0.8; // Dramatically Slower explosion ring speed
    float inCircle = smoothstep(clickRadius + 0.08, clickRadius - 0.08, clickDist); // Softer edge
    
    // currentMode maps 0.0=ASCII layout to 1.0=Photo layout
    float currentMode = mix(1.0 - uIsPhoto, uIsPhoto, inCircle);
    
    // Hovering punches a hole through the photo to reveal the scanning ascii text underneath
    float finalBlend = currentMode * (1.0 - isHovered);
    
    vec4 finalColor = mix(finalAscii, finalPhoto, finalBlend);
    
    // Aesthetic subtle flash ring at the edge of the click radius
    float ring = smoothstep(0.04, 0.0, abs(clickDist - clickRadius)) * step(0.001, uClickTime);
    finalColor.rgb = mix(finalColor.rgb, vec3(1.0, 0.9, 0.6), ring * 0.4 * clamp(1.0 - clickRadius*0.5, 0.0, 1.0));

    gl_FragColor = finalColor;
  }
`

/* ══════════════════════════════════════════════════════
   ShaderPlane — viewport-filling quad inside R3F Canvas
══════════════════════════════════════════════════════ */
function ShaderPlane({ portraitTex, atlasTex, mouseRef, imgAspect, isLoaded, clickStateRef }) {
    const matRef = useRef()
    const { size, viewport } = useThree()

    // Stable uniforms — NEVER recreate (deps = textures only).
    // All dynamic values (uLoaded, uImgAspect, etc.) are synced in useFrame.
    const uniforms = useMemo(() => ({
        uPortrait: { value: portraitTex },
        uAtlas: { value: atlasTex },
        uMouse: { value: new THREE.Vector2(-10, -10) },
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(size.width, size.height) },
        uImgAspect: { value: imgAspect },
        uLoaded: { value: 0 },
        uClickPos: { value: new THREE.Vector2(0.5, 0.5) },
        uClickTime: { value: -100 },
        uIsPhoto: { value: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [portraitTex, atlasTex])

    useFrame(({ clock }) => {
        if (!matRef.current) return

        // Sync ALL dynamic uniforms every frame — guarantees GPU always has latest values
        matRef.current.uniforms.uLoaded.value = isLoaded ? 1.0 : 0.0
        matRef.current.uniforms.uImgAspect.value = imgAspect

        if (clickStateRef.current.wantsToggle) {
            clickStateRef.current.wantsToggle = false;
            clickStateRef.current.time = clock.getElapsedTime();
            clickStateRef.current.isPhoto = clickStateRef.current.isPhoto > 0.5 ? 0 : 1;
        }

        matRef.current.uniforms.uTime.value = clock.getElapsedTime()
        matRef.current.uniforms.uMouse.value.set(mouseRef.current[0], mouseRef.current[1])
        matRef.current.uniforms.uRes.value.set(size.width, size.height)
        matRef.current.uniforms.uClickPos.value.set(clickStateRef.current.x, clickStateRef.current.y)
        matRef.current.uniforms.uClickTime.value = clickStateRef.current.time
        matRef.current.uniforms.uIsPhoto.value = clickStateRef.current.isPhoto
    })

    return (
        <mesh onClick={(e) => {
            clickStateRef.current.x = e.uv.x;
            clickStateRef.current.y = e.uv.y;
            clickStateRef.current.wantsToggle = true;
        }}>
            <planeGeometry args={[viewport.width, viewport.height]} /> {/* NOSONAR — R3F JSX */}
            <shaderMaterial
                ref={matRef}
                vertexShader={VS} // NOSONAR — R3F JSX prop
                fragmentShader={FS} // NOSONAR — R3F JSX prop
                uniforms={uniforms} // NOSONAR — R3F JSX prop
                transparent // NOSONAR — R3F JSX prop
                depthWrite={false} // NOSONAR — R3F JSX prop
            />
        </mesh>
    )
}

ShaderPlane.propTypes = {
    portraitTex: PropTypes.object.isRequired,
    atlasTex: PropTypes.object.isRequired,
    mouseRef: PropTypes.object.isRequired,
    imgAspect: PropTypes.number.isRequired,
    isLoaded: PropTypes.bool.isRequired,
    clickStateRef: PropTypes.object.isRequired,
}

/* ══════════════════════════════════════════════════════
   Exported component
══════════════════════════════════════════════════════ */
export default function KrishnaShader() {
    const containerRef = useRef(null)
    const mouseRef = useRef([-10, -10])
    const clickStateRef = useRef({ time: -100, x: 0.5, y: 0.5, isPhoto: 0, wantsToggle: false })
    const [imgAspect, setImgAspect] = useState(0.75)   // portrait default until loaded
    const [isLoaded, setIsLoaded] = useState(false)

    const atlasTex = useMemo(() => buildAtlasTex(), [])

    // Load portrait texture with reliable onLoad callback (not polling)
    const portraitTexRef = useRef(null)
    if (!portraitTexRef.current) {
        const loader = new THREE.TextureLoader()
        const t = loader.load('/kisnu.png', (loaded) => {
            loaded.needsUpdate = true
            setImgAspect(loaded.image.naturalWidth / loaded.image.naturalHeight)
            setIsLoaded(true)
        })
        t.minFilter = t.magFilter = THREE.LinearFilter
        portraitTexRef.current = t
    }
    const portraitTex = portraitTexRef.current

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const onMove = (e) => {
            const r = el.getBoundingClientRect()
            mouseRef.current = [
                (e.clientX - r.left) / r.width,
                1 - (e.clientY - r.top) / r.height,
            ]
        }
        const onLeave = () => { mouseRef.current = [-10, -10] }
        el.addEventListener('mousemove', onMove)
        el.addEventListener('mouseleave', onLeave)
        return () => {
            el.removeEventListener('mousemove', onMove)
            el.removeEventListener('mouseleave', onLeave)
        }
    }, [])

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}>
            <Canvas
                style={{ background: 'transparent' }}
                camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
                gl={{ alpha: true, antialias: false }}
            >
                <ShaderPlane
                    portraitTex={portraitTex}
                    atlasTex={atlasTex}
                    mouseRef={mouseRef}
                    imgAspect={imgAspect}
                    isLoaded={isLoaded}
                    clickStateRef={clickStateRef}
                />
            </Canvas>
        </div>
    )
}
