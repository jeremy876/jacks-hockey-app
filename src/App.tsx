import { useState, useCallback, useRef } from 'react'
import { Screen } from './types'
import { useSettings } from './hooks/useSettings'
import { useAudio } from './hooks/useAudio'
import { RinkMarkings } from './components/RinkMarkings'
import { ScoreboardBar } from './components/ScoreboardBar'
import { CelebrationOverlay } from './components/CelebrationOverlay'
import { HomeScreen } from './screens/HomeScreen'
import { ShootScreen } from './screens/ShootScreen'
import { CountScreen } from './screens/CountScreen'
import { TraceScreen } from './screens/TraceScreen'
import { SpellScreen } from './screens/SpellScreen'
import { MatchScreen } from './screens/MatchScreen'
import { WordsScreen } from './screens/WordsScreen'
import { SongScreen } from './screens/SongScreen'
import { DrawScreen } from './screens/DrawScreen'
import { PopScreen } from './screens/PopScreen'
import { GrownUpsScreen } from './screens/GrownUpsScreen'
import { AirHockeyScreen } from './screens/AirHockeyScreen'

export default function App() {
  const { settings, updateSettings } = useSettings()
  const [screen, setScreen] = useState<Screen>('home')
  const [stars, setStars] = useState(0)
  const [celebration, setCelebration] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' })
  const celebTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playPop, playCheer } = useAudio(settings.soundOn)

  const navigate = useCallback((s: Screen) => {
    playPop()
    setScreen(s)
  }, [playPop])

  const celebrate = useCallback((text: string) => {
    playCheer()
    setStars(s => s + 1)
    setCelebration({ visible: true, text })
    if (celebTimer.current) clearTimeout(celebTimer.current)
    celebTimer.current = setTimeout(() => setCelebration({ visible: false, text: '' }), 2800)
  }, [playCheer])

  const closeCelebration = useCallback(() => {
    if (celebTimer.current) clearTimeout(celebTimer.current)
    setCelebration({ visible: false, text: '' })
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Fredoka', system-ui, sans-serif",
      color: '#0B2A5B',
      background: 'linear-gradient(180deg,#EAF3FB 0%,#D2E6F7 100%)',
      userSelect: 'none',
      display: 'flex', flexDirection: 'column'
    }}>
      <RinkMarkings />

      <ScoreboardBar
        screen={screen}
        settings={settings}
        stars={stars}
        onGoHome={() => navigate('home')}
      />

      <div style={{ position: 'relative', zIndex: 3, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {screen === 'home'      && <HomeScreen settings={settings} stars={stars} onNavigate={navigate} />}
        {screen === 'shoot'     && <ShootScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'count'     && <CountScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'trace'     && <TraceScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'spell'     && <SpellScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'match'     && <MatchScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'sounds'    && <WordsScreen settings={settings} />}
        {screen === 'song'      && <SongScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'draw'      && <DrawScreen settings={settings} />}
        {screen === 'pop'       && <PopScreen settings={settings} onCelebrate={celebrate} />}
        {screen === 'grown'     && <GrownUpsScreen settings={settings} onUpdate={updateSettings} />}
        {screen === 'airhockey' && <AirHockeyScreen soundOn={settings.soundOn} onGoHome={() => navigate('home')} />}
      </div>

      <CelebrationOverlay
        visible={celebration.visible}
        text={celebration.text}
        teamColor={settings.teamColor}
        onClose={closeCelebration}
      />
    </div>
  )
}
