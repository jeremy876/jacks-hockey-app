import { useState, useEffect, useRef } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

type Zone = 'left' | 'center' | 'right' | 'low-left' | 'low-right'

// Puck destination inside the rink div (relative to rink top-left)
const ZONE_PUCK: Record<Zone, { left: string; top: string }> = {
  'left':      { left: 'calc(50% - 128px)', top: '38px'  },
  'center':    { left: 'calc(50% - 20px)',  top: '26px'  },
  'right':     { left: 'calc(50% + 88px)',  top: '38px'  },
  'low-left':  { left: 'calc(50% - 90px)',  top: '90px'  },
  'low-right': { left: 'calc(50% + 50px)',  top: '90px'  },
}

// Goalie translateX when diving to block each zone
const ZONE_GOALIE_X: Record<Zone, number> = {
  'left':       -112,
  'center':        0,
  'right':       112,
  'low-left':    -72,
  'low-right':    72,
}

// Target button positions inside the net div (350 × 148px)
const TARGET_POS: Record<Zone, { left: string; top: string }> = {
  'left':      { left: '17%', top: '20%' },
  'center':    { left: '50%', top: '18%' },
  'right':     { left: '83%', top: '20%' },
  'low-left':  { left: '25%', top: '65%' },
  'low-right': { left: '75%', top: '65%' },
}

const PATROL_POSITIONS = [-112, -56, 0, 56, 112]

interface LevelConfig {
  label: string
  color: string
  patrolMs: number
  diveMs: number     // always > 450ms puck travel → puck always wins
  threshold: number  // min goalie distance for a zone to show as open
}

const LEVELS: LevelConfig[] = [
  { label: 'ROOKIE',   color: '#36D07A', patrolMs: 1300, diveMs: 720, threshold: 40  },
  { label: 'PRO',      color: '#FFB200', patrolMs: 850,  diveMs: 570, threshold: 68  },
  { label: 'ALL-STAR', color: '#E23B4E', patrolMs: 520,  diveMs: 505, threshold: 90  },
  { label: 'MVP',      color: '#8B5CF6', patrolMs: 340,  diveMs: 478, threshold: 108 },
]

const LEVEL_GOALS = [0, 3, 7, 12]

function getLevelIndex(goals: number) {
  for (let i = LEVEL_GOALS.length - 1; i >= 0; i--) {
    if (goals >= LEVEL_GOALS[i]) return i
  }
  return 0
}

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

export function ShootScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const [goals,         setGoals]         = useState(0)
  const [shots,         setShots]         = useState(0)
  const [shooting,      setShooting]      = useState(false)
  const [shotZone,      setShotZone]      = useState<Zone | null>(null)
  const [goalieX,       setGoalieX]       = useState(0)
  const [diving,        setDiving]        = useState(false)
  const [goalieTarget,  setGoalieTarget]  = useState(0)
  const [showGoalText,  setShowGoalText]  = useState(false)
  const [levelUpMsg,    setLevelUpMsg]    = useState<string | null>(null)
  const [goalFlashKey,  setGoalFlashKey]  = useState(0) // increments to re-trigger net shake

  const prevLevelRef = useRef(0)
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playWhistle } = useAudio(settings.soundOn)

  const levelIndex = getLevelIndex(goals)
  const config     = LEVELS[levelIndex]

  // Goalie patrols; auto-restarts when level or shooting state changes
  useEffect(() => {
    if (shooting) return
    const id = setInterval(() => {
      setGoalieX(PATROL_POSITIONS[Math.floor(Math.random() * PATROL_POSITIONS.length)])
    }, config.patrolMs)
    return () => clearInterval(id)
  }, [levelIndex, shooting, config.patrolMs])

  // Level-up detection
  useEffect(() => {
    if (levelIndex <= prevLevelRef.current) return
    prevLevelRef.current = levelIndex
    setLevelUpMsg(`LEVEL UP! ${config.label}! 🌟`)
    const id = setTimeout(() => setLevelUpMsg(null), 1900)
    return () => clearTimeout(id)
  }, [levelIndex, config.label])

  // Cleanup on unmount
  useEffect(() => () => {
    if (t1.current) clearTimeout(t1.current)
    if (t2.current) clearTimeout(t2.current)
  }, [])

  function shoot(zone: Zone) {
    if (shooting) return
    playWhistle()
    setShooting(true)
    setShotZone(zone)
    setDiving(true)
    setGoalieTarget(ZONE_GOALIE_X[zone])
    setShots(s => s + 1)

    // Puck arrives at 450ms; goalie dive always > 450ms → puck always scores
    t1.current = setTimeout(() => {
      setShowGoalText(true)
      setGoalFlashKey(k => k + 1)
      setGoals(g => g + 1)
      setTimeout(() => onCelebrate('GOAL! 🚨'), 80)
    }, 450)

    t2.current = setTimeout(() => {
      setShooting(false)
      setShotZone(null)
      setDiving(false)
      setShowGoalText(false)
      setGoalieTarget(0)
      setGoalieX(0)
    }, 2300)
  }

  // Puck: animate to net on shot; gentle idle bounce when waiting
  const puckStyle: React.CSSProperties = shotZone && shooting
    ? {
        position: 'absolute',
        left: ZONE_PUCK[shotZone].left,
        top:  ZONE_PUCK[shotZone].top,
        width: 38, height: 27, background: '#14171C', borderRadius: '50%',
        boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.12)',
        transform: 'translateX(-50%) scale(0.52)',
        transition: 'left .45s cubic-bezier(.38,.6,.35,1), top .45s cubic-bezier(.38,.6,.35,1), transform .45s ease',
        zIndex: 6,
      }
    : {
        position: 'absolute', left: '50%', bottom: 30,
        width: 66, height: 48, background: '#14171C', borderRadius: '50%',
        boxShadow: 'inset 0 -6px 0 rgba(255,255,255,.13), 0 10px 20px rgba(0,0,0,.28)',
        transform: 'translateX(-50%) scale(1)',
        animation: 'puckIdle 1.6s ease-in-out infinite',
        zIndex: 6,
      }

  // Goalie: lean body toward dive/patrol direction
  const targetX      = diving ? goalieTarget : goalieX
  const leanDeg      = diving
    ? (goalieTarget < -40 ? -16 : goalieTarget > 40 ? 16 : 0)
    : (goalieX < -40 ? -5 : goalieX > 40 ? 5 : 0)

  const goalieTransform  = `translateX(${targetX}px) rotate(${leanDeg}deg)`
  const goalieTransition = diving
    ? `transform ${config.diveMs}ms cubic-bezier(.3,0,.2,1)`
    : `transform ${Math.min(Math.round(config.patrolMs * 0.55), 580)}ms ease-in-out`

  const shootingPct = shots > 0 ? Math.round((goals / shots) * 100) : 0

  return (
    <>
      <style>{`
        @keyframes tPulse {
          0%,100%{ transform:translate(-50%,-50%) scale(1); opacity:.88 }
          50%    { transform:translate(-50%,-50%) scale(1.2); opacity:1 }
        }
        @keyframes goalFlash { 0%,100%{ opacity:1 } 50%{ opacity:.3 } }
        @keyframes levelUp {
          0%  { opacity:0; transform:translate(-50%,-50%) scale(.8) translateY(20px) }
          18% { opacity:1; transform:translate(-50%,-50%) scale(1.06) translateY(0) }
          80% { opacity:1; transform:translate(-50%,-50%) scale(1) translateY(0) }
          100%{ opacity:0; transform:translate(-50%,-50%) scale(.95) translateY(-14px) }
        }
        @keyframes goalTextIn {
          0%  { opacity:0; transform:translate(-50%,-50%) scale(.6) }
          40% { opacity:1; transform:translate(-50%,-50%) scale(1.08) }
          100%{ opacity:1; transform:translate(-50%,-50%) scale(1) }
        }
        @keyframes netShake {
          0%,100%{ transform:translateX(-50%) }
          12%    { transform:translateX(calc(-50% - 7px)) }
          28%    { transform:translateX(calc(-50% + 6px)) }
          44%    { transform:translateX(calc(-50% - 4px)) }
          60%    { transform:translateX(calc(-50% + 3px)) }
          76%    { transform:translateX(calc(-50% - 2px)) }
        }
        @keyframes iceTint {
          0%,100%{ opacity:0 }
          40%    { opacity:1 }
        }
        @keyframes puckIdle {
          0%,100%{ transform:translateX(-50%) translateY(0) }
          50%    { transform:translateX(-50%) translateY(-5px) }
        }
        @keyframes creaseGlow {
          0%,100%{ opacity:.4 }
          50%    { opacity:.85 }
        }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 16px', overflow: 'hidden' }}>

        {/* ── TITLE ROW ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34, color: '#0B2A5B' }}>Shoot the Puck!</div>
          <div style={{
            background: config.color, color: '#fff',
            fontFamily: "'Jersey 25'", fontSize: 20, letterSpacing: 1,
            padding: '5px 16px', borderRadius: 999,
            boxShadow: `0 5px 0 ${config.color}77`,
            transition: 'background .4s, box-shadow .4s',
          }}>{config.label}</div>
        </div>
        <div style={{ fontSize: 17, color: '#7184A0', marginBottom: 10 }}>
          {shooting ? '🚨 Puck is flying!' : 'Tap a target in the net to shoot!'}
        </div>

        {/* ── RINK ── */}
        <div style={{
          position: 'relative', flex: 1, width: 840, maxWidth: '100%',
          background: 'linear-gradient(175deg, #EEF7FF 0%, #DDE8F6 55%, #C8DDEF 100%)',
          borderRadius: 28,
          boxShadow: 'inset 0 0 0 7px rgba(255,255,255,.9), 0 12px 32px rgba(11,42,91,.17)',
          overflow: 'hidden', marginBottom: 14,
        }}>

          {/* Ice horizontal lines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg,transparent,transparent 42px,rgba(190,215,240,.28) 42px,rgba(190,215,240,.28) 43px)' }} />

          {/* Red goal flash tint */}
          {showGoalText && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'rgba(226,59,78,.09)', animation: 'iceTint .7s ease both' }} />
          )}

          {/* Goal crease — blue semicircle below the goal line */}
          <div style={{
            position: 'absolute', top: 162, left: '50%',
            transform: 'translateX(-50%)',
            width: 270, height: 68,
            borderRadius: '0 0 135px 135px',
            border: '3px solid rgba(31,95,208,.38)',
            borderTop: 'none',
            background: 'rgba(31,95,208,.09)',
            animation: showGoalText ? 'creaseGlow .5s ease both' : 'none',
            zIndex: 2, pointerEvents: 'none',
          }} />

          {/* Goal line */}
          <div style={{
            position: 'absolute', top: 162, left: 0, width: '100%', height: 5, zIndex: 3,
            background: showGoalText ? '#E23B4E' : 'rgba(226,59,78,.45)',
            transition: 'background .15s',
            animation: showGoalText ? 'goalFlash .22s ease 3' : 'none',
          }} />

          {/* NET — shakes on goal */}
          <div
            key={`net-${goalFlashKey}`}
            style={{
              position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
              width: 360, height: 148,
              border: '9px solid #A0B8CE', borderBottom: 'none', borderRadius: '20px 20px 0 0',
              background: [
                'repeating-linear-gradient(90deg,rgba(140,168,196,.42) 0 1px,transparent 1px 19px)',
                'repeating-linear-gradient(0deg,rgba(140,168,196,.42) 0 1px,transparent 1px 19px)',
              ].join(','),
              zIndex: 4,
              animation: goalFlashKey > 0 ? 'netShake .45s ease both' : 'none',
            }}
          >
            {/* Left post */}
            <div style={{ position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: '#E23B4E', boxShadow: '0 0 10px rgba(226,59,78,.65)' }} />
            {/* Right post */}
            <div style={{ position: 'absolute', right: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: '#E23B4E', boxShadow: '0 0 10px rgba(226,59,78,.65)' }} />

            {/* AIM TARGETS — 5 zones */}
            {(['left', 'center', 'right', 'low-left', 'low-right'] as Zone[]).map((zone, i) => {
              const isOpen = !shooting && Math.abs(goalieX - ZONE_GOALIE_X[zone]) > config.threshold
              return (
                <button key={zone} onClick={() => shoot(zone)} disabled={shooting}
                  style={{
                    position: 'absolute',
                    left: TARGET_POS[zone].left,
                    top:  TARGET_POS[zone].top,
                    transform: 'translate(-50%,-50%)',
                    width: 64, height: 64, borderRadius: '50%', border: 'none',
                    cursor: shooting ? 'default' : 'pointer',
                    background: isOpen ? 'rgba(226,59,78,.82)' : 'rgba(255,255,255,.38)',
                    boxShadow: isOpen
                      ? '0 0 0 5px rgba(226,59,78,.28), 0 0 24px rgba(226,59,78,.52)'
                      : '0 0 0 3px rgba(175,198,220,.5)',
                    animation: !shooting ? `tPulse ${1.2 + i * 0.28}s ease-in-out infinite` : 'none',
                    touchAction: 'manipulation', zIndex: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                    opacity: shooting ? 0 : 1,
                    transition: 'opacity .15s, background .18s, box-shadow .18s',
                  }}
                >
                  {isOpen ? '🎯' : ''}
                </button>
              )
            })}
          </div>

          {/* ── GOALIE ── */}
          <div style={{ position: 'absolute', top: 46, left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}>
            <div style={{
              transform: goalieTransform,
              transition: goalieTransition,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              transformOrigin: 'center bottom',
            }}>

              {/* Helmet */}
              <div style={{ width: 58, height: 32, borderRadius: '54% 54% 0 0', background: team, border: '3px solid #0B2A5B', position: 'relative' }}>
                {[22, 46, 70].map(x => (
                  <div key={x} style={{ position: 'absolute', left: `${x}%`, top: '22%', width: 2, height: '72%', background: 'rgba(11,42,91,.5)', borderRadius: 1 }} />
                ))}
                <div style={{ position: 'absolute', left: '14%', top: '60%', width: '72%', height: 2, background: 'rgba(11,42,91,.3)', borderRadius: 1 }} />
              </div>

              {/* Head */}
              <div style={{ width: 48, height: 40, borderRadius: '50%', background: '#F5C5A0', border: '3px solid #0B2A5B', marginTop: -6 }} />

              {/* Body */}
              <div style={{ width: 92, height: 74, borderRadius: '16px 16px 12px 12px', background: team, marginTop: -6, position: 'relative', border: '3px solid rgba(11,42,91,.2)' }}>
                {/* Chest stripes */}
                <div style={{ position: 'absolute', top: '28%', left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.28)' }} />
                <div style={{ position: 'absolute', top: 'calc(28% + 9px)', left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.14)' }} />
                {/* Jersey number */}
                <div style={{ position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Jersey 25'", fontSize: 28, color: 'rgba(255,255,255,.85)', lineHeight: 1 }}>
                  {settings.jerseyNumber}
                </div>
                {/* Blocker — right */}
                <div style={{ position: 'absolute', right: -30, top: 4, width: 30, height: 54, borderRadius: '6px 16px 16px 6px', background: '#E6EFF8', border: '2px solid #BAD0E2', boxShadow: '3px 2px 8px rgba(0,0,0,.12)' }}>
                  {[22, 44, 66].map(y => (
                    <div key={y} style={{ position: 'absolute', left: '18%', top: `${y}%`, width: '64%', height: 2, background: 'rgba(11,42,91,.12)', borderRadius: 1 }} />
                  ))}
                </div>
                {/* Catching glove — left */}
                <div style={{ position: 'absolute', left: -28, top: 4, width: 28, height: 54, borderRadius: '16px 6px 6px 16px', background: team, border: '2px solid rgba(11,42,91,.28)', boxShadow: '-3px 2px 8px rgba(0,0,0,.1)' }}>
                  {[30, 52, 70].map(y => (
                    <div key={y} style={{ position: 'absolute', left: '22%', top: `${y}%`, width: '56%', height: 2, background: 'rgba(255,255,255,.22)', borderRadius: 1 }} />
                  ))}
                </div>
              </div>

              {/* Leg pads */}
              <div style={{ display: 'flex', gap: 6, marginTop: -4 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ width: 44, height: 28, background: team, borderRadius: '0 0 16px 16px', border: '2px solid rgba(11,42,91,.18)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '32%', left: '18%', width: '64%', height: 2, background: 'rgba(255,255,255,.25)', borderRadius: 1 }} />
                    <div style={{ position: 'absolute', top: '62%', left: '18%', width: '64%', height: 2, background: 'rgba(255,255,255,.14)', borderRadius: 1 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PUCK */}
          <div style={puckStyle} />

          {/* GOAL! flash text */}
          {showGoalText && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                fontFamily: "'Jersey 25'", fontSize: 100, color: '#E23B4E',
                textShadow: '0 8px 0 rgba(226,59,78,.22), 0 0 48px rgba(226,59,78,.45)',
                animation: 'goalTextIn .35s cubic-bezier(.2,1.4,.4,1) both',
                whiteSpace: 'nowrap',
              }}>GOAL!</div>
            </div>
          )}

          {/* LEVEL-UP banner */}
          {levelUpMsg && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', top: '42%', left: '50%',
                background: config.color, color: '#fff',
                fontFamily: "'Jersey 25'", fontSize: 42, letterSpacing: 2,
                padding: '14px 34px', borderRadius: 18,
                boxShadow: `0 8px 0 ${config.color}88, 0 16px 40px rgba(0,0,0,.22)`,
                animation: 'levelUp 1.9s cubic-bezier(.2,1.4,.4,1) forwards',
                whiteSpace: 'nowrap',
              }}>{levelUpMsg}</div>
            </div>
          )}
        </div>

        {/* ── BOTTOM STATS BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Goals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 24px', boxShadow: 'inset 0 0 0 3px #1d2942' }}>
            <span style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>GOALS</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 50, color: '#FFB200', lineHeight: 1 }}>{goals}</span>
          </div>

          {/* Shots + % */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 20px', boxShadow: 'inset 0 0 0 3px #1d2942', minWidth: 90 }}>
            <span style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>SHOTS</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 50, color: '#5BC0EB', lineHeight: 1 }}>{shots}</span>
            {shots > 0 && (
              <span style={{ fontFamily: "'Fredoka'", fontSize: 12, color: '#4a6580', fontWeight: 600, marginTop: 2 }}>{shootingPct}%</span>
            )}
          </div>

          {/* Level card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 20px', boxShadow: 'inset 0 0 0 3px #1d2942', minWidth: 130 }}>
            <span style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>LEVEL</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 26, color: config.color, lineHeight: 1.1, letterSpacing: 1, transition: 'color .4s' }}>{config.label}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {LEVELS.map((l, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i <= levelIndex ? l.color : '#26334f',
                  boxShadow: i === levelIndex ? `0 0 8px ${l.color}` : 'none',
                  transition: 'background .4s, box-shadow .4s',
                }} />
              ))}
            </div>
          </div>

          {/* Next level hint */}
          <div style={{ fontSize: 14, color: '#7184A0', lineHeight: 1.55, maxWidth: 200 }}>
            {levelIndex < LEVELS.length - 1 ? (
              <>
                <span style={{ color: config.color, fontWeight: 700 }}>{LEVEL_GOALS[levelIndex + 1] - goals}</span>
                {' '}more goal{LEVEL_GOALS[levelIndex + 1] - goals !== 1 ? 's' : ''} until{' '}
                <span style={{ color: LEVELS[levelIndex + 1].color, fontWeight: 700 }}>{LEVELS[levelIndex + 1].label}</span>
                {' '}— goalie gets {levelIndex === 0 ? 'faster' : levelIndex === 1 ? 'much faster' : 'blazing fast'}!
              </>
            ) : (
              <><span style={{ color: config.color, fontWeight: 700 }}>MAX LEVEL 🏆</span><br />You're unstoppable!</>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
