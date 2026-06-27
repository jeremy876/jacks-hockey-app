import { useState, useEffect, useRef } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

type Zone = 'left' | 'top' | 'right'

// Where puck lands inside the rink div
const ZONE_PUCK: Record<Zone, { left: string; top: string }> = {
  left:  { left: 'calc(50% - 118px)', top: '55px' },
  top:   { left: 'calc(50% - 20px)',  top: '28px' },
  right: { left: 'calc(50% + 78px)',  top: '55px' },
}

// Goalie translateX when diving to each zone
const ZONE_GOALIE_X: Record<Zone, number> = { left: -110, top: 0, right: 110 }

// Target circle positions inside net (% from net top-left)
const TARGET_POS: Record<Zone, { left: string; top: string }> = {
  left:  { left: '15%', top: '38%' },
  top:   { left: '50%', top: '15%' },
  right: { left: '85%', top: '38%' },
}

const PATROL_POSITIONS = [-110, -55, 0, 55, 110]

interface LevelConfig {
  label: string
  color: string
  patrolMs: number   // how often the goalie picks a new spot
  diveMs: number     // goalie's CSS transition on the dive (always > 450ms puck time)
  threshold: number  // min distance for a zone to show as open (🎯)
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
  const [goals, setGoals] = useState(0)
  const [shooting, setShooting] = useState(false)
  const [shotZone, setShotZone] = useState<Zone | null>(null)
  const [goalieX, setGoalieX] = useState(0)
  const [diving, setDiving] = useState(false)
  const [goalieTarget, setGoalieTarget] = useState(0)
  const [showGoalText, setShowGoalText] = useState(false)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)

  const prevLevelRef = useRef(0)
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playWhistle } = useAudio(settings.soundOn)

  const levelIndex = getLevelIndex(goals)
  const config = LEVELS[levelIndex]

  // Patrol: auto-restarts whenever levelIndex or shooting changes
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

    // Puck arrives at 450ms; goalie dive is always > 450ms → puck always wins
    t1.current = setTimeout(() => {
      setShowGoalText(true)
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

  const puckStyle: React.CSSProperties = shotZone && shooting
    ? {
        position: 'absolute',
        left: ZONE_PUCK[shotZone].left,
        top: ZONE_PUCK[shotZone].top,
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
        transition: 'transform .3s ease',
        zIndex: 6,
      }

  const goalieTransform = diving ? `translateX(${goalieTarget}px)` : `translateX(${goalieX}px)`
  const goalieTransition = diving
    ? `transform ${config.diveMs}ms cubic-bezier(.3,0,.2,1)`
    : `transform ${Math.min(Math.round(config.patrolMs * 0.55), 580)}ms ease-in-out`

  return (
    <>
      <style>{`
        @keyframes tPulse {
          0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.88}
          50%{transform:translate(-50%,-50%) scale(1.2);opacity:1}
        }
        @keyframes goalFlash{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes levelUp{
          0%{opacity:0;transform:translate(-50%,-50%) scale(.8) translateY(20px)}
          18%{opacity:1;transform:translate(-50%,-50%) scale(1.06) translateY(0)}
          80%{opacity:1;transform:translate(-50%,-50%) scale(1) translateY(0)}
          100%{opacity:0;transform:translate(-50%,-50%) scale(.95) translateY(-14px)}
        }
        @keyframes goalTextIn{
          0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}
          40%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}
          100%{opacity:1;transform:translate(-50%,-50%) scale(1)}
        }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 18px', overflow: 'hidden' }}>

        {/* ── TITLE ROW ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34, color: '#0B2A5B' }}>
            Shoot the Puck!
          </div>
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
          position: 'relative', flex: 1, width: 820, maxWidth: '100%',
          background: 'linear-gradient(175deg, #EEF7FF 0%, #DDE8F6 55%, #C8DDEF 100%)',
          borderRadius: 28,
          boxShadow: 'inset 0 0 0 7px rgba(255,255,255,.9), 0 12px 32px rgba(11,42,91,.17)',
          overflow: 'hidden', marginBottom: 16,
        }}>

          {/* Ice lines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg,transparent,transparent 42px,rgba(190,215,240,.3) 42px,rgba(190,215,240,.3) 43px)' }} />

          {/* Goal line */}
          <div style={{
            position: 'absolute', top: 162, left: 0, width: '100%', height: 6, zIndex: 2,
            background: showGoalText ? '#E23B4E' : 'rgba(226,59,78,.42)',
            transition: 'background .15s',
            animation: showGoalText ? 'goalFlash .22s ease 3' : 'none',
          }} />

          {/* NET */}
          <div style={{
            position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
            width: 350, height: 148,
            border: '9px solid #A0B8CE', borderBottom: 'none', borderRadius: '20px 20px 0 0',
            background: [
              'repeating-linear-gradient(90deg,rgba(140,168,196,.42) 0 1px,transparent 1px 19px)',
              'repeating-linear-gradient(0deg,rgba(140,168,196,.42) 0 1px,transparent 1px 19px)',
            ].join(','),
            zIndex: 3,
          }}>
            {/* Left post pip */}
            <div style={{ position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: '#E23B4E', boxShadow: '0 0 10px rgba(226,59,78,.65)' }} />
            {/* Right post pip */}
            <div style={{ position: 'absolute', right: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: '#E23B4E', boxShadow: '0 0 10px rgba(226,59,78,.65)' }} />

            {/* AIM TARGETS */}
            {(['left', 'top', 'right'] as Zone[]).map((zone, i) => {
              const isOpen = !shooting && Math.abs(goalieX - ZONE_GOALIE_X[zone]) > config.threshold
              return (
                <button key={zone} onClick={() => shoot(zone)} disabled={shooting}
                  style={{
                    position: 'absolute',
                    left: TARGET_POS[zone].left,
                    top: TARGET_POS[zone].top,
                    transform: 'translate(-50%,-50%)',
                    width: 72, height: 72, borderRadius: '50%', border: 'none',
                    cursor: shooting ? 'default' : 'pointer',
                    background: isOpen ? 'rgba(226,59,78,.82)' : 'rgba(255,255,255,.38)',
                    boxShadow: isOpen
                      ? '0 0 0 5px rgba(226,59,78,.28), 0 0 24px rgba(226,59,78,.52)'
                      : '0 0 0 3px rgba(175,198,220,.5)',
                    animation: !shooting ? `tPulse ${1.25 + i * 0.38}s ease-in-out infinite` : 'none',
                    touchAction: 'manipulation', zIndex: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
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
            <div style={{ transform: goalieTransform, transition: goalieTransition, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

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
              <div style={{ width: 92, height: 72, borderRadius: '16px 16px 12px 12px', background: team, marginTop: -6, position: 'relative', border: '3px solid rgba(11,42,91,.2)' }}>
                {/* chest stripes */}
                <div style={{ position: 'absolute', top: '28%', left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.28)' }} />
                <div style={{ position: 'absolute', top: 'calc(28% + 9px)', left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.14)' }} />
                {/* jersey # */}
                <div style={{ position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Jersey 25'", fontSize: 28, color: 'rgba(255,255,255,.85)', lineHeight: 1 }}>
                  {settings.jerseyNumber}
                </div>
                {/* blocker (right) */}
                <div style={{ position: 'absolute', right: -28, top: 6, width: 28, height: 52, borderRadius: '6px 16px 16px 6px', background: '#E6EFF8', border: '2px solid #BAD0E2', boxShadow: '3px 2px 8px rgba(0,0,0,.12)' }}>
                  {[22, 44, 66].map(y => (
                    <div key={y} style={{ position: 'absolute', left: '18%', top: `${y}%`, width: '64%', height: 2, background: 'rgba(11,42,91,.12)', borderRadius: 1 }} />
                  ))}
                </div>
                {/* catching glove (left) */}
                <div style={{ position: 'absolute', left: -26, top: 4, width: 26, height: 52, borderRadius: '16px 6px 6px 16px', background: team, border: '2px solid rgba(11,42,91,.28)', boxShadow: '-3px 2px 8px rgba(0,0,0,.1)' }}>
                  {/* finger lines */}
                  {[30, 52, 70].map(y => (
                    <div key={y} style={{ position: 'absolute', left: '22%', top: `${y}%`, width: '56%', height: 2, background: 'rgba(255,255,255,.22)', borderRadius: 1 }} />
                  ))}
                </div>
              </div>

              {/* Leg pads */}
              <div style={{ display: 'flex', gap: 6, marginTop: -4 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ width: 42, height: 26, background: team, borderRadius: '0 0 14px 14px', border: '2px solid rgba(11,42,91,.18)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '32%', left: '18%', width: '64%', height: 2, background: 'rgba(255,255,255,.25)', borderRadius: 1 }} />
                    <div style={{ position: 'absolute', top: '60%', left: '18%', width: '64%', height: 2, background: 'rgba(255,255,255,.14)', borderRadius: 1 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PUCK */}
          <div style={puckStyle} />

          {/* GOAL! flash */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

          {/* Goals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 28px', boxShadow: 'inset 0 0 0 3px #1d2942' }}>
            <span style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>GOALS</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 50, color: '#FFB200', lineHeight: 1 }}>{goals}</span>
          </div>

          {/* Level card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 22px', boxShadow: 'inset 0 0 0 3px #1d2942', minWidth: 134 }}>
            <span style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>LEVEL</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 26, color: config.color, lineHeight: 1.1, letterSpacing: 1, transition: 'color .4s' }}>{config.label}</span>
            {/* progress pips */}
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
          <div style={{ fontSize: 14, color: '#7184A0', lineHeight: 1.55, maxWidth: 210 }}>
            {levelIndex < LEVELS.length - 1 ? (
              <>
                <span style={{ color: config.color, fontWeight: 700 }}>{LEVEL_GOALS[levelIndex + 1] - goals}</span> more goal{LEVEL_GOALS[levelIndex + 1] - goals !== 1 ? 's' : ''} until{' '}
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
