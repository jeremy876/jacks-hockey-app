import { useState, useRef } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

export function ShootScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const [goals, setGoals] = useState(0)
  const [shooting, setShooting] = useState(false)
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playWhistle } = useAudio(settings.soundOn)

  function shoot() {
    if (shooting) return
    playWhistle()
    setShooting(true)
    t1.current = setTimeout(() => {
      setGoals(g => g + 1)
      onCelebrate('GOAL! 🚨')
    }, 560)
    t2.current = setTimeout(() => setShooting(false), 1800)
  }

  const puckStyle: React.CSSProperties = {
    position: 'absolute', bottom: 36, left: '50%',
    width: 64, height: 46, background: '#14171C', borderRadius: '50%',
    boxShadow: 'inset 0 -6px 0 rgba(255,255,255,.12), 0 10px 18px rgba(0,0,0,.25)',
    transform: shooting ? 'translate(-50%,-430px) scale(.5)' : 'translate(-50%,0) scale(1)',
    transition: shooting ? 'transform .56s cubic-bezier(.45,0,.6,1)' : 'transform .3s ease'
  }

  return (
    <>
      <style>{`@keyframes wiggle{0%,100%{transform:translateX(-9px)}50%{transform:translateX(9px)}}`}</style>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Shoot the Puck!</div>
        <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 8 }}>Tap the big button to shoot. Score a goal!</div>

        <div style={{
          position: 'relative', flex: 1, width: 760, maxWidth: '100%',
          background: 'linear-gradient(180deg,#F4FAFF,#E1EEFA)',
          borderRadius: 26, boxShadow: 'inset 0 0 0 6px #fff, 0 10px 24px rgba(11,42,91,.14)',
          overflow: 'hidden', marginBottom: 14
        }}>
          {/* goal line */}
          <div style={{ position: 'absolute', top: 96, left: 0, width: '100%', height: 5, background: 'rgba(226,59,78,.55)' }} />
          {/* NET */}
          <div style={{
            position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 120, border: '7px solid #C9D6E6', borderBottom: 'none',
            borderRadius: '14px 14px 0 0',
            background: 'repeating-linear-gradient(90deg,rgba(160,180,205,.5) 0 1px,transparent 1px 16px),repeating-linear-gradient(0deg,rgba(160,180,205,.5) 0 1px,transparent 1px 16px)'
          }} />
          {/* GOALIE */}
          <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', animation: 'wiggle 1.4s ease-in-out infinite' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: team, margin: '0 auto', border: '4px solid #0B2A5B' }} />
            <div style={{ width: 74, height: 60, borderRadius: '16px 16px 12px 12px', background: team, marginTop: -6, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -16, top: 8, width: 16, height: 40, background: '#fff', borderRadius: 6 }} />
              <div style={{ position: 'absolute', right: -16, top: 8, width: 16, height: 40, background: '#fff', borderRadius: 6 }} />
            </div>
          </div>
          {/* PUCK */}
          <div style={puckStyle} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 20px', boxShadow: 'inset 0 0 0 3px #1d2942' }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>GOALS</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 38, color: '#FFB200', lineHeight: 1 }}>{goals}</span>
          </div>
          <button
            onClick={shoot}
            onPointerDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 4px 0 #B22638' }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 0 #B22638' }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 0 #B22638' }}
            style={{
              cursor: 'pointer', border: 'none', background: '#E23B4E', color: '#fff',
              fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 30,
              padding: '20px 56px', borderRadius: 999,
              boxShadow: '0 8px 0 #B22638', touchAction: 'manipulation',
              transition: 'transform .08s, box-shadow .08s'
            }}
          >SHOOT! 🏒</button>
        </div>
      </div>
    </>
  )
}
