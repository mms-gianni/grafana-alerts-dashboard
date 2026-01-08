<template>
  <div>
    <div 
      :class="['alert-row', `alert-${alert.state}`, { 'alert-silenced': alert.isSilenced, 'has-subalerts': alert.alerts && alert.alerts.length > 0, 'new-alert': isNew }]"
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
      <SubAlertAccordion 
        :sub-alerts="filteredSubAlerts"
        value-prefix="Value: "
        content-class="sub-alert-details"
        section-class="detail-section"
        annotation-class="annotation-row"
        annotation-value-class="annotation-value"
        detail-label-class="detail-label"
        detail-value-class="detail-value"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import SubAlertAccordion from './SubAlertAccordion.vue'
import { useAlert, type GrafanaAlert } from '../composables/useAlert'

interface Props {
  alert: GrafanaAlert
  fontSize?: number
  showNormalSubalerts?: boolean
  isNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fontSize: 2,
  showNormalSubalerts: false,
  isNew: false
})

const expanded = ref(false)

const { getStateIcon, getDuration, useFilteredSubAlerts } = useAlert()

const filteredSubAlerts = useFilteredSubAlerts(
  computed(() => props.alert),
  toRef(props, 'showNormalSubalerts')
)

const toggleAccordion = () => {
  if (props.alert.alerts && props.alert.alerts.length > 0) {
    expanded.value = !expanded.value
  }
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

.new-alert {
  animation: flashAlert 2s ease-in-out 3;
  position: relative;
}

@keyframes flashAlert {
  0%, 100% {
    box-shadow: 0 0 0 rgba(255, 193, 7, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 193, 7, 0.8), inset 0 0 20px rgba(255, 193, 7, 0.3);
  }
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
