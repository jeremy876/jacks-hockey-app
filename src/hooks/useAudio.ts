import { useRef, useCallback } from 'react'

export function useAudio(soundOn: boolean) {
  const acRef = useRef<AudioContext | null>(null)

  const getAC = useCallback(() => {
    if (!soundOn) return null
    if (!acRef.current) {
      try {
        acRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch { return null }
    }
    if (acRef.current.state === 'suspended') {
      try { acRef.current.resume() } catch {}
    }
    return acRef.current
  }, [soundOn])

  const tone = useCallback((freq: number, dur: number, type: OscillatorType, vol: number, when = 0) => {
    const ac = getAC(); if (!ac) return
    const t0 = ac.currentTime + when
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(vol, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(ac.destination)
    o.start(t0); o.stop(t0 + dur + 0.03)
  }, [getAC])

  const playPop = useCallback(() => {
    tone(520, 0.12, 'triangle', 0.22)
    tone(780, 0.10, 'triangle', 0.16, 0.05)
  }, [tone])

  const playWhistle = useCallback(() => {
    tone(2300, 0.16, 'square', 0.10)
    tone(2650, 0.18, 'square', 0.09, 0.05)
  }, [tone])

  const playChime = useCallback((n: number) => {
    const f = 392 + n * 34
    tone(f, 0.20, 'sine', 0.26)
    tone(f * 1.5, 0.16, 'sine', 0.12, 0.02)
  }, [tone])

  const playPuck = useCallback(() => {
    const f = 300 + Math.random() * 520
    tone(f, 0.11, 'triangle', 0.26)
    tone(f * 0.55, 0.16, 'sine', 0.18, 0.02)
  }, [tone])

  const playCheer = useCallback(() => {
    const ac = getAC(); if (!ac) return
    const dur = 0.95
    const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const env = Math.min(1, i / 2200) * Math.max(0, 1 - i / d.length)
      d[i] = (Math.random() * 2 - 1) * env * 0.5
    }
    const src = ac.createBufferSource(); src.buffer = buf
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 0.6
    const g = ac.createGain(); g.gain.value = 0.45
    src.connect(bp).connect(g).connect(ac.destination); src.start()
    tone(523, 0.5, 'sawtooth', 0.08)
    tone(659, 0.5, 'sawtooth', 0.08)
    tone(784, 0.6, 'sawtooth', 0.09)
  }, [getAC, tone])

  const playSong = useCallback((onDone: () => void) => {
    const notes = [523, 659, 784, 659, 784, 880, 1046]
    notes.forEach((f, i) => tone(f, 0.32, 'triangle', 0.22, i * 0.26))
    setTimeout(onDone, notes.length * 260 + 80)
  }, [tone])

  const say = useCallback((text: string) => {
    if (!soundOn || !('speechSynthesis' in window)) { playPop(); return }
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.9; u.pitch = 1.25; u.volume = 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } catch { playPop() }
  }, [soundOn, playPop])

  return { playPop, playWhistle, playChime, playPuck, playCheer, playSong, say, tone }
}
