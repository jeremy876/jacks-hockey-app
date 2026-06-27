import { useState, useRef, useMemo } from 'react'
import { Settings } from '../types'
import { useAudio } from '../hooks/useAudio'

interface Props {
  settings: Settings
  onCelebrate: (text: string) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SpellScreen({ settings, onCelebrate }: Props) {
  const team = settings.teamColor
  const name = (settings.childName || 'Jack').toUpperCase().slice(0, 6)
  const letters = name.split('')
  const { playPop, say } = useAudio(settings.soundOn)

  const tray = useMemo(() => shuffle(letters.map((l, i) => ({ l, id: i }))), [name])
  const [slots, setSlots] = useState<(string | null)[]>(() => new Array(letters.length).fill(null))
  const [placed, setPlaced] = useState<Set<number>>(new Set())
  const draggingId = useRef<number | null>(null)
  const draggingEl = useRef<HTMLDivElement | null>(null)

  function startDrag(id: number, e: React.PointerEvent) {
    if (placed.has(id)) return
    draggingId.current = id
    const clone = (e.currentTarget as HTMLElement).cloneNode(true) as HTMLDivElement
    clone.style.cssText = `position:fixed;z-index:100;pointer-events:none;opacity:.85;transform:translate(-50%,-50%);left:${e.clientX}px;top:${e.clientY}px;`
    document.body.appendChild(clone)
    draggingEl.current = clone
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function moveDrag(e: React.PointerEvent) {
    if (draggingEl.current) {
      draggingEl.current.style.left = `${e.clientX}px`
      draggingEl.current.style.top = `${e.clientY}px`
    }
  }

  function endDrag(e: React.PointerEvent) {
    if (draggingId.current === null) return
    const id = draggingId.current
    draggingId.current = null
    if (draggingEl.current) { document.body.removeChild(draggingEl.current); draggingEl.current = null }

    // Check which slot we dropped on
    const slotEls = document.querySelectorAll('[data-spell-slot]')
    for (let i = 0; i < slotEls.length; i++) {
      const rect = slotEls[i].getBoundingClientRect()
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const letter = tray[id]?.l
        if (letter === letters[i] && slots[i] === null) {
          say(letter)
          const newSlots = [...slots]; newSlots[i] = letter
          setSlots(newSlots)
          setPlaced(p => new Set([...p, id]))
          if (newSlots.every(s => s !== null)) {
            setTimeout(() => onCelebrate(`${name}! 🎉`), 400)
          }
        } else {
          playPop()
        }
        return
      }
    }
    playPop()
  }

  function reset() {
    setSlots(new Array(letters.length).fill(null))
    setPlaced(new Set())
    playPop()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 30px 24px', overflow: 'hidden' }}>
      <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 34 }}>Spell My Name</div>
      <div style={{ fontSize: 18, color: '#7184A0', marginBottom: 22 }}>
        Drag each letter puck into its jersey. You spell <b style={{ color: team }}>{name}</b>!
      </div>

      {/* slots */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 46 }}>
        {letters.map((l, i) => (
          <div
            key={i}
            data-spell-slot={i}
            style={{
              width: 120, height: 150, borderRadius: '18px 18px 26px 26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Jersey 25'", fontSize: 84,
              background: slots[i] ? team : '#EAF1F9',
              border: slots[i] ? `5px solid ${team}` : '5px dashed rgba(22,87,199,.35)',
              color: slots[i] ? '#fff' : 'rgba(22,87,199,.28)',
              transition: 'background .2s'
            }}
          >{slots[i] || l}</div>
        ))}
      </div>

      <div style={{ fontSize: 16, color: '#9DB1CF', fontWeight: 600, marginBottom: 14 }}>LETTER PUCKS</div>
      <div style={{ display: 'flex', gap: 22 }}>
        {tray.map((item) => (
          <div
            key={item.id}
            onPointerDown={(e) => startDrag(item.id, e)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              width: 92, height: 66, background: placed.has(item.id) ? 'rgba(20,23,28,.2)' : '#14171C',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Jersey 25'", fontSize: 40, color: '#fff',
              boxShadow: '0 8px 14px rgba(0,0,0,.25)',
              cursor: placed.has(item.id) ? 'default' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
              opacity: placed.has(item.id) ? 0.3 : 1,
              transition: 'opacity .2s'
            }}
          >{placed.has(item.id) ? '' : item.l}</div>
        ))}
      </div>

      <button
        onClick={reset}
        style={{
          marginTop: 28, cursor: 'pointer', border: 'none', background: '#fff', color: team,
          fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 20,
          padding: '12px 30px', borderRadius: 999, boxShadow: '0 5px 0 rgba(11,42,91,.14)',
          touchAction: 'manipulation'
        }}
      >Try Again</button>
    </div>
  )
}
