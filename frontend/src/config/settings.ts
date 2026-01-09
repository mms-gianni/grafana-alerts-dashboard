export interface AppSettings {
  viewMode: 'compact' | 'grid'
  selectedStates: string[]
  selectedInstances: string[]
  selectedLabels: string[]
  fontSize: number
  theme: 'light' | 'system' | 'dark'
  showNormalSubalerts: boolean
  highlightDuration: number
  notificationSound: string
  notificationVolume: number
}

/**
 * Get hardcoded fallback defaults.
 * These are used only if the backend is unavailable.
 * Normally, defaults come from the backend via WebSocket.
 */
export const getFallbackDefaults = (): AppSettings => ({
  viewMode: 'compact',
  selectedStates: ['alerting', 'pending', 'no_data', 'paused', 'silenced', 'ok'],
  selectedInstances: [],
  selectedLabels: [],
  fontSize: 2,
  theme: 'dark',
  showNormalSubalerts: false,
  highlightDuration: 10,
  notificationSound: 'notification-1.mp3',
  notificationVolume: 0.5,
})
