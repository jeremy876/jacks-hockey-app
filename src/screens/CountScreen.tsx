import { useState } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

export function CountScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const target = settings.jerseyNumber || 12
  const [counted, setCounted] = useState(0)
  const { playPop, playChime } = useAudio(settings.soundOn)

  function tapPuck(i: number) {
    if (i !== counted) { playPop(); return }
    const n = i + 1
    playChime(n)
    setCounted(n)
    if (n === 12) {
      setTimeout(() => onCelebrate(`12! YOUR NUMBER! 🎉`), 320)
    } else if (n === target && target !== 12) {
      setTimeout(() => onCelebrate(`${target}! YOUR NUMBER! 🎉`), 320)
    }
  }

  function reset() { playPop(); setCounted(0) }

  return (
    <>
      <style>{`
        @keyframes pulseNext{0%,100%{transform:scale(1)}50%{transform:scale(1.13)}}
        @keyframes ledBlink{0%,100%{opacity:1}50%{opacity:.55}}
      `}</style>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Count the Pucks</div>
        <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 12 }}>Tap each puck in order. Count all the way to 12!</div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: '#0C1424', borderRadius: 18, padding: '12px 30px',
          marginBottom: 18, boxShadow: 'inset 0 0 0 3px #1d2942, 0 6px 14px rgba(11,42,91,.2)'
        }}>
          <span style={{ fontSize: 14, letterSpacing: 3, color: '#6f86b8', fontWeight: 600 }}>COUNT</span>
          <span style={{ fontFamily: "'Jersey 25'", fontSize: 72, color: '#FFB200', lineHeight: .9, animation: 'ledBlink 1.4s steps(1) infinite' }}>{counted}</span>
        </div>

        <div style={{
          flex: 1, width: 820, maxWidth: '100%', background: '#fff', borderRadius: 24,
          boxShadow: '0 10px 24px rgba(11,42,91,.12)', padding: 26,
          display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gridTemplateRows: '1fr 1fr', gap: 16, placeItems: 'center'
        }}>
          {Array.from({ length: 12 }, (_, i) => {
            const on = i < counted
            const next = i === counted
            return (
              <button key={i} onClick={() => tapPuck(i)}
                style={{
                  cursor: 'pointer', border: 'none', background: 'transparent', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation'
                }}
              >
                <div style={{
                  width: 84, height: 60, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Jersey 25'", fontSize: 34,
                  background: on ? team : '#14171C',
                  color: '#fff',
                  boxShadow: next ? '0 0 0 5px rgba(22,87,199,.25), 0 8px 14px rgba(0,0,0,.2)' : '0 8px 14px rgba(0,0,0,.18)',
                  transition: 'background .2s, transform .15s',
                  animation: next ? 'pulseNext 1s ease-in-out infinite' : 'none'
                }}>
                  {on ? i + 1 : ''}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
          <button
            onClick={reset}
            style={{
              cursor: 'pointer', border: 'none', background: '#fff', color: team,
              fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 20,
              padding: '12px 30px', borderRadius: 999, boxShadow: '0 5px 0 rgba(11,42,91,.14)',
              touchAction: 'manipulation'
            }}
          >Start over</button>
        </div>
      </div>
    </>
  )
}
