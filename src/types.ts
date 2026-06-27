export type Screen =
  | 'home' | 'shoot' | 'count' | 'trace' | 'spell'
  | 'match' | 'sounds' | 'song' | 'draw' | 'pop' | 'grown'
  | 'airhockey'

export interface Settings {
  childName: string
  jerseyNumber: number
  teamColor: string
  soundOn: boolean
  photo: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  childName: 'Jack',
  jerseyNumber: 12,
  teamColor: '#1657C7',
  soundOn: true,
  photo: null,
}

export const TEAM_COLOR_PRESETS = ['#1657C7', '#0B2A5B', '#C8102E', '#0E7A3B', '#111827']

export interface CelebrationState {
  visible: boolean
  text: string
}
