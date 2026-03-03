import { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import * as THREE from 'three'

/**
 * KrishnaParticles — WebGL particle system via Three.js.
 * Renders the supplied image as a field of glowing particles.
 * - Particles form the silhouette of the image
 * - Mouse hover → particles scatter outward (repel) then snap back
 * - Mouse position drives a color shift (golden glow moves with cursor)
 * - Inspired by the "Awwwards" / goodfella.io dot-matrix aesthetic
 */

const VS = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  attribute vec3  aOrigPos;
  attribute float aBrightness;

  uniform float uTime;
  uniform vec2  uMouse;      // normalised -1..1
  uniform float uRepel;      // 0: idle, 1: full repel

  varying vec3  vColor;
  varying float vBrightness;

  void main() {
    vColor      = aColor;
    vBrightness = aBrightness;

    vec3 pos = aOrigPos;

    // Repel from mouse
    vec4 mvPos  = modelViewMatrix * vec4(aOrigPos, 1.0);
    vec4 clip   = projectionMatrix * mvPos;
    vec2 ndc    = clip.xy / clip.w;     // -1..1 space
    vec2 delta  = ndc - uMouse;
    float dist  = length(delta);
    float force = uRepel * smoothstep(0.35, 0.0, dist) * 1.8;
    pos.xy     += normalize(delta) * force;

    // Idle float
    pos.y += sin(uTime * 0.6 + aOrigPos.x * 3.0) * 0.008;

    gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (1.0 + force * 0.6);
  }
`

const FS = /* glsl */`
  varying vec3  vColor;
  varying float vBrightness;

  void main() {
    // Circular point sprite
    vec2 uv   = gl_PointCoord - 0.5;
    float r   = length(uv);
    if (r > 0.5) discard;

    float alpha = smoothstep(0.5, 0.2, r);
    gl_FragColor = vec4(vColor * vBrightness, alpha * vBrightness);
  }
`

export default function KrishnaParticles({ src }) {
    const mountRef = useRef(null)
    const mouseRef = useRef({ x: 0, y: 0, over: false })

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const W = mount.clientWidth
        const H = mount.clientHeight

        /* ── Renderer ── */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.setClearColor(0x000000, 0)
        mount.appendChild(renderer.domElement)

        /* ── Scene & Camera ── */
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
        camera.position.z = 2.8

        /* ── Uniforms ── */
        const uniforms = {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uRepel: { value: 0 },
        }

        /* ── Sample image → build particle geometry ── */
        const buildParticles = (imgEl) => {
            const offCanvas = document.createElement('canvas')
            const COLS = 160   // horizontal samples — higher = more dense
            const ROWS = Math.round(COLS * (H / W))
            offCanvas.width = COLS
            offCanvas.height = ROWS
            const ctx = offCanvas.getContext('2d')
            ctx.drawImage(imgEl, 0, 0, COLS, ROWS)
            const data = ctx.getImageData(0, 0, COLS, ROWS).data

            const positions = []
            const colors = []
            const sizes = []
            const origPos = []
            const brightnesses = []

            const aspect = W / H
            const THRESHOLD = 0.87    // skip near-white background

            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    const i = (row * COLS + col) * 4
                    const r = data[i] / 255
                    const g = data[i + 1] / 255
                    const b = data[i + 2] / 255
                    const bright = r * 0.299 + g * 0.587 + b * 0.114

                    if (bright > THRESHOLD) continue

                    // Map to clip-space-ish coords between -aspect..aspect, -1..1
                    const x = ((col / COLS) - 0.5) * aspect * 2
                    const y = ((row / ROWS) - 0.5) * -2

                    // Tint: shift image colors toward a warm golden palette
                    // Original: sepia-ish browns → we boost red/gold channel
                    const cr = Math.min(1, r * 1 + 0.25)   // warm shift
                    const cg = g * 0.55
                    const cb = b * 0.15

                    positions.push(x, y, 0)
                    origPos.push(x, y, 0)
                    colors.push(cr, cg, cb)
                    sizes.push((1 - bright) * 5 + 1.5)  // darker pixels → bigger dots
                    brightnesses.push(0.4 + bright * 0.7)
                }
            }

            const geo = new THREE.BufferGeometry()
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
            geo.setAttribute('aOrigPos', new THREE.Float32BufferAttribute(origPos, 3))
            geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3))
            geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
            geo.setAttribute('aBrightness', new THREE.Float32BufferAttribute(brightnesses, 1))

            const mat = new THREE.ShaderMaterial({
                vertexShader: VS,
                fragmentShader: FS,
                uniforms,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })

            const points = new THREE.Points(geo, mat)
            scene.add(points)
        }

        /* ── Load image ── */
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => buildParticles(img)
        img.src = src

        /* ── Animation ── */
        let raf
        let prevTime = performance.now()
        let elapsed = 0

        const animate = () => {
            raf = requestAnimationFrame(animate)
            const now = performance.now()
            elapsed += (now - prevTime) / 1000
            prevTime = now
            uniforms.uTime.value = elapsed
            uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)

            // Smooth repel in/out
            const target = mouseRef.current.over ? 1 : 0
            uniforms.uRepel.value += (target - uniforms.uRepel.value) * 0.08

            renderer.render(scene, camera)
        }
        animate()

        /* ── Mouse tracking ── */
        const onMove = (e) => {
            const rect = mount.getBoundingClientRect()
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        }
        const onEnter = () => { mouseRef.current.over = true }
        const onLeave = () => { mouseRef.current.over = false }

        mount.addEventListener('mousemove', onMove)
        mount.addEventListener('mouseenter', onEnter)
        mount.addEventListener('mouseleave', onLeave)

        /* ── Resize ── */
        const onResize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            renderer.setSize(w, h)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(raf)
            mount.removeEventListener('mousemove', onMove)
            mount.removeEventListener('mouseenter', onEnter)
            mount.removeEventListener('mouseleave', onLeave)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            if (mount.contains(renderer.domElement)) {
                renderer.domElement.remove()
            }
        }
    }, [src])

    return (
        <div
            ref={mountRef}
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
        />
    )
}

KrishnaParticles.propTypes = {
    src: PropTypes.string.isRequired,
}
