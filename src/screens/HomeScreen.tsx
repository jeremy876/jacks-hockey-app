import { Screen, Settings } from '../types'

interface TileProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  tag: 'PLAY' | 'LEARN'
  onClick: () => void
}

function Tile({ icon, title, subtitle, tag, onClick }: TileProps) {
  const isPlay = tag === 'PLAY'
  return (
    <button
      onClick={onClick}
      onPointerDown={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(3px)'
        el.style.boxShadow = '0 5px 0 rgba(11,42,91,.10)'
      }}
      onPointerUp={e => {
        const el = e.currentTarget
        el.style.transform = ''
        el.style.boxShadow = '0 8px 0 rgba(11,42,91,.10)'
      }}
      onPointerLeave={e => {
        const el = e.currentTarget
        el.style.transform = ''
        el.style.boxShadow = '0 8px 0 rgba(11,42,91,.10)'
      }}
      style={{
        cursor: 'pointer', border: 'none', textAlign: 'left',
        background: '#fff', borderRadius: 22, padding: 18,
        boxShadow: '0 8px 0 rgba(11,42,91,.10)',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', touchAction: 'manipulation',
        transition: 'transform .08s, box-shadow .08s',
        fontFamily: "'Fredoka'",
      }}
    >
      <div style={{
        position: 'absolute', top: 14, right: 14,
        fontSize: 11, fontWeight: 700, letterSpacing: 1,
        color: isPlay ? '#E23B4E' : '#2FA35A',
        background: isPlay ? '#FDE7EA' : '#E4F6EC',
        padding: '4px 9px', borderRadius: 999
      }}>{tag}</div>
      <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.05, color: '#0B2A5B' }}>{title}</div>
      <div style={{ fontSize: 14, color: '#7184A0' }}>{subtitle}</div>
    </button>
  )
}

interface Props {
  settings: Settings
  stars: number
  onNavigate: (s: Screen) => void
}

export function HomeScreen({ settings, stars, onNavigate }: Props) {
  const team = settings.teamColor
  const name = settings.childName || 'Jack'
  const nameUpper = name.toUpperCase()

  return (
    <div style={{
      flex: 1, display: 'flex', gap: 26, padding: '6px 30px 30px', overflow: 'hidden'
    }}>
      {/* LOCKER CARD */}
      <div style={{
        width: 320, flexShrink: 0, background: '#fff', borderRadius: 28,
        boxShadow: '0 14px 30px rgba(11,42,91,.16)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ height: 84, background: team, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: 3, opacity: .9 }}>
            {nameUpper}'S LOCKER
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 24px', marginTop: -46 }}>
          <div style={{
            width: 128, height: 128, borderRadius: '50%', background: '#EAF3FB',
            border: '6px solid #fff', boxShadow: '0 8px 18px rgba(11,42,91,.18)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {settings.photo ? (
              <img src={settings.photo} alt="Jack" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: 48, lineHeight: 1 }}>🏒</div>
            )}
          </div>
          {/* Jersey */}
          <div style={{
            marginTop: 16, width: 200, height: 150, background: team,
            borderRadius: '18px 18px 26px 26px', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(11,42,91,.18)'
          }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 96, height: 26, background: team, borderRadius: '0 0 40px 40px' }} />
            <div style={{ position: 'absolute', top: 0, left: -26, width: 46, height: 54, background: team, borderRadius: 14, transform: 'rotate(-18deg)' }} />
            <div style={{ position: 'absolute', top: 0, right: -26, width: 46, height: 54, background: team, borderRadius: 14, transform: 'rotate(18deg)' }} />
            <div style={{ fontFamily: "'Jersey 25'", fontSize: 96, color: '#fff', lineHeight: 1, textShadow: '0 3px 0 rgba(0,0,0,.15)' }}>
              {settings.jerseyNumber}
            </div>
            <div style={{ position: 'absolute', bottom: 10, fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 15, letterSpacing: 3, color: 'rgba(255,255,255,.85)' }}>
              {nameUpper}
            </div>
          </div>
          <div style={{ marginTop: 18, width: '100%', background: '#F2F7FB', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#3A5377' }}>Pucks today</span>
            <span style={{ fontFamily: "'Jersey 25'", fontSize: 30, color: team }}>{stars}</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }} />
        <button
          onClick={() => onNavigate('grown')}
          style={{
            margin: '0 18px 18px', border: 'none', cursor: 'pointer',
            background: '#EEF3F9', color: '#7184A0', fontFamily: "'Fredoka'",
            fontWeight: 600, fontSize: 14, padding: 11, borderRadius: 12,
            touchAction: 'manipulation'
          }}
        >🔒 Grown-Ups</button>
      </div>

      {/* TILE GRID */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 30, margin: '2px 4px 14px' }}>
          Pick a game, <span style={{ color: team }}>#{settings.jerseyNumber}</span>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: 16 }}>

          <Tile tag="PLAY" title="Shoot the Puck" subtitle="Score a big goal!" onClick={() => onNavigate('shoot')}
            icon={<div style={{ width: 34, height: 24, background: '#14171C', borderRadius: '50%', boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.12)' }} />}
          />
          <Tile tag="LEARN" title="Count the Pucks" subtitle="1 to 12, your number!" onClick={() => onNavigate('count')}
            icon={<div style={{ fontFamily: "'Jersey 25'", fontSize: 38, color: team, lineHeight: 1 }}>12</div>}
          />
          <Tile tag="PLAY" title="Skate the Puck" subtitle="Trace the path." onClick={() => onNavigate('trace')}
            icon={<div style={{ width: 30, height: 30, border: '5px dotted #5BC0EB', borderRadius: '50%' }} />}
          />
          <Tile tag="LEARN" title="Spell My Name" subtitle={nameUpper.split('').join(' - ')} onClick={() => onNavigate('spell')}
            icon={<div style={{ fontFamily: "'Jersey 25'", fontSize: 40, color: '#F5A300', lineHeight: 1 }}>{nameUpper[0] || 'J'}</div>}
          />
          <Tile tag="LEARN" title="Match the Gear" subtitle="Find the pairs." onClick={() => onNavigate('match')}
            icon={<div style={{ display: 'flex', gap: 5 }}>
              <div style={{ width: 18, height: 24, background: '#2FA35A', borderRadius: 5 }} />
              <div style={{ width: 18, height: 24, background: '#9ED9B6', borderRadius: 5 }} />
            </div>}
          />
          <Tile tag="LEARN" title="Hockey Words" subtitle="Tap & hear it." onClick={() => onNavigate('sounds')}
            icon={<div style={{ width: 18, height: 18, borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 0 7px rgba(139,92,246,.25),0 0 0 14px rgba(139,92,246,.12)' }} />}
          />
          <Tile tag="PLAY" title="Goal Song" subtitle="Sing & celebrate!" onClick={() => onNavigate('song')}
            icon={<div style={{ width: 0, height: 0, borderLeft: '24px solid #E23B4E', borderTop: '15px solid transparent', borderBottom: '15px solid transparent', marginLeft: 6 }} />}
          />
          <Tile tag="PLAY" title="Color & Draw" subtitle="Make hockey art!" onClick={() => onNavigate('draw')}
            icon={<div style={{ display: 'flex', gap: 6 }}>
              {['#E23B4E','#2FA35A','#1657C7'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
            </div>}
          />
          <Tile tag="PLAY" title="Pop the Pucks" subtitle="Tap to pop them!" onClick={() => onNavigate('pop')}
            icon={<div style={{ position: 'relative', width: 40, height: 40 }}>
              <div style={{ position: 'absolute', left: 0, top: 6, width: 20, height: 15, background: '#E23B4E', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', right: 0, top: 3, width: 17, height: 13, background: '#1657C7', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', left: 10, bottom: 0, width: 16, height: 12, background: '#F5A300', borderRadius: '50%' }} />
            </div>}
          />
        </div>
      </div>
    </div>
  )
}
