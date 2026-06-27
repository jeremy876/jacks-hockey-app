import { Screen, Settings } from '../types'

interface Props {
  screen: Screen
  settings: Settings
  stars: number
  onGoHome: () => void
}

export function ScoreboardBar({ screen, settings, stars, onGoHome }: Props) {
  const isHome = screen === 'home'
  const name = settings.childName || 'Jack'
  const nameUpper = name.toUpperCase()
  const team = settings.teamColor

  return (
    <div style={{
      position: 'relative', zIndex: 5, height: 96,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 26px', flexShrink: 0
    }}>
      <div style={{ minWidth: 230, display: 'flex', alignItems: 'center' }}>
        {isHome ? (
          <div style={{ fontSize: 26, fontWeight: 600, color: '#3A5377' }}>
            Hi <span style={{ color: team, fontWeight: 700 }}>{name}</span>! Ready to play?
          </div>
        ) : (
          <button
            onClick={onGoHome}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              border: 'none', cursor: 'pointer', background: '#fff', color: team,
              fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 22,
              padding: '12px 22px 12px 16px', borderRadius: 999,
              boxShadow: '0 4px 0 rgba(11,42,91,.18)', touchAction: 'manipulation'
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: '50%', background: team, color: '#fff', fontSize: 20
            }}>←</span>
            RINK
          </button>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: '#0C1424', borderRadius: 16, padding: '10px 20px',
        boxShadow: 'inset 0 0 0 3px #1d2942, 0 6px 14px rgba(11,42,91,.25)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
          <div style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>PLAYER</div>
          <div style={{ fontFamily: "'Jersey 25'", fontSize: 30, color: '#FFB200', letterSpacing: 2 }}>{nameUpper}</div>
        </div>
        <div style={{ width: 2, height: 36, background: '#26334f' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
          <div style={{ fontFamily: "'Fredoka'", fontSize: 11, letterSpacing: 2, color: '#6f86b8', fontWeight: 600 }}>NUMBER</div>
          <div style={{ fontFamily: "'Jersey 25'", fontSize: 30, color: '#36D07A' }}>{settings.jerseyNumber}</div>
        </div>
      </div>

      <div style={{ minWidth: 230, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          background: '#fff', padding: '9px 18px 9px 12px',
          borderRadius: 999, boxShadow: '0 4px 0 rgba(11,42,91,.12)'
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 22, background: '#14171C', borderRadius: '50%',
            boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.12)'
          }} />
          <span style={{ fontFamily: "'Jersey 25'", fontSize: 30, color: team, lineHeight: 1 }}>{stars}</span>
        </div>
      </div>
    </div>
  )
}
