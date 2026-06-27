import { useState, useCallback } from 'react'
import { Settings, DEFAULT_SETTINGS } from '../types'

const STORAGE_KEY = 'jacks_hockey_settings'

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(load)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { settings, updateSettings }
}
