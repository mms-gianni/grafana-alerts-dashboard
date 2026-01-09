<template>
  <div v-if="silenceIds.length > 0" class="silence-section">
    <h4 class="silence-title">
      <i class="pi pi-volume-off"></i>
      Silences ({{ silenceIds.length }})
    </h4>
    
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      Loading silences...
    </div>
    
    <div v-else class="silences-list">
      <div v-for="silenceId in silenceIds" :key="silenceId" class="silence-item">
        <div class="silence-header">
          <i class="pi pi-bell-slash"></i>
          <span class="silence-id">{{ silenceId }}</span>
        </div>
        
        <div v-if="silences[silenceId]" class="silence-details">
          <div class="detail-row">
            <strong>Status:</strong>
            <span :class="['status-badge', silences[silenceId].status.state]">
              {{ silences[silenceId].status.state }}
            </span>
          </div>
          
          <div class="detail-row">
            <strong>Comment:</strong>
            <span>{{ silences[silenceId].comment || 'No comment' }}</span>
          </div>
          
          <div class="detail-row">
            <strong>Created by:</strong>
            <span>{{ silences[silenceId].createdBy }}</span>
          </div>
          
          <div class="detail-row">
            <strong>Starts at:</strong>
            <span>{{ formatDate(silences[silenceId].startsAt) }}</span>
          </div>
          
          <div class="detail-row">
            <strong>Ends at:</strong>
            <span>{{ formatDate(silences[silenceId].endsAt) }}</span>
          </div>
          
          <div v-if="silences[silenceId].matchers?.length > 0" class="detail-row matchers-row">
            <strong>Matchers:</strong>
            <div class="matchers-list">
              <div v-for="(matcher, index) in silences[silenceId].matchers" :key="index" class="matcher-item">
                <span class="matcher-name">{{ matcher.name }}</span>
                <span class="matcher-operator">{{ matcher.isRegex ? '=~' : '=' }}</span>
                <span class="matcher-value">{{ matcher.value }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="error-state">
          Failed to load silence details
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useAlert } from '../composables/useAlert'

interface Props {
  silenceIds: string[]
  instanceName: string
}

interface Silence {
  id: string
  matchers: Array<{
    name: string
    value: string
    isRegex: boolean
  }>
  startsAt: string
  endsAt: string
  createdBy: string
  comment: string
  status: {
    state: string
  }
}

const props = defineProps<Props>()

const { formatDate } = useAlert()

const silences = reactive<Record<string, Silence>>({})
const loading = ref(true)

const loadAllSilences = async () => {
  loading.value = true
  
  try {
    // Load all silences in parallel
    await Promise.all(
      props.silenceIds.map(async (silenceId) => {
        try {
          const response = await fetch(
            `/api/silences/${silenceId}?instanceName=${encodeURIComponent(props.instanceName)}&silenceId=${encodeURIComponent(silenceId)}`
          )
          
          if (response.ok) {
            const data = await response.json()
            silences[silenceId] = data
          } else {
            console.error(`Failed to load silence ${silenceId}:`, response.statusText)
          }
        } catch (error) {
          console.error(`Error loading silence ${silenceId}:`, error)
        }
      })
    )
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllSilences()
})
</script>

<style scoped>
.silence-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.silence-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.silence-title i {
  color: #ff9800;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--text-color-secondary);
}

.loading-state i {
  font-size: 1.2rem;
}

.silences-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.silence-item {
  background: var(--surface-50);
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid #ff9800;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.silence-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.silence-header i {
  color: #ff9800;
  font-size: 1.1rem;
}

.silence-id {
  font-family: monospace;
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.error-state {
  color: #f44336;
  padding: 0.5rem;
}

.silence-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.detail-row strong {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-row > span {
  color: var(--text-color);
  flex: 1;
}

.matchers-row {
  flex-direction: column;
  gap: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.5);
}

.status-badge.expired {
  background: rgba(158, 158, 158, 0.15);
  color: #616161;
  border: 1px solid rgba(158, 158, 158, 0.5);
}

.status-badge.pending {
  background: rgba(255, 152, 0, 0.15);
  color: #e65100;
  border: 1px solid rgba(255, 152, 0, 0.5);
}

.matchers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.matcher-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-100);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  border: 1px solid var(--surface-border);
}

.matcher-name {
  color: #1976d2;
  font-weight: 600;
}

.matcher-operator {
  color: var(--text-color-secondary);
}

.matcher-value {
  color: #2e7d32;
}
</style>
