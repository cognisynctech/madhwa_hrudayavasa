import { useEffect, useRef, useMemo, useState } from 'react'
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
    vec2 frag = uv * uRes; // Maps to logical CSS pixels completely agnostic of dpr
    
    vec2 cellIdx = floor(frag / CELL);
    vec2 cellCnt = floor(uRes / CELL);

    // ── Letterboxing logic ────────────────────────────────────
    float canvasAspect = uRes.x / uRes.y;
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

    // ── Mouse Shimmer ─────────────────────────────────────────
    // Apply canvas aspect ratio to the distance math so the highlight is a perfect circle
    vec2 aspectVec = vec2(canvasAspect, 1.0);
    float mDist = distance(uMouse * aspectVec, cellUv * aspectVec);
    // Removing the fluid ripple displacement

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

    // ── Dynamic Character Scramble ─────────
    // Characters stay static by default, but scramble like the Matrix when the cursor hovers them
    float highlightNoise = random(cellIdx) * 0.02;
    float isHovered = step(mDist + highlightNoise, 0.04);
    
    // Shift the seed based on time ONLY if hovered
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
    // The key to the facial clarity is mapping the image's shadows to TEXT OPACITY.
    // Dark parts fade cleanly into black background space. Highlights become 100% visible text.
    
    // Normalize the figure's brightness (0.0 to ~0.80)
    float figureLuma = smoothstep(0.0, 0.8, bright);

    // Opacity: Map dark face to subtle 20% visible text, and bright jewels to 100% solid text
    float textOpacity = isFigure * mix(0.15, 1.0, figureLuma);

    // Sharpen the color: Deep burnt orange in shadows -> Bright popping orange in highlights
    vec3 col = mix(vec3(0.8, 0.3, 0.05), vec3(1.0, 0.65, 0.15), figureLuma);

    // ── Intro Reveal Animation (Center outwards) ──────────────
    // Starts immediately on load, but expands slowly across the figure
    float introTime = uTime * 0.6; 
    
    // Calculate distance from the center of the canvas [0.5, 0.5]
    // Center is 0, corners are ~0.707
    float distFromCenter = distance(cellUv, vec2(0.5, 0.5));
    float sweepEdge = distFromCenter * 1.5; // Scale it so the edge reaches corners efficiently
    
    float popNoise = random(cellIdx) * 0.15; // Jitter the reveal per-cell
    float sweepPos = introTime - (sweepEdge + popNoise);
    
    // Hide text that the sweep hasn't reached yet
    float reveal = smoothstep(0.0, 0.01, sweepPos);
    
    // Bright white flash at the leading edge of the sweep
    float flash = smoothstep(0.0, 0.05, sweepPos) * (1.0 - smoothstep(0.05, 0.6, sweepPos));
    
    textOpacity *= reveal;
    col = mix(col, vec3(1.0, 1.0, 1.0), flash);

    // ── Mouse Hover Boost (Glitchy Cluster)
    col = mix(col, vec3(1.0, 1.0, 1.0), isHovered);
    
    // Ensure the hovered area is visible even if it's in shadow
    textOpacity = max(textOpacity, isHovered * isFigure);

    // Apply the opacity to the character mask
    gl_FragColor = vec4(col, cG * textOpacity);
  }
`

/* ══════════════════════════════════════════════════════
   ShaderPlane — viewport-filling quad inside R3F Canvas
══════════════════════════════════════════════════════ */
function ShaderPlane({ portraitTex, atlasTex, mouseRef, imgAspect, isLoaded }) {
    const matRef = useRef()
    const { size, viewport } = useThree()

    const uniforms = useMemo(() => ({
        uPortrait: { value: portraitTex },
        uAtlas: { value: atlasTex },
        uMouse: { value: new THREE.Vector2(-10.0, -10.0) },
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(size.width, size.height) },
        uImgAspect: { value: imgAspect },
        uLoaded: { value: isLoaded ? 1.0 : 0.0 }
    }), [portraitTex, atlasTex, imgAspect, isLoaded])

    useFrame(({ clock }) => {
        if (!matRef.current) return
        matRef.current.uniforms.uTime.value = clock.getElapsedTime()
        matRef.current.uniforms.uMouse.value.set(mouseRef.current[0], mouseRef.current[1])
        matRef.current.uniforms.uRes.value.set(size.width, size.height)
    })

    return (
        <mesh>
            <planeGeometry args={[viewport.width, viewport.height]} />
            <shaderMaterial
                ref={matRef}
                vertexShader={VS}
                fragmentShader={FS}
                uniforms={uniforms}
                transparent
                depthWrite={false}
            />
        </mesh>
    )
}

/* ══════════════════════════════════════════════════════
   Exported component
══════════════════════════════════════════════════════ */
export default function KrishnaShader() {
    const containerRef = useRef(null)
    const mouseRef = useRef([-10.0, -10.0])
    const [imgAspect, setImgAspect] = useState(0.75)   // portrait default until loaded
    const [isLoaded, setIsLoaded] = useState(false)

    const atlasTex = useMemo(() => buildAtlasTex(), [])

    // Load portrait, capture natural aspect ratio → triggers re-render of ShaderPlane
    const portraitTex = useMemo(() => {
        const loader = new THREE.TextureLoader()
        const t = loader.load('/kisnu.png', (tex) => {
            if (tex.image) {
                setImgAspect(tex.image.naturalWidth / tex.image.naturalHeight)
                setIsLoaded(true)
            }
        })
        t.minFilter = t.magFilter = THREE.LinearFilter
        return t
    }, [])

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
        const onLeave = () => { mouseRef.current = [-10.0, -10.0] }
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
                />
            </Canvas>
        </div>
    )
}
