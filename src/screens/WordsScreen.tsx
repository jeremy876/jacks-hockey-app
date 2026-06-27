import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
}

const WORDS = [
  { word: 'PUCK',    color: '#14171C', icon: <div style={{ width: 40, height: 28, background: '#14171C', borderRadius: '50%' }} /> },
  { word: 'STICK',   color: '#8B5CF6', icon: <div style={{ width: 14, height: 46, background: '#8B5CF6', borderRadius: 4, transform: 'rotate(20deg)' }} /> },
  { word: 'NET',     color: '#E23B4E', icon: <div style={{ width: 44, height: 38, border: '5px solid #E23B4E', borderRadius: 8 }} /> },
  { word: 'SKATE',   color: '#2FA35A', icon: <div style={{ width: 46, height: 30, background: '#2FA35A', borderRadius: '6px 6px 14px 6px' }} /> },
  { word: 'HELMET',  color: '#1657C7', icon: <div style={{ width: 46, height: 24, background: '#1657C7', borderRadius: '24px 24px 0 0' }} /> },
  { word: 'GLOVE',   color: '#F5A300', icon: <div style={{ width: 36, height: 42, background: '#F5A300', borderRadius: '8px 14px 8px 8px' }} /> },
]

export function WordsScreen({ settings }: Props) {
  const { say } = useAudio(settings.soundOn)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
      <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Hockey Words</div>
      <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 18 }}>Tap a card to hear the word out loud.</div>
      <div style={{
        flex: 1, width: 840, maxWidth: '100%',
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(2,1fr)', gap: 20
      }}>
        {WORDS.map(w => (
          <button
            key={w.word}
            onClick={() => say(w.word)}
            onPointerDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = '0 5px 0 rgba(11,42,91,.10)' }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 0 rgba(11,42,91,.10)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 0 rgba(11,42,91,.10)' }}
            style={{
              cursor: 'pointer', border: 'none', background: '#fff', borderRadius: 22,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 14, boxShadow: '0 8px 0 rgba(11,42,91,.10)', touchAction: 'manipulation',
              transition: 'transform .08s, box-shadow .08s',
            }}
          >
            <div style={{
              width: 70, height: 70, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: w.color + '22'
            }}>
              {w.icon}
            </div>
            <span style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 30, letterSpacing: 1, color: '#0B2A5B' }}>{w.word}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
