<template>
  <div :class="['alert-card', `alert-${alert.state}`, { 'alert-silenced': alert.isSilenced }]">
    <div class="alert-header">
      <div class="alert-icon" :style="{ fontSize: `${fontSize}rem`, width: `${fontSize * 24}px`, height: `${fontSize * 24}px` }">
        <i :class="getStateIcon(alert.state)"></i>
      </div>
      <div class="alert-title">
        <h3 :style="{ fontSize: `${fontSize * 0.6}rem` }">
          {{ alert.name }}
        </h3>
        <span v-if="alert.instanceName && alert.instanceName !== 'default'" class="instance-badge">
          {{ alert.instanceName }}
        </span>
        <div class="alert-labels">
          <span v-for="(value, key) in alert.labels" :key="key" class="label-tag">
            {{ key }}: {{ value }}
          </span>
        </div>
      </div>
    </div>

    <div class="alert-details">
      <div class="detail-row">
        <span class="detail-label">Since:</span>
        <span class="detail-value">{{ formatDate(alert.newStateDate) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration:</span>
        <span class="detail-value">{{ getDuration(alert.newStateDate) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Alerts</span>
        <div class="detail-value totals-chips">
          <span v-if="alert.totals?.alerting && alert.totals.alerting >= 1" class="total-chip alerting-chip">
            {{ alert.totals.alerting }}
          </span>
          <span v-if="alert.totals?.normal && alert.totals.normal >= 1" class="total-chip normal-chip">
            {{ alert.totals.normal }}
          </span>
          <button 
            v-if="alert.alerts && alert.alerts.length > 0"
            @click="toggleExpanded"
            class="expand-btn-card"
            :title="expanded ? 'Collapse sub-alerts' : 'Expand sub-alerts'"
          >
            <i :class="['pi', expanded ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="expanded && alert.alerts && alert.alerts.length > 0" class="sub-alerts-section">
      <h4 class="sub-alerts-title">Sub-Alerts</h4>
      <Accordion :multiple="true">
        <AccordionTab 
          v-for="(subAlert, index) in alert.alerts" 
          :key="index"
        >
          <template #header>
            <div class="sub-alert-header">
              <i :class="['pi', subAlert.state === 'Alerting' ? 'pi-exclamation-triangle' : 'pi-check-circle', subAlert.state === 'Alerting' ? 'text-alerting' : 'text-ok']"></i>
              <span class="sub-alert-state">{{ subAlert.state }}</span>
              <span class="sub-alert-value">{{ subAlert.value }}</span>
            </div>
          </template>
          <div class="sub-alert-content">
            <div v-if="Object.keys(subAlert.labels).length > 0" class="sub-section">
              <strong>Labels:</strong>
              <div class="sub-labels">
                <span v-for="(value, key) in subAlert.labels" :key="key" class="label-tag">
                  {{ key }}: {{ value }}
                </span>
              </div>
            </div>
            
            <div v-if="Object.keys(subAlert.annotations).length > 0" class="sub-section">
              <strong>Annotations:</strong>
              <div class="sub-annotations">
                <div v-for="(value, key) in subAlert.annotations" :key="key" class="annotation-item">
                  <span class="annotation-key">{{ key }}:</span>
                  <span>{{ value }}</span>
                </div>
              </div>
            </div>
            
            <div class="sub-section">
              <strong>Active since:</strong> {{ formatDate(subAlert.activeAt) }}
            </div>
          </div>
        </AccordionTab>
      </Accordion>
    </div>

    <div class="alert-footer">
      <a :href="alert.url" target="_blank" class="view-link">
        <i class="pi pi-external-link"></i>
        View in Grafana
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'

interface Props {
  alert: {
    id: number
    name: string
    state: 'ok' | 'paused' | 'alerting' | 'pending' | 'no_data'
    newStateDate: string
    url: string
    labels?: Record<string, string>
    instanceName?: string
    isSilenced?: boolean
    totals?: {
      alerting: number
      normal: number
    }
    alerts?: Array<{
      labels: Record<string, string>
      annotations: Record<string, string>
      state: 'Alerting' | 'Normal'
      activeAt: string
      value: string
    }>
  }
  fontSize?: number
  showNormalSubalerts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fontSize: 2,
  showNormalSubalerts: false
})

const expanded = ref(false)

const filteredSubAlerts = computed(() => {
  if (!props.alert.alerts) return []
  if (props.showNormalSubalerts) return props.alert.alerts
  return props.alert.alerts.filter(subAlert => subAlert.state === 'Alerting')
})

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const getStateIcon = (state: string): string => {
  const icons: Record<string, string> = {
    alerting: 'pi pi-exclamation-triangle',
    pending: 'pi pi-clock',
    ok: 'pi pi-check-circle',
    paused: 'pi pi-times-circle',
    no_data: 'pi pi-question-circle',
  }
  return icons[state] || 'pi pi-info-circle'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getDuration = (dateString: string): string => {
  const start = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - start.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}
</script>

<style scoped>
.alert-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid;
  transition: transform 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(10px);
}

.alert-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.alert-alerting {
  border-left-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.alert-pending {
  border-left-color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.alert-ok {
  border-left-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.alert-paused {
  border-left-color: #9e9e9e;
  background: rgba(158, 158, 158, 0.1);
}

.alert-no_data {
  border-left-color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
}

.alert-silenced {
  opacity: 0.6;
}

.alert-silenced .alert-title h3,
.alert-silenced .alert-details,
.alert-silenced .alert-labels {
  color: #9e9e9e !important;
}

.alert-silenced .alert-icon i {
  color: #757575 !important;
}

.alert-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.alert-icon i {
  font-size: inherit;
}

.alert-alerting .alert-icon {
  color: #f44336;
}

.alert-pending .alert-icon {
  color: #ff9800;
}

.alert-ok .alert-icon {
  color: #4caf50;
}

.alert-paused .alert-icon {
  color: #9e9e9e;
}

.alert-no_data .alert-icon {
  color: #2196f3;
}

.alert-title {
  flex: 1;
}

.alert-title h3 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.instance-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(156, 39, 176, 0.2);
  color: #ce93d8;
  border: 1px solid rgba(156, 39, 176, 0.3);
  margin-bottom: 0.5rem;
}

.alert-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.label-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(100, 181, 246, 0.2);
  color: #64b5f6;
  border: 1px solid rgba(100, 181, 246, 0.3);
}

.alert-details {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-label {
  color: #aaa;
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 500;
}

.totals-chips {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.expand-btn-card {
  background: rgba(100, 181, 246, 0.2);
  border: none;
  color: #64b5f6;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  margin-left: 0.25rem;
}

.expand-btn-card:hover {
  background: rgba(100, 181, 246, 0.3);
  color: #90caf9;
}

.total-chip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
}

.alerting-chip {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.4);
}

.normal-chip {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.4);
}

.alert-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  /*border-top: 1px solid rgba(255, 255, 255, 0.1);*/
}

.view-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64b5f6;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.view-link:hover {
  color: #90caf9;
}

.sub-alerts-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sub-alerts-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sub-alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  width: 100%;
}

.sub-alert-header i {
  font-size: 0.9rem;
}

.text-alerting {
  color: #f44336;
}

.text-ok {
  color: #4caf50;
}

.sub-alert-state {
  font-weight: 600;
  min-width: 70px;
}

.sub-alert-value {
  color: #aaa;
  font-size: 0.8rem;
}

.sub-alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.sub-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sub-section strong {
  color: #aaa;
  font-size: 0.8rem;
}

.sub-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sub-annotations {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.annotation-item {
  display: flex;
  gap: 0.5rem;
}

.annotation-key {
  font-weight: 600;
  color: #aaa;
  min-width: 100px;
}
</style>
