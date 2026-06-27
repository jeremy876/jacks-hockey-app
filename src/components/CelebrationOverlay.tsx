import { useEffect, useState } from 'react'

interface Confetti {
  id: number
  left: string
  width: number
  height: number
  color: string
  duration: number
  delay: number
}

interface Props {
  visible: boolean
  text: string
  teamColor: string
  onClose: () => void
}

function makeConfetti(team: string): Confetti[] {
  const colors = [team, '#E23B4E', '#FFB200', '#36D07A', '#5BC0EB', '#ffffff']
  return Array.from({ length: 50 }, (_, i) => {
    const size = 8 + Math.random() * 13
    return {
      id: i,
      left: (Math.random() * 100) + '%',
      width: size,
      height: size * 1.5,
      color: colors[i % colors.length],
      duration: 1.6 + Math.random() * 1.5,
      delay: Math.random() * 0.5,
    }
  })
}

export function CelebrationOverlay({ visible, text, teamColor, onClose }: Props) {
  const [confetti, setConfetti] = useState<Confetti[]>([])

  useEffect(() => {
    if (visible) setConfetti(makeConfetti(teamColor))
  }, [visible, teamColor])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes confFall { to { transform: translateY(900px) rotate(720deg); } }
        @keyframes popIn { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes spinPuck { to { transform: rotate(360deg); } }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(11,42,91,.32)', cursor: 'pointer'
        }}
      >
        {confetti.map(c => (
          <div key={c.id} style={{
            position: 'absolute', top: -40, left: c.left,
            width: c.width, height: c.height,
            background: c.color, borderRadius: 2,
            animation: `confFall ${c.duration}s linear ${c.delay}s forwards`,
            pointerEvents: 'none'
          }} />
        ))}
        <div style={{
          background: '#fff', borderRadius: 30, padding: '40px 64px',
          textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.3)',
          animation: 'popIn .45s cubic-bezier(.2,1.4,.4,1) both'
        }}>
          <div style={{
            width: 90, height: 64, background: '#14171C', borderRadius: '50%',
            margin: '0 auto 18px',
            animation: 'spinPuck 1.2s linear infinite',
            boxShadow: 'inset 0 -6px 0 rgba(255,255,255,.12)'
          }} />
          <div style={{ fontFamily: "'Jersey 25'", fontSize: 64, color: '#E23B4E', lineHeight: 1 }}>{text}</div>
          <div style={{ marginTop: 10, fontSize: 18, color: '#7184A0' }}>Tap to keep playing</div>
        </div>
      </div>
    </>
  )
}
