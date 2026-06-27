import { useState, useEffect, useRef } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Bubble {
  id: number
  left: number
  size: number
  color: string
  dur: number
  sway: number
  delay: number
}

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

let _bid = 0

function makeBubble(team: string, randomDelay = false): Bubble {
  const cols = ['#14171C', team, '#E23B4E', '#2FA35A', '#F5A300', '#8B5CF6', '#5BC0EB']
  const dur = 4.5 + Math.random() * 4
  return {
    id: ++_bid,
    left: 4 + Math.random() * 84,
    size: 62 + Math.random() * 46,
    color: cols[Math.floor(Math.random() * cols.length)],
    dur,
    sway: 1.5 + Math.random() * 1.5,
    delay: randomDelay ? -Math.random() * dur : 0,
  }
}

export function PopScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const { playPuck } = useAudio(settings.soundOn)
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: 7 }, () => makeBubble(team, true))
  )
  const [popped, setPopped] = useState(0)
  const teamRef = useRef(team)
  teamRef.current = team

  useEffect(() => {
    setBubbles(Array.from({ length: 7 }, () => makeBubble(team, true)))
    setPopped(0)
  }, [team])

  function popBubble(id: number) {
    playPuck()
    setBubbles(prev => prev.map(b => b.id === id ? makeBubble(teamRef.current) : b))
    setPopped(p => {
      const next = p + 1
      if (next % 12 === 0) setTimeout(() => onCelebrate('12 PUCKS! 🎉'), 40)
      return next
    })
  }

  function recycleBubble(id: number) {
    setBubbles(prev => prev.map(b => b.id === id ? makeBubble(teamRef.current) : b))
  }

  return (
    <>
      <style>{`
        @keyframes floatUp { from{transform:translateY(0)} to{transform:translateY(-960px)} }
        @keyframes sway { 0%,100%{transform:translateX(-13px)} 50%{transform:translateX(13px)} }
      `}</style>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* header */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
        }}>
          <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Pop the Pucks!</div>
          <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 10 }}>Tap every puck to POP it!</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#0C1424', borderRadius: 14, padding: '8px 22px',
            boxShadow: 'inset 0 0 0 3px #1d2942'
          }}>
            <span style={{ fontSize: 12, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>POPPED</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 36, color: '#FFB200', lineHeight: 1 }}>{popped}</span>
          </div>
        </div>

        {/* bubbles */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}>
          {bubbles.map(b => (
            <div
              key={b.id}
              onAnimationEnd={() => recycleBubble(b.id)}
              style={{
                position: 'absolute', left: `${b.left}%`, bottom: -140,
                width: b.size, height: b.size * 0.72,
                animation: `floatUp ${b.dur}s linear ${b.delay}s forwards`
              }}
            >
              <button
                onClick={() => popBubble(b.id)}
                style={{
                  width: '100%', height: '100%', border: 'none', cursor: 'pointer',
                  padding: 0, borderRadius: '50%', background: b.color,
                  boxShadow: 'inset 0 -8px 0 rgba(0,0,0,.18), inset 0 7px 0 rgba(255,255,255,.28), 0 8px 16px rgba(0,0,0,.22)',
                  animation: `sway ${b.sway}s ease-in-out infinite`,
                  touchAction: 'manipulation'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
