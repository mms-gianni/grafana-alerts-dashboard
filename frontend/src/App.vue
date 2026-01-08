<template>
  <div :class="['dashboard', `theme-${effectiveTheme}`]">
    <header class="dashboard-header">
      <div class="stats-section">
        <div class="stat">
          <span class="stat-label">Showing:</span>
          <span class="stat-value">{{ sortedAlerts.length }} / {{ alerts.length }}</span>
        </div>
        <div class="stat alerting">
          <span class="stat-label">Alerting:</span>
          <div class="stat-value">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ alertingCount }}</span>
          </div>
        </div>
        <div class="stat pending">
          <span class="stat-label">Pending:</span>
          <div class="stat-value">
            <i class="pi pi-clock"></i>
            <span>{{ pendingCount }}</span>
          </div>
        </div>
        <div class="stat no-data">
          <span class="stat-label">No Data:</span>
          <div class="stat-value">
            <i class="pi pi-question-circle"></i>
            <span>{{ noDataCount }}</span>
          </div>
        </div>
        <div class="stat paused">
          <span class="stat-label">Paused:</span>
          <div class="stat-value">
            <i class="pi pi-times-circle"></i>
            <span>{{ pausedCount }}</span>
          </div>
        </div>
        <div class="stat silenced">
          <span class="stat-label">Silenced:</span>
          <div class="stat-value">
            <i class="pi pi-volume-off"></i>
            <span>{{ silencedCount }}</span>
          </div>
        </div>
        <div class="stat ok">
          <span class="stat-label">OK:</span>
          <div class="stat-value">
            <i class="pi pi-check-circle"></i>
            <span>{{ okCount }}</span>
          </div>
        </div>
      </div>
      <div class="header-controls">
        <div class="connection-status">
          <div class="status-line">
            <i :class="['pi', connectionStatus.connected ? 'pi-check-circle' : 'pi-times-circle']"></i>
            <span>{{ connectionStatus.text }}</span>
          </div>
          <span class="last-update">Last update: {{ lastUpdate }}</span>
        </div>
        <button 
          class="drawer-toggle-btn"
          @click="refreshAlerts"
          :disabled="refreshing || !connectionStatus.connected"
          title="Refresh alerts"
        >
          <i :class="['pi', 'pi-refresh', { 'pi-spin': refreshing }]"></i>
        </button>
        <button 
          class="drawer-toggle-btn"
          @click="showSidebar = true"
          title="Open settings"
        >
          <i class="pi pi-cog"></i>
        </button>
      </div>
    </header>

    <SettingsSidebar
      v-model:visible="showSidebar"
      v-model:selectedStates="selectedStates"
      v-model:selectedInstances="selectedInstances"
      v-model:selectedLabels="selectedLabels"
      v-model:fontSize="fontSize"
      v-model:viewMode="viewMode"
      v-model:theme="theme"
      v-model:showNormalSubalerts="showNormalSubalerts"
      v-model:highlightDuration="highlightDuration"
      :availableInstances="availableInstances"
      :availableLabels="availableLabels"
    />

    <div class="alerts-container">
      <div v-if="loading" class="loading">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem"></i>
        <p>Loading alerts...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="alerts.length === 0" class="no-alerts">
        <i class="pi pi-check-circle"></i>
        <p>No alerts found. All systems operational!</p>
      </div>

      <div v-else-if="viewMode === 'compact'" class="alerts-compact">
        <div class="compact-header">
          <div class="header-icon"></div>
          <div class="header-name">Alert Name</div>
          <div class="header-group">Rule Group</div>
          <div class="header-totals">Alerts</div>
          <div class="header-labels">Labels</div>
          <div class="header-duration">Duration</div>
          <div class="header-actions"></div>
        </div>
        <AlertRow
          v-for="alert in sortedAlerts"
          :key="`${alert.instanceName || 'default'}-${alert.id}`"
          :alert="alert"
          :fontSize="fontSize"
          :showNormalSubalerts="showNormalSubalerts"
          :isNew="highlightDuration > 0 && newAlertIds.has(alert.id)"
        />
      </div>

      <div v-else class="alerts-grid">
        <AlertCard
          v-for="alert in sortedAlerts"
          :key="`${alert.instanceName || 'default'}-${alert.id}`"
          :alert="alert"
          :fontSize="fontSize"
          :showNormalSubalerts="showNormalSubalerts"
          :isNew="highlightDuration > 0 && newAlertIds.has(alert.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AlertCard from './components/AlertCard.vue'
import AlertRow from './components/AlertRow.vue'
import SettingsSidebar from './components/SettingsSidebar.vue'
import { io, Socket } from 'socket.io-client'
import type { GrafanaAlert } from './composables/useAlert'

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 365) => {
  const date = new Date()
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const loadSettings = () => {
  try {
    const saved = getCookie('alertsSettings')
    if (saved) {
      const settings = JSON.parse(decodeURIComponent(saved))
      return settings
    }
  } catch (e) {
    console.error('Failed to load settings from cookie:', e)
  }
  return null
}

const saveSettings = () => {
  const settings = {
    viewMode: viewMode.value,
    selectedStates: selectedStates.value,
    selectedInstances: selectedInstances.value,
    selectedLabels: selectedLabels.value,
    fontSize: fontSize.value,
    theme: theme.value,
    showNormalSubalerts: showNormalSubalerts.value,
    highlightDuration: highlightDuration.value
  }
  setCookie('alertsSettings', encodeURIComponent(JSON.stringify(settings)))
}

// Load saved settings
const savedSettings = loadSettings()

const alerts = ref<GrafanaAlert[]>([])
const newAlertIds = ref<Set<number>>(new Set())
const previousAlertStates = ref<Map<number, string>>(new Map())
const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdate = ref('Never')
const connectionStatus = ref({ connected: false, text: 'Connecting...' })
const viewMode = ref<'compact' | 'grid'>(savedSettings?.viewMode || 'compact')
const selectedStates = ref<string[]>(savedSettings?.selectedStates || ['alerting', 'pending', 'no_data', 'paused', 'silenced', 'ok'])
const selectedInstances = ref<string[]>(savedSettings?.selectedInstances || [])
const selectedLabels = ref<string[]>(savedSettings?.selectedLabels || [])
const fontSize = ref(savedSettings?.fontSize || 2)
const showSidebar = ref(false)
const refreshing = ref(false)
const theme = ref<'light' | 'system' | 'dark'>(savedSettings?.theme || 'dark')
const showNormalSubalerts = ref(savedSettings?.showNormalSubalerts ?? false)
const highlightDuration = ref(savedSettings?.highlightDuration ?? 10)

const systemPrefersDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// Watch for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  systemPrefersDark.value = e.matches
})

const effectiveTheme = computed(() => {
  if (theme.value === 'system') {
    return systemPrefersDark.value ? 'dark' : 'light'
  }
  return theme.value
})

let socket: Socket | null = null

const refreshAlerts = () => {
  if (socket && connectionStatus.value.connected) {
    refreshing.value = true
    socket.emit('getAlerts')
    setTimeout(() => {
      refreshing.value = false
    }, 1000)
  }
}

const availableInstances = computed(() => {
  const instances = new Set<string>()
  alerts.value.forEach(alert => {
    if (alert.instanceName) {
      instances.add(alert.instanceName)
    }
  })
  return Array.from(instances).sort()
})

const availableLabels = computed(() => {
  const labels = new Set<string>()
  alerts.value.forEach(alert => {
    if (alert.labels) {
      Object.entries(alert.labels).forEach(([key, value]) => {
        labels.add(`${key}:${value}`)
      })
    }
  })
  return Array.from(labels).sort()
})

const sortedAlerts = computed(() => {
  const stateOrder = { alerting: 0, pending: 1, no_data: 2, paused: 3, silenced: 4, ok: 5 }
  
  let filtered = [...alerts.value]
    .filter(alert => {
      // Show silenced alerts if 'silenced' is selected
      if (alert.isSilenced && selectedStates.value.includes('silenced')) return true
      // Show non-silenced alerts if their state is selected
      if (!alert.isSilenced && selectedStates.value.includes(alert.state)) return true
      return false
    })
    .filter(alert => {
      // If no instances selected, show all
      if (selectedInstances.value.length === 0) return true
      // Filter by selected instances
      return selectedInstances.value.includes(alert.instanceName || 'default')
    })
    .filter(alert => {
      // If no labels selected, show all
      if (selectedLabels.value.length === 0) return true
      // Check if alert has any of the selected labels
      if (!alert.labels) return false
      return selectedLabels.value.some(selectedLabel => {
        const [key, value] = selectedLabel.split(':')
        return alert.labels![key] === value
      })
    })
    .sort((a, b) => {
      const aOrder = stateOrder[a.state] ?? 99
      const bOrder = stateOrder[b.state] ?? 99
      return aOrder - bOrder
    })

  return filtered
})

const alertingCount = computed(() => alerts.value.filter(a => a.state === 'alerting').length)
const pendingCount = computed(() => alerts.value.filter(a => a.state === 'pending').length)
const noDataCount = computed(() => alerts.value.filter(a => a.state === 'no_data').length)
const pausedCount = computed(() => alerts.value.filter(a => a.state === 'paused').length)
const silencedCount = computed(() => alerts.value.filter(a => a.isSilenced).length)
const okCount = computed(() => alerts.value.filter(a => a.state === 'ok').length)

const updateLastUpdate = () => {
  const now = new Date()
  lastUpdate.value = now.toLocaleTimeString()
}

// Watch for sidebar closing to save settings
watch(showSidebar, (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    saveSettings()
  }
})

onMounted(() => {
  // In production (Docker), backend is on same host via nginx proxy
  // In development, use VITE_BACKEND_URL or localhost:3001
  const backendUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001')
  
  socket = io(backendUrl)

  socket.on('connect', () => {
    connectionStatus.value = { connected: true, text: 'Connected' }
    loading.value = false
    error.value = null
  })

  socket.on('disconnect', () => {
    connectionStatus.value = { connected: false, text: 'Disconnected' }
  })

  socket.on('alerts', (data: GrafanaAlert[]) => {
    console.log('Received alerts:', data.length, 'highlightDuration:', highlightDuration.value)
    
    data.forEach(alert => {
      const previousState = previousAlertStates.value.get(alert.id)
      
      // Mark as new if state changed to alerting/pending (not on first load)
      if (previousState && 
          previousState !== alert.state && 
          (alert.state === 'alerting' || alert.state === 'pending')) {
        console.log('New alert detected:', alert.name, 'old state:', previousState, 'new state:', alert.state)
        newAlertIds.value.add(alert.id)
        // Remove from new alerts after configured duration (in milliseconds)
        if (highlightDuration.value > 0) {
          setTimeout(() => {
            console.log('Removing alert from new:', alert.id)
            newAlertIds.value.delete(alert.id)
          }, highlightDuration.value * 1000)
        }
      }
      
      previousAlertStates.value.set(alert.id, alert.state)
    })
    
    console.log('New alert IDs:', Array.from(newAlertIds.value))
    
    alerts.value = data
    loading.value = false
    error.value = null
    updateLastUpdate()
  })

  socket.on('error', (data: { message: string }) => {
    error.value = data.message
    loading.value = false
  })

  socket.emit('getAlerts')
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background 0.3s, color 0.3s;
}

/* Dark theme (default) */
.dashboard.theme-dark {
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #fff;
}

.dashboard.theme-dark .dashboard-header {
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

/* Light theme */
.dashboard.theme-light {
  background: linear-gradient(135deg, #f0f2f5 0%, #e1e5eb 100%);
  color: #1a1a1a;
}

.dashboard.theme-light .dashboard-header {
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
}

.dashboard.theme-light .stat-label {
  color: #555;
}

.dashboard.theme-light .stat-value {
  color: #1a1a1a;
}

.dashboard.theme-light .connection-status {
  color: #555;
}

.dashboard.theme-light .last-update {
  color: #777;
}

.dashboard.theme-light .drawer-toggle-btn {
  background: rgba(0, 0, 0, 0.08);
  color: #555;
}

.dashboard.theme-light .drawer-toggle-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.12);
  color: #1a1a1a;
}

.dashboard.theme-light .loading,
.dashboard.theme-light .error-message,
.dashboard.theme-light .no-alerts {
  color: #1a1a1a;
}

.dashboard.theme-light .compact-header {
  background: rgba(0, 0, 0, 0.08);
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
  color: #555;
  font-weight: 600;
}

.dashboard-header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.stats-section {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.drawer-toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.drawer-toggle-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.drawer-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.connection-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  font-size: 1rem;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connection-status .pi-check-circle {
  color: #4caf50;
}

.connection-status .pi-times-circle {
  color: #f44336;
}

.last-update {
  font-size: 0.75rem;
  color: #888;
}

.alerts-container {
  flex: 1;
  overflow-y: auto;
}

.loading,
.error-message,
.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.error-message {
  color: #f44336;
}

.error-message i {
  font-size: 3rem;
}

.no-alerts {
  color: #4caf50;
}

.no-alerts i {
  font-size: 3rem;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin: 1.0rem;
}

.alerts-compact {
  max-width: 100%;
}

.compact-header {
  display: grid;
  grid-template-columns: 50px 1fr 200px 80px 300px 100px 60px;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #aaa;
  gap: 1rem;
  margin-bottom: 1px;
}

.compact-header > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  text-align: center;
}

.header-duration {
  text-align: right;
}

@media (max-width: 1024px) {
  .compact-header {
    grid-template-columns: 40px 1fr 80px 80px 50px;
  }
  
  .header-group,
  .header-labels {
    display: none;
  }
}

@media (max-width: 768px) {
  .compact-header {
    grid-template-columns: 40px 1fr 50px;
  }
  
  .header-totals,
  .header-duration {
    display: none;
  }
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-value i {
  font-size: 1.2rem;
}

.stat.alerting .stat-value {
  color: #f44336;
}

.stat.alerting .stat-value i {
  color: #f44336;
}

.stat.pending .stat-value {
  color: #ff9800;
}

.stat.pending .stat-value i {
  color: #ff9800;
}

.stat.no-data .stat-value {
  color: #2196f3;
}

.stat.no-data .stat-value i {
  color: #2196f3;
}

.stat.paused .stat-value {
  color: #9e9e9e;
}

.stat.paused .stat-value i {
  color: #9e9e9e;
}

.stat.silenced .stat-value {
  color: #757575;
}

.stat.silenced .stat-value i {
  color: #757575;
}

.stat.ok .stat-value {
  color: #4caf50;
}

.stat.ok .stat-value i {
  color: #4caf50;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }

  .stats-section {
    width: 100%;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-controls {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .connection-status {
    width: 100%;
    align-items: center;
  }

  .alerts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Global light theme overrides for child components */
.theme-light .alert-row {
  background: rgba(0, 0, 0, 0.02);
  color: #1a1a1a;
}

.theme-light .alert-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.theme-light .alert-name,
.theme-light .alert-group,
.theme-light .alert-duration {
  color: #1a1a1a;
}

.theme-light .alert-group {
  color: #555;
}

.theme-light .alert-duration {
  color: #666;
}

.theme-light .label-tag {
  background: rgba(25, 118, 210, 0.2);
  color: #0d47a1;
  border-color: rgba(25, 118, 210, 0.5);
  font-weight: 600;
}

.theme-light .instance-badge {
  background: rgba(123, 31, 162, 0.2);
  color: #6a1b9a;
  border-color: rgba(123, 31, 162, 0.5);
  font-weight: 600;
}

.theme-light .view-link {
  color: #1565c0;
}

.theme-light .view-link:hover {
  color: #0d47a1;
  background: rgba(25, 118, 210, 0.15);
}

.theme-light .alert-card {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.15);
  color: #1a1a1a;
}

.theme-light .alert-card:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.theme-light .alert-title h3 {
  color: #1a1a1a;
}

.theme-light .detail-label {
  color: #555;
}

.theme-light .detail-value {
  color: #1a1a1a;
}

.theme-light .detail-row {
  border-bottom-color: rgba(0, 0, 0, 0.12);
}

.theme-light .alert-footer {
  border-top-color: rgba(0, 0, 0, 0.12);
}
</style>

