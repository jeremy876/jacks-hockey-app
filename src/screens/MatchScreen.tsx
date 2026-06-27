import { useState, useMemo } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

const GEAR = [
  { label: 'PUCK',    color: '#14171C', icon: <div style={{ width: 40, height: 28, background: '#14171C', borderRadius: '50%' }} /> },
  { label: 'STICK',   color: '#8B5CF6', icon: <div style={{ width: 14, height: 46, background: '#8B5CF6', borderRadius: 4, transform: 'rotate(20deg)' }} /> },
  { label: 'NET',     color: '#E23B4E', icon: <div style={{ width: 44, height: 38, border: '5px solid #E23B4E', borderRadius: 8 }} /> },
  { label: 'SKATE',   color: '#2FA35A', icon: <div style={{ width: 46, height: 30, background: '#2FA35A', borderRadius: '6px 6px 14px 6px' }} /> },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] }; return a
}

export function MatchScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const { playPop, playChime } = useAudio(settings.soundOn)

  const cards = useMemo(() => {
    const pairs = GEAR.flatMap((g, i) => [{ ...g, id: i * 2 }, { ...g, id: i * 2 + 1 }])
    return shuffle(pairs)
  }, [])

  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [checking, setChecking] = useState(false)
  const [lastFlipped, setLastFlipped] = useState<number[]>([])

  function flipCard(cardIndex: number) {
    if (checking || flipped.has(cardIndex) || matched.has(cardIndex)) return
    playPop()

    const newFlipped = new Set([...flipped, cardIndex])
    setFlipped(newFlipped)
    const pending = [...lastFlipped, cardIndex]

    if (pending.length === 2) {
      setChecking(true)
      const [a, b] = pending
      if (cards[a].label === cards[b].label) {
        playChime(3)
        const newMatched = new Set([...matched, a, b])
        setMatched(newMatched)
        setLastFlipped([])
        setChecking(false)
        if (newMatched.size === cards.length) {
          setTimeout(() => onCelebrate('PERFECT MATCH! ⭐'), 300)
        }
      } else {
        setTimeout(() => {
          setFlipped(prev => {
            const next = new Set(prev)
            next.delete(a); next.delete(b)
            return next
          })
          setLastFlipped([])
          setChecking(false)
        }, 1000)
      }
      setLastFlipped([])
    } else {
      setLastFlipped(pending)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
      <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Match the Gear</div>
      <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 18 }}>Flip two cards. Find the matching hockey gear!</div>
      <div style={{
        flex: 1, width: 780, maxWidth: '100%',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(2,1fr)', gap: 18
      }}>
        {cards.map((card, i) => {
          const up = flipped.has(i) || matched.has(i)
          const isMatched = matched.has(i)
          return (
            <div
              key={card.id}
              onClick={() => flipCard(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isMatched ? '#E4F6EC' : up ? '#fff' : team,
                borderRadius: 18, boxShadow: '0 8px 0 rgba(11,42,91,.10)',
                cursor: up ? 'default' : 'pointer',
                transition: 'background .2s',
                touchAction: 'manipulation',
                border: isMatched ? '3px solid #2FA35A' : 'none'
              }}
            >
              {up ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60 }}>
                    {card.icon}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#3A5377' }}>{card.label}</span>
                </div>
              ) : (
                <div style={{ width: 38, height: 28, background: '#14171C', borderRadius: '50%', boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.12)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
