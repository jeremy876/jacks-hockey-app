import { useRef, useState } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
}

const PALETTE = ['#E23B4E', '#1657C7', '#2FA35A', '#F5A300', '#8B5CF6', '#5BC0EB', '#14171C']
const SIZES = [8, 16, 28]

export function DrawScreen({ settings }: Props) {
  const [color, setColor] = useState('#E23B4E')
  const [size, setSize] = useState(16)
  const [erasing, setErasing] = useState(false)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { playPop } = useAudio(settings.soundOn)
  const team = settings.teamColor

  function getCtx() { return canvasRef.current?.getContext('2d') ?? null }

  function pt(e: React.PointerEvent) {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }

  function applyStroke(ctx: CanvasRenderingContext2D) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (erasing) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'; ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = size * 2.2
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color; ctx.fillStyle = color
      ctx.lineWidth = size
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    drawing.current = true
    const p = pt(e); last.current = p
    const ctx = getCtx(); if (!ctx) return
    applyStroke(ctx)
    ctx.beginPath()
    ctx.arc(p.x, p.y, erasing ? size * 1.1 : size / 2, 0, Math.PI * 2)
    ctx.fill()
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return
    const ctx = getCtx(); if (!ctx) return
    const p = pt(e)
    applyStroke(ctx)
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    last.current = p
  }

  function onPointerUp() { drawing.current = false }

  function pickColor(c: string) { playPop(); setColor(c); setErasing(false) }
  function pickEraser() { playPop(); setErasing(true) }
  function pickSize(s: number) { playPop(); setSize(s); setErasing(false) }
  function clear() {
    const ctx = getCtx(), c = canvasRef.current
    if (ctx && c) ctx.clearRect(0, 0, c.width, c.height)
    playPop()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
      <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Color & Draw</div>
      <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 14 }}>Pick a crayon and draw on the ice. Color in the big {settings.jerseyNumber}!</div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'stretch', flex: 1 }}>
        {/* canvas */}
        <div style={{
          position: 'relative', width: 840, flex: 'none',
          background: '#fff', borderRadius: 24,
          boxShadow: 'inset 0 0 0 6px #EAF1F9, 0 10px 24px rgba(11,42,91,.14)',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Jersey 25'", fontSize: 300, color: 'rgba(22,87,199,.07)', pointerEvents: 'none'
          }}>{settings.jerseyNumber}</div>
          <canvas
            ref={canvasRef}
            width={840}
            height={474}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
          />
        </div>

        {/* tools */}
        <div style={{ width: 164, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 8px 0 rgba(11,42,91,.08)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#9DB1CF', marginBottom: 12 }}>CRAYONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, placeItems: 'center' }}>
              {PALETTE.map(c => {
                const sel = !erasing && color === c
                return (
                  <button key={c} onClick={() => pickColor(c)} style={{
                    width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                    background: c,
                    boxShadow: sel ? `0 0 0 4px #fff, 0 0 0 8px ${c}` : '0 4px 8px rgba(0,0,0,.18)',
                    transform: sel ? 'scale(1.06)' : 'none', transition: 'transform .12s',
                    touchAction: 'manipulation'
                  }} />
                )
              })}
              {/* eraser */}
              <button onClick={pickEraser} style={{
                width: 54, height: 54, borderRadius: '50%', cursor: 'pointer', padding: 0,
                background: '#fff', border: '4px solid #C9D6E6',
                backgroundImage: 'repeating-linear-gradient(45deg,#EAF1F9 0 6px,#fff 6px 12px)',
                boxShadow: erasing ? '0 0 0 4px #fff, 0 0 0 8px #C9D6E6' : '0 4px 8px rgba(0,0,0,.12)',
                transform: erasing ? 'scale(1.06)' : 'none', transition: 'transform .12s',
                touchAction: 'manipulation'
              }} />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 8px 0 rgba(11,42,91,.08)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#9DB1CF', marginBottom: 12 }}>SIZE</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {SIZES.map(s => {
                const sel = !erasing && size === s
                return (
                  <button key={s} onClick={() => pickSize(s)} style={{
                    width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: sel ? '#E7EFFb' : '#F2F7FB',
                    boxShadow: sel ? `inset 0 0 0 3px ${team}` : 'none',
                    touchAction: 'manipulation'
                  }}>
                    <div style={{ width: s, height: s, borderRadius: '50%', background: '#0B2A5B' }} />
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={clear} style={{
            cursor: 'pointer', border: 'none', background: '#0C1424', color: '#fff',
            fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 19, padding: 14,
            borderRadius: 16, boxShadow: '0 6px 0 #000', touchAction: 'manipulation'
          }}>Clear</button>
        </div>
      </div>
    </div>
  )
}
