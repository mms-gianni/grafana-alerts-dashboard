<template>
  <div>
    <div 
      :class="['alert-row', `alert-${alert.state}`, { 'alert-silenced': alert.isSilenced, 'has-subalerts': alert.alerts && alert.alerts.length > 0 }]"
      @click="toggleAccordion"
    >
      <div class="alert-icon" :style="{ fontSize: `${fontSize}rem` }">
        <i :class="getStateIcon(alert.state)"></i>
      </div>
      <div class="alert-name" :style="{ fontSize: `${fontSize}rem` }">
        {{ alert.name }}
        <span v-if="alert.instanceName && alert.instanceName !== 'default'" class="instance-badge">
          {{ alert.instanceName }}
        </span>
      </div>
      <div class="alert-group">
        {{ alert.ruleGroup }}
      </div>
      <div class="alert-totals">
        <span v-if="alert.totals?.alerting && alert.totals.alerting >= 1" class="total-chip alerting-chip">
          {{ alert.totals.alerting }}
        </span>
        <span v-if="alert.totals?.normal && alert.totals.normal >= 1" class="total-chip normal-chip">
          {{ alert.totals.normal }}
        </span>
      </div>
      <div class="alert-labels">
        <span v-for="(value, key) in alert.labels" :key="key" class="label-tag">
          {{ key }}: {{ value }}
        </span>
      </div>
      <div class="alert-duration">
        {{ getDuration(alert.newStateDate) }}
      </div>
      <div class="alert-actions">
        <a :href="alert.url" target="_blank" class="view-link" title="View in Grafana" @click.stop>
          <i class="pi pi-external-link"></i>
        </a>
      </div>
    </div>
    
    <div v-if="expanded && filteredSubAlerts.length > 0" class="sub-alerts-container">
      <Accordion :multiple="true">
        <AccordionTab 
          v-for="(subAlert, index) in filteredSubAlerts" 
          :key="index"
        >
          <template #header>
            <div class="sub-alert-header">
              <i :class="['pi', subAlert.state === 'Alerting' ? 'pi-exclamation-triangle' : 'pi-check-circle', subAlert.state === 'Alerting' ? 'text-alerting' : 'text-ok']"></i>
              <span class="sub-alert-state">{{ subAlert.state }}</span>
              <span class="sub-alert-value">Value: {{ subAlert.value }}</span>
            </div>
          </template>
          <div class="sub-alert-details">
            <div v-if="Object.keys(subAlert.labels).length > 0" class="detail-section">
              <h4>Labels:</h4>
              <div class="sub-labels">
                <span v-for="(value, key) in subAlert.labels" :key="key" class="label-tag">
                  {{ key }}: {{ value }}
                </span>
              </div>
            </div>
            
            <div v-if="Object.keys(subAlert.annotations).length > 0" class="detail-section">
              <h4>Annotations:</h4>
              <div class="sub-annotations">
                <div v-for="(value, key) in subAlert.annotations" :key="key" class="annotation-row">
                  <span class="annotation-key">{{ key }}:</span>
                  <span class="annotation-value">{{ value }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <span class="detail-label">Active since:</span>
              <span class="detail-value">{{ formatDate(subAlert.activeAt) }}</span>
            </div>
          </div>
        </AccordionTab>
      </Accordion>
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
    ruleGroup: string
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

const toggleAccordion = () => {
  if (props.alert.alerts && props.alert.alerts.length > 0) {
    expanded.value = !expanded.value
  }
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
.alert-row {
  display: grid;
  grid-template-columns: 50px 1fr 200px 80px 300px 100px 60px;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid;
  margin-bottom: 1px;
  transition: background 0.2s, transform 0.1s;
  gap: 1rem;
}

.alert-row:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(2px);
}

.alert-row.has-subalerts {
  cursor: pointer;
}

.alert-alerting {
  border-left-color: #f44336;
}

.alert-pending {
  border-left-color: #ff9800;
}

.alert-ok {
  border-left-color: #4caf50;
}

.alert-paused {
  border-left-color: #9e9e9e;
}

.alert-no_data {
  border-left-color: #2196f3;
}

.alert-silenced {
  opacity: 0.5;
}

.alert-silenced .alert-name,
.alert-silenced .alert-group,
.alert-silenced .alert-labels,
.alert-silenced .alert-duration {
  color: #9e9e9e !important;
}

.alert-silenced .alert-icon i {
  color: #757575 !important;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
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

.alert-totals {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.alert-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.instance-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  background: rgba(156, 39, 176, 0.2);
  color: #ce93d8;
  border: 1px solid rgba(156, 39, 176, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

.alert-group {
  font-size: 0.9rem;
  color: #aaa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  overflow: hidden;
}

.label-tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  background: rgba(100, 181, 246, 0.2);
  color: #64b5f6;
  border: 1px solid rgba(100, 181, 246, 0.3);
  white-space: nowrap;
}

.total-chip {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
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

.alert-duration {
  font-size: 0.9rem;
  color: #ccc;
  text-align: right;
}

.alert-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.view-link {
  color: #64b5f6;
  text-decoration: none;
  font-size: 1.2rem;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.view-link:hover {
  color: #90caf9;
  background: rgba(100, 181, 246, 0.1);
}

.sub-alerts-container {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  margin-bottom: 1px;
}

.sub-alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  width: 100%;
}

.sub-alert-header i {
  font-size: 1rem;
}

.text-alerting {
  color: #f44336;
}

.text-ok {
  color: #4caf50;
}

.sub-alert-state {
  font-weight: 600;
  min-width: 80px;
}

.sub-alert-value {
  color: #aaa;
  font-size: 0.85rem;
}

.sub-alert-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-section h4 {
  margin: 0;
  font-size: 0.85rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sub-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sub-annotations {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.annotation-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.annotation-key {
  color: #aaa;
  font-weight: 600;
  min-width: 120px;
}

.annotation-value {
  color: #ccc;
  word-break: break-word;
}

.detail-label {
  color: #aaa;
  font-size: 0.85rem;
  font-weight: 600;
}

.detail-value {
  color: #ccc;
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .alert-row {
    grid-template-columns: 40px 1fr 80px 80px 50px;
  }
  
  .alert-group,
  .alert-labels {
    display: none;
  }
}

@media (max-width: 768px) {
  .alert-row {
    grid-template-columns: 40px 1fr 50px;
    padding: 0.5rem 1rem;
  }
  
  .alert-totals,
  .alert-duration {
    display: none;
  }
}
</style>
