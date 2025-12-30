<template>
  <div :class="['alert-card', `alert-${alert.state}`]">
    <div class="alert-header">
      <div class="alert-icon" :style="{ fontSize: `${fontSize}rem`, width: `${fontSize * 24}px`, height: `${fontSize * 24}px` }">
        <i :class="getStateIcon(alert.state)"></i>
      </div>
      <div class="alert-title">
        <h3 :style="{ fontSize: `${fontSize * 0.6}rem` }">{{ alert.name }}</h3>
        <div class="alert-labels">
          <span v-for="(value, key) in alert.labels" :key="key" class="label-tag">
            {{ key }}: {{ value }}
          </span>
        </div>
      </div>
    </div>

    <div class="alert-details">
      <div class="detail-row">
        <span class="detail-label">Alert ID:</span>
        <span class="detail-value">{{ alert.id }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Since:</span>
        <span class="detail-value">{{ formatDate(alert.newStateDate) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration:</span>
        <span class="detail-value">{{ getDuration(alert.newStateDate) }}</span>
      </div>
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
interface Props {
  alert: {
    id: number
    name: string
    state: 'ok' | 'paused' | 'alerting' | 'pending' | 'no_data'
    newStateDate: string
    url: string
    labels?: Record<string, string>
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

.alert-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
</style>
