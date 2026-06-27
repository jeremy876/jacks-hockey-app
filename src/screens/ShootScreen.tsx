import { useState, useEffect, useRef, useCallback } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

type Zone = 'left' | 'top' | 'right'

// Where the puck lands (as CSS left/top inside the rink div, 760px wide)
const ZONE_PUCK: Record<Zone, { left: string; top: string }> = {
  left:  { left: 'calc(50% - 112px)', top: '58px' },
  top:   { left: 'calc(50% - 20px)',  top: '30px' },
  right: { left: 'calc(50% + 72px)',  top: '58px' },
}

// Where the goalie dives (translateX offset from center, in px)
const ZONE_GOALIE_X: Record<Zone, number> = {
  left: -108,
  top:  0,
  right: 108,
}

// Target circle positions inside the net (relative to net container)
const TARGET_POS: Record<Zone, { left: string; top: string }> = {
  left:  { left: '14%',  top: '30%' },
  top:   { left: '50%',  top: '14%' },
  right: { left: '86%', top: '30%' },
}

const PATROL_POSITIONS = [-108, -54, 0, 54, 108]

export function ShootScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const [goals, setGoals] = useState(0)
  const [shooting, setShooting] = useState(false)
  const [shotZone, setShotZone] = useState<Zone | null>(null)
  const [goalieX, setGoalieX] = useState(0)       // current patrol position
  const [goalieTarget, setGoalieTarget] = useState(0) // target when diving
  const [diving, setDiving] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const patrolInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playWhistle } = useAudio(settings.soundOn)

  // Patrol: goalie drifts randomly across net when idle
  const startPatrol = useCallback(() => {
    patrolInterval.current = setInterval(() => {
      setGoalieX(() => PATROL_POSITIONS[Math.floor(Math.random() * PATROL_POSITIONS.length)])
    }, 1100)
  }, [])

  const stopPatrol = useCallback(() => {
    if (patrolInterval.current) { clearInterval(patrolInterval.current); patrolInterval.current = null }
  }, [])

  useEffect(() => {
    startPatrol()
    return () => stopPatrol()
  }, [startPatrol, stopPatrol])

  function shoot(zone: Zone) {
    if (shooting) return
    stopPatrol()
    playWhistle()
    setShooting(true)
    setShotZone(zone)
    setDiving(true)
    setGoalieTarget(ZONE_GOALIE_X[zone])

    // Puck arrives at 450ms → goalie transition is 550ms → goalie always misses
    t1.current = setTimeout(() => {
      setShowGoal(true)
      setGoals(g => g + 1)
      setTimeout(() => onCelebrate('GOAL! 🚨'), 80)
    }, 450)

    t2.current = setTimeout(() => {
      setShooting(false)
      setShotZone(null)
      setDiving(false)
      setShowGoal(false)
      setGoalieX(0)
      setGoalieTarget(0)
      startPatrol()
    }, 2200)
  }

  // Puck position: starts bottom-center, flies to shot zone
  const puckStyle: React.CSSProperties = shotZone && shooting
    ? {
        position: 'absolute',
        left: ZONE_PUCK[shotZone].left,
        top: ZONE_PUCK[shotZone].top,
        width: 36, height: 26, background: '#14171C', borderRadius: '50%',
        boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.12)',
        transform: 'translateX(-50%) scale(0.55)',
        transition: 'left 0.45s cubic-bezier(.38,.6,.35,1), top 0.45s cubic-bezier(.38,.6,.35,1), transform 0.45s ease',
        zIndex: 4,
      }
    : {
        position: 'absolute',
        left: '50%', bottom: 28,
        width: 64, height: 46, background: '#14171C', borderRadius: '50%',
        boxShadow: 'inset 0 -6px 0 rgba(255,255,255,.12), 0 10px 18px rgba(0,0,0,.25)',
        transform: 'translateX(-50%) scale(1)',
        transition: 'transform 0.3s ease',
        zIndex: 4,
      }

  const goalieTransform = diving
    ? `translateX(${goalieTarget}px)`
    : `translateX(${goalieX}px)`
  const goalieTransition = diving
    ? 'transform 0.55s cubic-bezier(.4,0,.2,1)'
    : 'transform 0.65s ease-in-out'

  return (
    <>
      <style>{`
        @keyframes targetPulse {
          0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .85; }
          50%      { transform: translate(-50%,-50%) scale(1.18); opacity: 1; }
        }
        @keyframes goalFlash {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes diveLeft  { 0%{transform:translateX(0) rotate(0)} 40%{transform:translateX(-22px) rotate(-28deg)} 100%{transform:translateX(-22px) rotate(-28deg)} }
        @keyframes diveRight { 0%{transform:translateX(0) rotate(0)} 40%{transform:translateX(22px) rotate(28deg)} 100%{transform:translateX(22px) rotate(28deg)} }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Shoot the Puck!</div>
        <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 8 }}>
          {shooting ? '🚨 Flying to the net...' : 'Tap a circle in the net to aim and shoot!'}
        </div>

        {/* RINK */}
        <div style={{
          position: 'relative', flex: 1, width: 760, maxWidth: '100%',
          background: 'linear-gradient(180deg,#F4FAFF 0%,#E1EEFA 100%)',
          borderRadius: 26, boxShadow: 'inset 0 0 0 6px #fff, 0 10px 24px rgba(11,42,91,.14)',
          overflow: 'hidden', marginBottom: 14
        }}>

          {/* goal line */}
          <div style={{
            position: 'absolute', top: 145, left: 0, width: '100%', height: 5,
            background: showGoal ? 'rgba(226,59,78,.9)' : 'rgba(226,59,78,.45)',
            transition: 'background .2s',
            animation: showGoal ? 'goalFlash .3s ease 3' : 'none'
          }} />

          {/* NET frame */}
          <div style={{
            position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
            width: 320, height: 130, border: '8px solid #B8C8DA', borderBottom: 'none',
            borderRadius: '16px 16px 0 0',
            background: 'repeating-linear-gradient(90deg,rgba(160,180,205,.45) 0 1px,transparent 1px 18px),repeating-linear-gradient(0deg,rgba(160,180,205,.45) 0 1px,transparent 1px 18px)',
            zIndex: 2
          }}>
            {/* AIM TARGETS inside net */}
            {(['left','top','right'] as Zone[]).map(zone => {
              const isOpen = !shooting && Math.abs(goalieX - ZONE_GOALIE_X[zone]) > 60
              return (
                <button
                  key={zone}
                  onClick={() => shoot(zone)}
                  disabled={shooting}
                  style={{
                    position: 'absolute',
                    left: TARGET_POS[zone].left,
                    top: TARGET_POS[zone].top,
                    transform: 'translate(-50%,-50%)',
                    width: 64, height: 64, borderRadius: '50%', border: 'none',
                    cursor: shooting ? 'default' : 'pointer',
                    background: isOpen
                      ? 'rgba(226,59,78,.85)'
                      : 'rgba(255,255,255,.55)',
                    boxShadow: isOpen
                      ? '0 0 0 4px rgba(226,59,78,.35), 0 0 20px rgba(226,59,78,.5)'
                      : '0 0 0 3px rgba(200,215,230,.7)',
                    animation: !shooting ? 'targetPulse 1.4s ease-in-out infinite' : 'none',
                    animationDelay: zone === 'left' ? '0s' : zone === 'top' ? '0.45s' : '0.9s',
                    touchAction: 'manipulation',
                    zIndex: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                    transition: 'background .2s, box-shadow .2s',
                    opacity: shooting ? 0 : 1,
                  }}
                >
                  {isOpen ? '🎯' : ''}
                </button>
              )
            })}
          </div>

          {/* GOALIE */}
          <div style={{
            position: 'absolute', top: 56, left: '50%',
            transform: `translateX(-50%)`,
            zIndex: 3,
          }}>
            <div style={{
              transform: goalieTransform,
              transition: goalieTransition,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              {/* helmet */}
              <div style={{
                width: 52, height: 28, borderRadius: '50% 50% 0 0',
                background: team, border: '3px solid #0B2A5B',
                position: 'relative', zIndex: 1
              }}>
                {/* face cage bars */}
                <div style={{ position: 'absolute', left: '20%', top: '30%', width: 2, height: '65%', background: 'rgba(11,42,91,.5)' }} />
                <div style={{ position: 'absolute', left: '45%', top: '30%', width: 2, height: '65%', background: 'rgba(11,42,91,.5)' }} />
                <div style={{ position: 'absolute', left: '70%', top: '30%', width: 2, height: '65%', background: 'rgba(11,42,91,.5)' }} />
              </div>
              {/* head */}
              <div style={{ width: 44, height: 36, borderRadius: '50%', background: '#F5C5A0', border: '3px solid #0B2A5B', marginTop: -4 }} />
              {/* body / chest protector */}
              <div style={{ width: 80, height: 64, borderRadius: '14px 14px 10px 10px', background: team, marginTop: -4, position: 'relative', border: '3px solid rgba(11,42,91,.3)' }}>
                {/* jersey number */}
                <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Jersey 25'", fontSize: 22, color: '#fff', opacity: .8 }}>
                  {settings.jerseyNumber}
                </div>
                {/* blocker (right) */}
                <div style={{ position: 'absolute', right: -22, top: 6, width: 22, height: 44, background: '#fff', borderRadius: '6px 12px 12px 6px', border: '2px solid #C9D6E6' }} />
                {/* glove (left) */}
                <div style={{ position: 'absolute', left: -20, top: 6, width: 20, height: 44, background: '#fff', borderRadius: '12px 6px 6px 12px', border: '2px solid #C9D6E6' }} />
              </div>
              {/* pads */}
              <div style={{ display: 'flex', gap: 4, marginTop: -2 }}>
                <div style={{ width: 36, height: 22, background: team, borderRadius: '0 0 10px 10px', border: '2px solid rgba(11,42,91,.2)' }} />
                <div style={{ width: 36, height: 22, background: team, borderRadius: '0 0 10px 10px', border: '2px solid rgba(11,42,91,.2)' }} />
              </div>
            </div>
          </div>

          {/* PUCK */}
          <div style={puckStyle} />

          {/* SHOT ARC hint arrow — shows briefly at shot start */}
          {shooting && shotZone && (
            <div style={{
              position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
              fontSize: 28, pointerEvents: 'none', opacity: 0.6,
              animation: 'goalFlash .2s ease 1 forwards'
            }}>🏒</div>
          )}

          {/* GOAL! flash text */}
          {showGoal && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                fontFamily: "'Jersey 25'", fontSize: 88, color: '#E23B4E',
                textShadow: '0 6px 0 rgba(226,59,78,.3)',
                animation: 'targetPulse .3s ease'
              }}>GOAL!</div>
            </div>
          )}
        </div>

        {/* SCORE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0C1424', borderRadius: 14, padding: '8px 28px', boxShadow: 'inset 0 0 0 3px #1d2942' }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>GOALS</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 48, color: '#FFB200', lineHeight: 1 }}>{goals}</span>
          </div>
          <div style={{ fontSize: 16, color: '#7184A0', maxWidth: 240, textAlign: 'center', lineHeight: 1.4 }}>
            {shooting
              ? '🚨 Puck is flying!'
              : <><span style={{ color: '#E23B4E', fontWeight: 700 }}>🎯 Red circles</span> are open — tap one to shoot!</>
            }
          </div>
        </div>
      </div>
    </>
  )
}
