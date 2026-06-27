import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

export function SongScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const name = settings.childName || 'Jack'
  const { playSong } = useAudio(settings.soundOn)

  function play() {
    playSong(() => onCelebrate(`GO ${name.toUpperCase()}! 🏒`))
  }

  return (
    <>
      <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 36, marginBottom: 6 }}>{name}'s Goal Song</div>
        <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 26 }}>Press the puck and sing along!</div>

        <button
          onClick={play}
          onPointerDown={e => { e.currentTarget.style.transform = 'translateY(6px)'; e.currentTarget.style.boxShadow = '0 8px 0 #000' }}
          onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 14px 0 #000, 0 20px 30px rgba(0,0,0,.3)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 14px 0 #000, 0 20px 30px rgba(0,0,0,.3)' }}
          style={{
            cursor: 'pointer', border: 'none', background: '#14171C',
            width: 170, height: 124, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 14px 0 #000, 0 20px 30px rgba(0,0,0,.3)',
            animation: 'bob 1.8s ease-in-out infinite',
            touchAction: 'manipulation',
            transition: 'transform .08s, box-shadow .08s'
          }}
        >
          <div style={{ width: 0, height: 0, borderLeft: '46px solid #FFB200', borderTop: '30px solid transparent', borderBottom: '30px solid transparent', marginLeft: 12 }} />
        </button>

        <div style={{
          marginTop: 34, background: '#fff', borderRadius: 22,
          padding: '24px 44px', boxShadow: '0 10px 24px rgba(11,42,91,.12)',
          textAlign: 'center', maxWidth: 620
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.5, color: team }}>
            ♪ {name} shoots, {name} scores! ♪<br />
            <span style={{ color: '#0B2A5B' }}>Number {settings.jerseyNumber} the crowd adores!</span><br />
            ♪ Raise the stick and cheer some more ♪<br />
            <span style={{ color: '#E23B4E' }}>GOOOAL for {name}!</span>
          </div>
        </div>
      </div>
    </>
  )
}
