import { useState, useRef } from 'react'
import { Settings, TEAM_COLOR_PRESETS } from '../types'

interface Props {
  settings: Settings
  onUpdate: (patch: Partial<Settings>) => void
}

const GATE_SECONDS = 3

export function GrownUpsScreen({ settings, onUpdate }: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTime = useRef(0)
  const team = settings.teamColor

  function startHold() {
    setHolding(true); startTime.current = Date.now()
    holdTimer.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000
      const pct = Math.min(1, elapsed / GATE_SECONDS)
      setProgress(pct)
      if (pct >= 1) {
        clearInterval(holdTimer.current!)
        setUnlocked(true); setHolding(false); setProgress(0)
      }
    }, 50)
  }

  function endHold() {
    if (holdTimer.current) clearInterval(holdTimer.current)
    setHolding(false); setProgress(0)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpdate({ photo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  if (!unlocked) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 32 }}>👋 Grown-Ups Only</div>
        <div style={{ fontSize: 18, color: '#7184A0' }}>Hold the button for {GATE_SECONDS} seconds to unlock settings.</div>
        <div style={{ position: 'relative' }}>
          <button
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            style={{
              width: 160, height: 160, borderRadius: '50%', border: `6px solid ${team}`,
              background: '#fff', cursor: 'pointer', fontSize: 48,
              boxShadow: '0 8px 24px rgba(11,42,91,.15)',
              touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >🔒</button>
          {holding && (
            <svg style={{ position: 'absolute', inset: -6, width: 172, height: 172, transform: 'rotate(-90deg)' }}>
              <circle cx={86} cy={86} r={80} fill="none" stroke={team} strokeWidth={6}
                strokeDasharray={`${progress * 502} 502`} strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div style={{ fontSize: 16, color: '#9DB1CF' }}>{holding ? 'Keep holding...' : 'Hold to unlock'}</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 40px 40px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 32, marginBottom: 4 }}>Grown-Ups Settings</div>
        <div style={{ fontSize: 16, color: '#7184A0', marginBottom: 24 }}>Customize the app for your little hockey player.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Name */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 8px 0 rgba(11,42,91,.08)' }}>
            <label style={{ fontWeight: 700, fontSize: 16, color: '#3A5377', display: 'block', marginBottom: 10 }}>Child's Name</label>
            <input
              type="text"
              value={settings.childName}
              onChange={e => onUpdate({ childName: e.target.value })}
              maxLength={8}
              style={{
                width: '100%', fontSize: 22, fontFamily: "'Fredoka'", fontWeight: 700,
                border: `3px solid ${team}`, borderRadius: 12, padding: '8px 14px',
                color: '#0B2A5B', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Jersey number */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 8px 0 rgba(11,42,91,.08)' }}>
            <label style={{ fontWeight: 700, fontSize: 16, color: '#3A5377', display: 'block', marginBottom: 10 }}>Jersey Number</label>
            <input
              type="number"
              min={0} max={99}
              value={settings.jerseyNumber}
              onChange={e => onUpdate({ jerseyNumber: Number(e.target.value) })}
              style={{
                width: '100%', fontSize: 22, fontFamily: "'Jersey 25'",
                border: `3px solid ${team}`, borderRadius: 12, padding: '8px 14px',
                color: team, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Team color */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 8px 0 rgba(11,42,91,.08)' }}>
            <label style={{ fontWeight: 700, fontSize: 16, color: '#3A5377', display: 'block', marginBottom: 10 }}>Team Color</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {TEAM_COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => onUpdate({ teamColor: c })} style={{
                  width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: c,
                  boxShadow: c === team ? '0 0 0 4px #fff, 0 0 0 8px ' + c : '0 3px 8px rgba(0,0,0,.2)',
                  transform: c === team ? 'scale(1.1)' : 'none',
                  transition: 'transform .12s',
                  touchAction: 'manipulation'
                }} />
              ))}
            </div>
          </div>

          {/* Photo */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 8px 0 rgba(11,42,91,.08)' }}>
            <label style={{ fontWeight: 700, fontSize: 16, color: '#3A5377', display: 'block', marginBottom: 10 }}>Player Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EAF3FB', border: `4px solid ${team}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {settings.photo ? (
                  <img src={settings.photo} alt="player" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : <span style={{ fontSize: 30 }}>🏒</span>}
              </div>
              <label style={{
                cursor: 'pointer', background: team, color: '#fff',
                fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 16,
                padding: '10px 20px', borderRadius: 999, display: 'inline-block'
              }}>
                Upload Photo
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
              {settings.photo && (
                <button onClick={() => onUpdate({ photo: null })} style={{
                  border: 'none', background: '#FDE7EA', color: '#E23B4E',
                  fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 14,
                  padding: '8px 14px', borderRadius: 999, cursor: 'pointer'
                }}>Remove</button>
              )}
            </div>
          </div>

          {/* Sound */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 8px 0 rgba(11,42,91,.08)', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#3A5377' }}>Sound & Music</div>
              <div style={{ fontSize: 14, color: '#7184A0', marginTop: 4 }}>Turn off all audio (mutes sounds + speech).</div>
            </div>
            <button
              onClick={() => onUpdate({ soundOn: !settings.soundOn })}
              style={{
                width: 68, height: 38, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: settings.soundOn ? team : '#C9D6E6',
                position: 'relative', transition: 'background .2s', touchAction: 'manipulation'
              }}
            >
              <div style={{
                position: 'absolute', top: 4, left: settings.soundOn ? 34 : 4,
                width: 30, height: 30, borderRadius: '50%', background: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,.2)',
                transition: 'left .2s'
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
