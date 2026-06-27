import { useRef, useCallback } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

// The SVG path from the prototype — points roughly from bottom-left to top-right
const PATH_D = "M120,420 C260,420 250,150 430,180 C610,210 560,440 780,150"
// Net target region (SVG coords)
const NET_X = 780, NET_Y = 150, NET_RADIUS = 70

export function TraceScreen({ settings, onCelebrate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const puckRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const scored = useRef(false)
  const { playPop, playChime } = useAudio(settings.soundOn)

  // Get point on path nearest to pointer (coarse snap)
  const snapToPath = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const scaleX = 900 / rect.width
    const scaleY = 520 / rect.height
    const sx = (clientX - rect.left) * scaleX
    const sy = (clientY - rect.top) * scaleY

    const path = svg.querySelector('path') as SVGPathElement | null
    if (!path) return null
    const len = path.getTotalLength()
    let best = 0, bestDist = Infinity
    for (let t = 0; t <= len; t += len / 200) {
      const pt = path.getPointAtLength(t)
      const d = Math.hypot(pt.x - sx, pt.y - sy)
      if (d < bestDist) { bestDist = d; best = t }
    }
    if (bestDist > 90) return null
    const snapped = path.getPointAtLength(best)
    // Convert back to percentage of SVG viewBox
    return { x: (snapped.x / 900) * 100, y: (snapped.y / 520) * 100, svgX: snapped.x, svgY: snapped.y }
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    if (scored.current) return
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    movePuck(e.clientX, e.clientY)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || scored.current) return
    movePuck(e.clientX, e.clientY)
  }

  function movePuck(clientX: number, clientY: number) {
    const pt = snapToPath(clientX, clientY)
    if (!pt || !puckRef.current) return
    puckRef.current.style.left = `calc(${pt.x}% - 30px)`
    puckRef.current.style.top = `calc(${pt.y}% - 22px)`
    puckRef.current.style.animation = 'none'

    // Check if near net
    if (Math.hypot(pt.svgX - NET_X, pt.svgY - NET_Y) < NET_RADIUS) {
      dragging.current = false
      scored.current = true
      playChime(12)
      setTimeout(() => { onCelebrate('GOAL! 🚨'); scored.current = false }, 100)
    }
  }

  function onPointerUp() { dragging.current = false }

  return (
    <>
      <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Skate the Puck</div>
        <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 12 }}>Drag the puck along the dotted line to the net.</div>

        <div style={{
          position: 'relative', flex: 1, width: 900, maxWidth: '100%',
          background: 'linear-gradient(180deg,#F4FAFF,#E1EEFA)',
          borderRadius: 26, boxShadow: 'inset 0 0 0 6px #fff, 0 10px 24px rgba(11,42,91,.14)',
          overflow: 'hidden', touchAction: 'none'
        }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 900 520"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <path d={PATH_D} fill="none" stroke="#5BC0EB" strokeWidth="12" strokeLinecap="round" strokeDasharray="2 26" />
          </svg>

          {/* start puck */}
          <div ref={puckRef} style={{
            position: 'absolute', left: 90, top: 392,
            width: 60, height: 44, background: '#14171C', borderRadius: '50%',
            boxShadow: '0 8px 14px rgba(0,0,0,.25)',
            animation: 'bob 1.6s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'absolute', left: 78, top: 444, fontWeight: 700, color: '#5BC0EB', fontSize: 15, pointerEvents: 'none' }}>START</div>

          {/* net */}
          <div style={{
            position: 'absolute', right: 54, top: 60, width: 130, height: 96,
            border: '7px solid #C9D6E6', borderRadius: 12,
            background: 'repeating-linear-gradient(90deg,rgba(160,180,205,.5) 0 1px,transparent 1px 14px),repeating-linear-gradient(0deg,rgba(160,180,205,.5) 0 1px,transparent 1px 14px)',
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'absolute', right: 66, top: 20, fontWeight: 700, color: '#E23B4E', fontSize: 15, pointerEvents: 'none' }}>GOAL!</div>
        </div>
      </div>
    </>
  )
}
