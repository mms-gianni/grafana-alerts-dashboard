<template>
  <div class="dashboard">
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
      v-model:showSilenced="showSilenced"
      v-model:fontSize="fontSize"
      v-model:viewMode="viewMode"
      :availableInstances="availableInstances"
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
          <div class="header-labels">Labels</div>
          <div class="header-duration">Duration</div>
          <div class="header-actions"></div>
        </div>
        <AlertRow
          v-for="alert in sortedAlerts"
          :key="`${alert.instanceName || 'default'}-${alert.id}`"
          :alert="alert"
          :fontSize="fontSize"
        />
      </div>

      <div v-else class="alerts-grid">
        <AlertCard
          v-for="alert in sortedAlerts"
          :key="`${alert.instanceName || 'default'}-${alert.id}`"
          :alert="alert"
          :fontSize="fontSize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AlertCard from './components/AlertCard.vue'
import AlertRow from './components/AlertRow.vue'
import SettingsSidebar from './components/SettingsSidebar.vue'
import { io, Socket } from 'socket.io-client'

interface GrafanaAlert {
  id: number
  name: string
  state: 'ok' | 'paused' | 'alerting' | 'pending' | 'no_data'
  newStateDate: string
  evalDate: string
  url: string
  ruleGroup: string
  labels?: Record<string, string>
  isSilenced?: boolean
  instanceName?: string
}

const alerts = ref<GrafanaAlert[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdate = ref('Never')
const connectionStatus = ref({ connected: false, text: 'Connecting...' })
const viewMode = ref<'compact' | 'grid'>('compact')
const selectedStates = ref<string[]>(['alerting', 'pending', 'no_data', 'paused', 'ok'])
const selectedInstances = ref<string[]>([])
const showFilter = ref(false)
const fontSize = ref(2)
const showSilenced = ref(true)
const showSidebar = ref(false)
const refreshing = ref(false)

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

const sortedAlerts = computed(() => {
  const stateOrder = { alerting: 0, pending: 1, no_data: 2, paused: 3, ok: 4 }
  
  let filtered = [...alerts.value]
    .filter(alert => selectedStates.value.includes(alert.state))
    .filter(alert => showSilenced.value || !alert.isSilenced)
    .filter(alert => {
      // If no instances selected, show all
      if (selectedInstances.value.length === 0) return true
      // Filter by selected instances
      return selectedInstances.value.includes(alert.instanceName || 'default')
    })
    .sort((a, b) => stateOrder[a.state] - stateOrder[b.state])

  return filtered
})

const alertingCount = computed(() => alerts.value.filter(a => a.state === 'alerting').length)
const pendingCount = computed(() => alerts.value.filter(a => a.state === 'pending').length)
const noDataCount = computed(() => alerts.value.filter(a => a.state === 'no_data').length)
const okCount = computed(() => alerts.value.filter(a => a.state === 'ok').length)

const updateLastUpdate = () => {
  const now = new Date()
  lastUpdate.value = now.toLocaleTimeString()
}

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
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
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
}

.alerts-compact {
  max-width: 100%;
}

.compact-header {
  display: grid;
  grid-template-columns: 50px 1fr 200px 300px 100px 60px;
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
    grid-template-columns: 40px 1fr 80px 50px;
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
