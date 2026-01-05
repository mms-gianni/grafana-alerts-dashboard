<template>
  <div :class="['alert-row', `alert-${alert.state}`]">
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
    <div class="alert-labels">
      <span v-for="(value, key) in alert.labels" :key="key" class="label-tag">
        {{ key }}: {{ value }}
      </span>
    </div>
    <div class="alert-duration">
      {{ getDuration(alert.newStateDate) }}
    </div>
    <div class="alert-actions">
      <a :href="alert.url" target="_blank" class="view-link" title="View in Grafana">
        <i class="pi pi-external-link"></i>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  }
  fontSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  fontSize: 2
})

const getStateIcon = (state: string): string => {
  const icons: Record<string, string> = {
    alerting: 'pi pi-exclamation-triangle',
    pending: 'pi pi-clock',
    ok: 'pi pi-check-circle',
    paused: 'pi pi-pause-circle',
    no_data: 'pi pi-question-circle',
  }
  return icons[state] || 'pi pi-info-circle'
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
  grid-template-columns: 50px 1fr 200px 300px 100px 60px;
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

.alert-duration {
  font-size: 0.9rem;
  color: #ccc;
  text-align: right;
}

.alert-actions {
  display: flex;
  justify-content: center;
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

@media (max-width: 1024px) {
  .alert-row {
    grid-template-columns: 40px 1fr 80px 50px;
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
  
  .alert-duration {
    display: none;
  }
}
</style>
