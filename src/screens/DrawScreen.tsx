import { useRef, useState, useEffect } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

type Mode = 'draw' | 'erase' | 'glitter' | 'stamp'
type StampType = 'star' | 'puck' | 'snow' | 'heart'

const COLORS: { hex: string; name: string }[] = [
  { hex: '#E23B4E', name: 'Red' },
  { hex: '#F5A300', name: 'Orange' },
  { hex: '#FFD700', name: 'Yellow' },
  { hex: '#2FA35A', name: 'Green' },
  { hex: '#1657C7', name: 'Blue' },
  { hex: '#5BC0EB', name: 'Sky' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#14171C', name: 'Black' },
]

const SIZES = [
  { value: 5,  label: 'S' },
  { value: 16, label: 'M' },
  { value: 34, label: 'L' },
]

const STAMPS: { type: StampType; emoji: string }[] = [
  { type: 'star',  emoji: '⭐' },
  { type: 'puck',  emoji: '🏒' },
  { type: 'snow',  emoji: '❄️' },
  { type: 'heart', emoji: '❤️' },
]

const MAX_HISTORY = 20

interface Props { settings: Settings }

export function DrawScreen({ settings }: Props) {
  const [color, setColor] = useState('#E23B4E')
  const [size, setSize] = useState(16)
  const [mode, setMode] = useState<Mode>('draw')
  const [stamp, setStamp] = useState<StampType>('star')
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const lastPt    = useRef({ x: 0, y: 0 })
  const prevMid   = useRef({ x: 0, y: 0 })
  const snapshots = useRef<string[]>([])   // data-URL undo stack
  const dprRef    = useRef(1)
  const { playPop } = useAudio(settings.soundOn)
  const team = settings.teamColor

  // Size canvas to wrapper at physical pixel density
  useEffect(() => {
    const c = canvasRef.current, w = wrapRef.current
    if (!c || !w) return
    function resize() {
      if (!c || !w) return
      const ratio = window.devicePixelRatio || 1
      dprRef.current = ratio
      const lw = w.clientWidth, lh = w.clientHeight
      c.width  = Math.round(lw * ratio)
      c.height = Math.round(lh * ratio)
      c.style.width  = lw + 'px'
      c.style.height = lh + 'px'
      c.getContext('2d')!.scale(ratio, ratio)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  function cx() { return canvasRef.current?.getContext('2d') ?? null }

  function wpt(e: React.PointerEvent) {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // ── Undo / history ──────────────────────────────────────────────────────
  function saveSnap() {
    const c = canvasRef.current; if (!c) return
    snapshots.current = [...snapshots.current.slice(-(MAX_HISTORY - 1)), c.toDataURL('image/png')]
    setCanUndo(true)
  }

  function undo() {
    const x = cx(), c = canvasRef.current
    if (!x || !c || !snapshots.current.length) return
    playPop()
    const url = snapshots.current[snapshots.current.length - 1]
    snapshots.current = snapshots.current.slice(0, -1)
    setCanUndo(snapshots.current.length > 0)
    const img = new Image()
    img.onload = () => {
      x.clearRect(0, 0, c.width / dprRef.current, c.height / dprRef.current)
      x.drawImage(img, 0, 0, c.width / dprRef.current, c.height / dprRef.current)
    }
    img.src = url
  }

  function clear() {
    const x = cx(), c = canvasRef.current; if (!x || !c) return
    saveSnap()
    x.clearRect(0, 0, c.width / dprRef.current, c.height / dprRef.current)
    playPop()
  }

  // ── Glitter particles ────────────────────────────────────────────────────
  function scatter(x: CanvasRenderingContext2D, px: number, py: number) {
    const sparkColors = [color, '#FFD700', '#fff', color]
    x.save()
    x.globalCompositeOperation = 'source-over'
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2
      const d = 5 + Math.random() * (size + 14)
      const r = 1 + Math.random() * 2.5
      x.fillStyle  = sparkColors[Math.floor(Math.random() * sparkColors.length)]
      x.globalAlpha = 0.5 + Math.random() * 0.5
      x.beginPath(); x.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, r, 0, Math.PI * 2); x.fill()
    }
    x.restore()
  }

  // ── Stamps ───────────────────────────────────────────────────────────────
  function placeStamp(x: CanvasRenderingContext2D, px: number, py: number) {
    const s = size * 2.2 + 18
    x.save()
    x.globalCompositeOperation = 'source-over'
    x.globalAlpha = 1
    x.translate(px, py)

    if (stamp === 'star') {
      x.fillStyle = color
      x.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 === 0 ? s : s * 0.42
        i === 0 ? x.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : x.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      x.closePath(); x.fill()
      // shine
      x.fillStyle = 'rgba(255,255,255,.3)'
      x.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 === 0 ? s * 0.46 : s * 0.19
        i === 0 ? x.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : x.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      x.closePath(); x.fill()
    }

    if (stamp === 'puck') {
      x.fillStyle = '#14171C'
      x.beginPath(); x.ellipse(0, 0, s * 1.1, s * 0.74, 0, 0, Math.PI * 2); x.fill()
      x.fillStyle = 'rgba(255,255,255,.18)'
      x.beginPath(); x.ellipse(-s * 0.08, -s * 0.2, s * 0.65, s * 0.22, 0, 0, Math.PI * 2); x.fill()
    }

    if (stamp === 'snow') {
      x.strokeStyle = color === '#ffffff' ? '#5BC0EB' : color
      x.lineWidth   = Math.max(2.5, s * 0.1)
      x.lineCap     = 'round'
      x.globalAlpha = 0.9
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3
        x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * s, Math.sin(a) * s); x.stroke()
        for (const dir of [-1, 1]) {
          const bx = Math.cos(a) * s * 0.52, by = Math.sin(a) * s * 0.52
          const ba = a + dir * Math.PI / 3
          x.beginPath(); x.moveTo(bx, by)
          x.lineTo(bx + Math.cos(ba) * s * 0.28, by + Math.sin(ba) * s * 0.28); x.stroke()
        }
      }
    }

    if (stamp === 'heart') {
      x.fillStyle = color
      const h = s * 0.9
      x.beginPath()
      x.moveTo(0, -h * 0.18)
      x.bezierCurveTo( h * 0.5, -h,  h, -h * 0.5,  h * 0.8,  h * 0.34)
      x.bezierCurveTo( h * 0.5,  h * 0.8, 0, h, 0, h)
      x.bezierCurveTo(0, h, -h * 0.5,  h * 0.8, -h * 0.8,  h * 0.34)
      x.bezierCurveTo(-h, -h * 0.5, -h * 0.5, -h, 0, -h * 0.18)
      x.closePath(); x.fill()
      x.fillStyle = 'rgba(255,255,255,.28)'
      x.beginPath()
      x.ellipse(-h * 0.24, -h * 0.16, h * 0.16, h * 0.1, -Math.PI / 4, 0, Math.PI * 2)
      x.fill()
    }

    x.restore()
  }

  // ── Stroke style ─────────────────────────────────────────────────────────
  function applyStroke(x: CanvasRenderingContext2D) {
    x.lineCap = 'round'; x.lineJoin = 'round'
    if (mode === 'erase') {
      x.globalCompositeOperation = 'destination-out'
      x.strokeStyle = 'rgba(0,0,0,1)'; x.lineWidth = size * 2.8
    } else {
      x.globalCompositeOperation = 'source-over'
      x.strokeStyle = color; x.lineWidth = size
      x.globalAlpha = mode === 'glitter' ? 0.82 : 1
    }
  }

  // ── Pointer events ────────────────────────────────────────────────────────
  function onDown(e: React.PointerEvent) {
    const p = wpt(e)
    if (mode === 'stamp') {
      const x = cx(); if (!x) return
      saveSnap(); placeStamp(x, p.x, p.y); playPop()
      return
    }
    saveSnap()
    drawing.current = true
    lastPt.current  = p
    prevMid.current = p
    const x = cx(); if (!x) return
    applyStroke(x)
    x.beginPath()
    x.arc(p.x, p.y, mode === 'erase' ? size * 1.4 : size / 2, 0, Math.PI * 2)
    x.fill()
    if (mode === 'glitter') scatter(x, p.x, p.y)
    x.globalAlpha = 1
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }

  function onMove(e: React.PointerEvent) {
    const p = wpt(e)
    setCursor(p)
    if (!drawing.current) return
    const x = cx(); if (!x) return
    // Quadratic bezier through midpoints → silky smooth curves
    const mid = { x: (lastPt.current.x + p.x) / 2, y: (lastPt.current.y + p.y) / 2 }
    applyStroke(x)
    x.beginPath()
    x.moveTo(prevMid.current.x, prevMid.current.y)
    x.quadraticCurveTo(lastPt.current.x, lastPt.current.y, mid.x, mid.y)
    x.stroke()
    if (mode === 'glitter' && Math.random() < 0.4) scatter(x, mid.x, mid.y)
    x.globalAlpha = 1
    prevMid.current = mid
    lastPt.current  = p
  }

  function onUp()    { drawing.current = false }
  function onLeave() { drawing.current = false; setCursor(null) }

  // ── Derived state ─────────────────────────────────────────────────────────
  const isErasing = mode === 'erase'
  const cursorSz  = isErasing ? size * 2.8 : size
  const colorName = COLORS.find(c => c.hex === color)?.name ?? ''
  const sizeLabel = SIZES.find(s => s.value === size)?.label ?? ''

  const modeHint =
    mode === 'glitter' ? '✨ Glitter — draw sparkles!'  :
    mode === 'erase'   ? '⬡ Eraser'                    :
    mode === 'stamp'   ? 'Tap the canvas to stamp!'     :
    `Drawing with ${colorName} • ${sizeLabel}`

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 20px 14px', gap: 10, overflow: 'hidden' }}>

      {/* ── TITLE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 32, color: '#0B2A5B' }}>Color & Draw</div>
        <div style={{ fontSize: 16, color: '#7184A0' }}>{modeHint}</div>
      </div>

      {/* ── CANVAS ── */}
      <div
        ref={wrapRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
        style={{
          flex: 1, position: 'relative',
          background: '#FAFCFF',
          borderRadius: 24,
          boxShadow: 'inset 0 0 0 6px #EAF1F9, 0 10px 24px rgba(11,42,91,.13)',
          overflow: 'hidden',
          cursor: 'none',
          touchAction: 'none',
        }}
      >
        {/* Coloring-book guide: outline only, no fill */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Jersey 25'",
          fontSize: 'min(72vh, 52vw)',
          color: 'rgba(22,87,199,.07)',
          WebkitTextStroke: '3px rgba(22,87,199,.19)',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
        }}>
          {settings.jerseyNumber}
        </div>

        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
        />

        {/* Live cursor preview */}
        {cursor && (
          <div style={{
            position: 'absolute',
            left: cursor.x, top: cursor.y,
            width:  cursorSz,
            height: cursorSz,
            borderRadius: '50%',
            border: isErasing ? '2.5px dashed #9DB1CF' : `2px solid rgba(255,255,255,.85)`,
            background: isErasing ? 'rgba(180,200,220,.12)' : color + 'aa',
            transform: 'translate(-50%,-50%)',
            boxShadow: isErasing ? 'none' : `0 0 0 1.5px ${color}55`,
            pointerEvents: 'none',
            zIndex: 10,
            transition: 'width .06s, height .06s',
          }} />
        )}
      </div>

      {/* ── BOTTOM TOOLBAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: '#fff', borderRadius: 20, padding: '10px 20px',
        boxShadow: '0 8px 0 rgba(11,42,91,.08)',
        flexShrink: 0,
      }}>

        {/* COLORS — 2 × 5 grid */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#B0C0D4', marginBottom: 6 }}>COLORS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 34px)', gap: 5 }}>
            {COLORS.map(c => {
              const sel = (mode === 'draw' || mode === 'glitter') && color === c.hex
              return (
                <button key={c.hex}
                  onClick={() => { setColor(c.hex); if (mode === 'erase') setMode('draw'); playPop() }}
                  title={c.name}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                    background: c.hex,
                    outline: c.hex === '#ffffff' ? '2px solid #DDE8F0' : 'none',
                    boxShadow: sel
                      ? `0 0 0 3px #fff, 0 0 0 6px ${c.hex === '#ffffff' ? '#9DB1CF' : c.hex}`
                      : '0 3px 7px rgba(0,0,0,.22)',
                    transform: sel ? 'scale(1.16) translateY(-2px)' : 'scale(1)',
                    transition: 'transform .12s, box-shadow .12s',
                    touchAction: 'manipulation',
                  }}
                />
              )
            })}
          </div>
        </div>

        <Divider />

        {/* SIZES */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#B0C0D4', marginBottom: 6 }}>SIZE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SIZES.map(s => {
              const sel = !isErasing && size === s.value
              return (
                <button key={s.value}
                  onClick={() => { setSize(s.value); if (mode === 'erase') setMode('draw'); playPop() }}
                  style={{
                    width: 74, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
                    background: sel ? '#E7EFFb' : '#F2F7FB',
                    boxShadow: sel ? `inset 0 0 0 2px ${team}` : 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  <div style={{
                    width: s.value * 0.45 + 4, height: s.value * 0.45 + 4,
                    borderRadius: '50%', flexShrink: 0,
                    background: sel ? color : '#B0C0D4',
                    transition: 'background .12s',
                  }} />
                  <span style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 12, color: sel ? team : '#9DB1CF' }}>{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* TOOLS */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#B0C0D4', marginBottom: 6 }}>TOOLS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <ToolBtn active={mode === 'glitter'} color="#FFD700"  onClick={() => { setMode(mode === 'glitter' ? 'draw' : 'glitter'); playPop() }}>✨ Glitter</ToolBtn>
            <ToolBtn active={mode === 'erase'}   color="#9DB1CF"  onClick={() => { setMode(mode === 'erase'   ? 'draw' : 'erase');   playPop() }}>⬡ Eraser</ToolBtn>
          </div>
        </div>

        <Divider />

        {/* STAMPS */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: mode === 'stamp' ? team : '#B0C0D4', marginBottom: 6 }}>STAMPS</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STAMPS.map(st => {
              const sel = mode === 'stamp' && stamp === st.type
              return (
                <button key={st.type}
                  onClick={() => { setStamp(st.type); setMode('stamp'); playPop() }}
                  style={{
                    width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer',
                    fontSize: 24, background: sel ? team : '#F2F7FB',
                    boxShadow: sel ? `0 5px 0 ${team}88` : '0 3px 0 rgba(11,42,91,.1)',
                    transform: sel ? 'translateY(-3px)' : 'none',
                    transition: 'background .12s, transform .12s, box-shadow .12s',
                    touchAction: 'manipulation',
                  }}
                >{st.emoji}</button>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* UNDO + CLEAR */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#B0C0D4', marginBottom: 6 }}>EDIT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button
              onClick={undo}
              disabled={!canUndo}
              style={{
                width: 84, height: 28, borderRadius: 10, border: 'none', cursor: canUndo ? 'pointer' : 'default',
                fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 14,
                background: canUndo ? '#EEF3F9' : '#F8FAFB',
                color: canUndo ? '#0B2A5B' : '#C9D6E6',
                boxShadow: canUndo ? '0 3px 0 rgba(11,42,91,.1)' : 'none',
                touchAction: 'manipulation',
                transition: 'opacity .15s',
              }}
            >↩ Undo</button>
            <button
              onClick={clear}
              style={{
                width: 84, height: 28, borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 14,
                background: '#0C1424', color: '#fff',
                boxShadow: '0 4px 0 #000', touchAction: 'manipulation',
              }}
            >🗑 Clear</button>
          </div>
        </div>

      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 2, height: 72, background: '#EEF3F9', borderRadius: 2, flexShrink: 0 }} />
}

function ToolBtn({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: 90, height: 28, borderRadius: 10, border: 'none', cursor: 'pointer',
      fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 13,
      background: active ? color + '22' : '#F2F7FB',
      color: active ? (color === '#FFD700' ? '#A07800' : color) : '#9DB1CF',
      boxShadow: active ? `inset 0 0 0 2px ${color}` : 'none',
      touchAction: 'manipulation',
      transition: 'background .12s, color .12s, box-shadow .12s',
    }}>{children}</button>
  )
}
