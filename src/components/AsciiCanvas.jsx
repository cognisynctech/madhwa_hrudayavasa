import { useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

/**
 * AsciiCanvas — renders an image as interactive ASCII/binary art.
 * - Characters sourced from a "bits & bytes" charset
 * - Mouse proximity → nearby chars glow white
 * - Mouse move → parallax on face/neck/shoulder zones
 */

// Dense→sparse for brightness mapping
const CHARSET = '01010110100111001010111001001011010010110100101101001011'
const FONT_SIZE = 10     // px per character cell
const PARALLAX_SCALE = 0.025  // how strong the parallax is

export default function AsciiCanvas({ src, className }) {
    const canvasRef = useRef(null)
    const frameRef = useRef(null)
    const stateRef = useRef({
        chars: [],
        mouseX: -999,
        mouseY: -999,
        width: 0,
        height: 0,
    })

    /* ─── Load image and build character grid ─── */
    useEffect(() => {
        const canvas = canvasRef.current
        const offCanvas = document.createElement('canvas')
        const offCtx = offCanvas.getContext('2d')
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = src

        img.onload = () => {
            const W = canvas.offsetWidth
            const H = canvas.offsetHeight
            canvas.width = W
            canvas.height = H

            // Draw image to offscreen canvas (fill cover)
            const scale = Math.max(W / img.width, H / img.height)
            const sw = img.width * scale
            const sh = img.height * scale
            const sx = (W - sw) / 2
            const sy = (H - sh) / 2
            offCanvas.width = W
            offCanvas.height = H
            offCtx.drawImage(img, sx, sy, sw, sh)

            const data = offCtx.getImageData(0, 0, W, H).data
            const cols = Math.floor(W / FONT_SIZE)
            const rows = Math.floor(H / FONT_SIZE)

            const chars = []
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const px = Math.floor(col * FONT_SIZE + FONT_SIZE / 2)
                    const py = Math.floor(row * FONT_SIZE + FONT_SIZE / 2)
                    const i = (py * W + px) * 4
                    const r = data[i]
                    const g = data[i + 1]
                    const b = data[i + 2]
                    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255

                    // Skip very bright pixels (background) — keep the silhouette
                    if (brightness > 0.88) continue

                    // Map brightness to char density
                    const charIdx = Math.floor(brightness * (CHARSET.length - 1))
                    const char = CHARSET[charIdx]

                    // Zone: 0=top(face), 1=mid(neck/shoulders), 2=bottom(body)
                    let zone = 2
                    if (row < rows * 0.35) zone = 0
                    else if (row < rows * 0.65) zone = 1

                    chars.push({ char, r, g, b, alpha: 0.7 + brightness * 0.3, cx: col * FONT_SIZE, cy: row * FONT_SIZE, zone })
                }
            }

            stateRef.current = { chars, mouseX: -999, mouseY: -999, width: W, height: H }
            startLoop(canvas)
        }

        return () => cancelAnimationFrame(frameRef.current)
    }, [src])

    /* ─── Animation loop ─── */
    const startLoop = (canvas) => {
        const ctx = canvas.getContext('2d')

        const tick = () => {
            const { chars, mouseX, mouseY, width, height } = stateRef.current
            ctx.clearRect(0, 0, width, height)
            ctx.font = `${FONT_SIZE}px monospace`
            ctx.textBaseline = 'top'

            // Parallax offsets per zone (face moves most)
            const mxN = (mouseX / width - 0.5) // -0.5 … 0.5
            const myN = (mouseY / height - 0.5)
            const zoneOffset = [
                { x: mxN * PARALLAX_SCALE * 38, y: myN * PARALLAX_SCALE * 38 }, // face
                { x: mxN * PARALLAX_SCALE * 20, y: myN * PARALLAX_SCALE * 20 }, // neck
                { x: mxN * PARALLAX_SCALE * 8, y: myN * PARALLAX_SCALE * 8 }, // body
            ]

            chars.forEach(({ char, r, g, b, alpha, cx, cy, zone }) => {
                const off = zoneOffset[zone]
                const x = cx + off.x
                const y = cy + off.y

                // Mouse proximity glow
                const dx = mouseX - cx
                const dy = mouseY - cy
                const dist = Math.hypot(dx, dy)
                const glow = Math.max(0, 1 - dist / 90) // 90px radius

                // Blend original color with white based on proximity
                const fr = Math.round(r + (242 - r) * glow)
                const fg = Math.round(g + (240 - g) * glow)
                const fb = Math.round(b + (235 - b) * glow)
                const fa = Math.min(1, alpha + glow * 0.4)

                ctx.fillStyle = `rgba(${fr},${fg},${fb},${fa})`
                ctx.fillText(char, x, y)
            })

            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
    }

    /* ─── Mouse tracking ─── */
    const handleMove = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        stateRef.current.mouseX = e.clientX - rect.left
        stateRef.current.mouseY = e.clientY - rect.top
    }, [])

    const handleLeave = useCallback(() => {
        stateRef.current.mouseX = -999
        stateRef.current.mouseY = -999
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className={className}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
        />
    )
}

AsciiCanvas.propTypes = {
    src: PropTypes.string.isRequired,
    className: PropTypes.string,
}
