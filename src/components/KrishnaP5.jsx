import { useEffect, useRef } from 'react'

/**
 * KrishnaP5 — Interactive character/text grid for Udupi Krishna image.
 *
 * Uses vanilla Canvas + requestAnimationFrame to replicate the p5.js
 * aesthetic without the npm dependency issues.
 *
 * Features:
 *  - Samples /kisnu.png at (COLS × ROWS) resolution
 *  - Maps brightness → character from a dense serif charset
 *  - Mouse hover within radius → characters ripple/swap, glow warm→white
 *  - Idle animation: subtle random char flicker in dark silhouette regions
 *  - Colour: warm amber/gold base (respects Krishna's golden palette) → white on hover
 */

const CHARSET = '@#S%&B01bo+;:,. '   // dense → sparse
const CELL = 8                     // px per cell (character size)
const GLOW_R = 110                   // mouse glow radius in px
const GLOW_EASE = 0.15                // glow lerp speed

function lerp(a, b, t) { return a + (b - a) * t }

export default function KrishnaP5() {
    const containerRef = useRef(null)
    const rafRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        /* ── Create canvas ── */
        const canvas = document.createElement('canvas')
        canvas.style.cssText = 'position:absolute;inset:0;display:block;cursor:crosshair;'
        container.appendChild(canvas)
        const ctx = canvas.getContext('2d')

        let W = container.offsetWidth
        let H = container.offsetHeight
        canvas.width = W
        canvas.height = H

        /* ── Load image and sample cells ── */
        const img = new globalThis.Image()
        img.src = '/kisnu.png'

        img.onload = () => {
            buildCells(W, H)
            loop()
        }

        /* ── State ── */
        let cells = []
        let mouseX = -999
        let mouseY = -999

        function buildCells(w, h) {
            cells = []
            const cols = Math.floor(w / CELL)
            const rows = Math.floor(h / CELL)

            // Draw image to an offscreen canvas for pixel sampling
            const off = document.createElement('canvas')
            const octx = off.getContext('2d')
            off.width = cols
            off.height = rows
            octx.drawImage(img, 0, 0, cols, rows)
            const data = octx.getImageData(0, 0, cols, rows).data

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const i = (row * cols + col) * 4
                    const r = data[i]
                    const g = data[i + 1]
                    const b = data[i + 2]
                    const br = (r * 0.299 + g * 0.587 + b * 0.114) / 255

                    if (br > 0.92) continue   // skip near-white bg pixels

                    const cIdx = Math.floor(br * (CHARSET.length - 1))

                    // Base colour: warm amber derived from the actual pixel
                    // Shift toward gold: boost red, mute blue
                    const cr = Math.min(255, r + 30)
                    const cg = Math.min(255, g * 0.65)
                    const cb = Math.min(255, b * 0.2)

                    cells.push({
                        x: col * CELL,
                        y: row * CELL,
                        br,
                        base: CHARSET[cIdx],
                        char: CHARSET[cIdx],
                        cr, cg, cb,
                        glow: 0,
                        flick: 0,
                    })
                }
            }
        }

        /* ── Main render loop ── */
        function loop() {
            ctx.fillStyle = '#0a0a0a'
            ctx.fillRect(0, 0, W, H)
            ctx.font = `${CELL * 0.88}px monospace`
            ctx.textBaseline = 'top'

            for (let i = 0, n = cells.length; i < n; i++) {
                const c = cells[i]

                // Mouse distance
                const dx = mouseX - c.x
                const dy = mouseY - c.y
                const dist = Math.hypot(dx, dy)
                const tgt = dist < GLOW_R ? 1 - dist / GLOW_R : 0

                // Smooth glow
                c.glow = lerp(c.glow, tgt, GLOW_EASE)

                // Trigger flicker near cursor
                if (c.glow > 0.1 && c.flick === 0) {
                    c.flick = Math.floor(3 + Math.random() * 8)
                }

                // Resolve character
                if (c.flick > 0) {
                    c.flick--
                    // Swap to a random dense char from the silhouette part of charset
                    const rIdx = Math.floor(Math.random() * 8)
                    c.char = CHARSET[rIdx]
                } else if (c.br < 0.5 && Math.random() < 0.004) {
                    c.char = CHARSET[Math.floor(Math.random() * 5)]
                    c.flick = Math.floor(3 + Math.random() * 5)
                } else if (c.flick === 0) {
                    c.char = c.base
                }

                // Final colour: amber base → cream white on hover
                const fr = Math.round(lerp(c.cr, 242, c.glow))
                const fg = Math.round(lerp(c.cg, 240, c.glow))
                const fb = Math.round(lerp(c.cb, 235, c.glow))

                // Alpha: dark pixels fully visible; bright pixels dimmer
                const rawAlpha = lerp(0.55, 1, c.glow) * (1 - c.br * 0.55) * 255
                const alpha = Math.round(Math.min(255, Math.max(60, rawAlpha)))

                ctx.fillStyle = `rgba(${fr},${fg},${fb},${alpha / 255})`
                ctx.fillText(c.char, c.x, c.y)
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        /* ── Mouse tracking ── */
        const onMove = (e) => {
            const rect = canvas.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top
        }
        const onLeave = () => { mouseX = -999; mouseY = -999 }

        container.addEventListener('mousemove', onMove)
        container.addEventListener('mouseleave', onLeave)

        /* ── Resize ── */
        const onResize = () => {
            W = container.offsetWidth
            H = container.offsetHeight
            canvas.width = W
            canvas.height = H
            buildCells(W, H)
        }

        const ro = new ResizeObserver(onResize)
        ro.observe(container)

        return () => {
            cancelAnimationFrame(rafRef.current)
            container.removeEventListener('mousemove', onMove)
            container.removeEventListener('mouseleave', onLeave)
            ro.disconnect()
            if (container.contains(canvas)) canvas.remove()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{ position: 'absolute', inset: 0, background: '#0a0a0a', overflow: 'hidden' }}
        />
    )
}
