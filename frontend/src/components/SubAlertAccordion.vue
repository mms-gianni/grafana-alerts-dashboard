<template>
  <Accordion :multiple="true">
    <AccordionTab 
      v-for="(subAlert, index) in subAlerts" 
      :key="index"
    >
      <template #header>
        <div class="sub-alert-header">
          <i 
            :class="[
              'pi', 
              subAlert.state === 'Alerting' ? 'pi-exclamation-triangle' : 'pi-check-circle', 
              subAlert.state === 'Alerting' ? 'text-alerting' : 'text-ok'
            ]"
          ></i>
          <span class="sub-alert-state">{{ subAlert.state }}</span>
          <span class="sub-alert-value">{{ valuePrefix }}{{ subAlert.value }}</span>
        </div>
      </template>
      <div :class="contentClass">
        <div v-if="Object.keys(subAlert.labels).length > 0" :class="sectionClass">
          <strong>Labels:</strong>
          <div class="sub-labels">
            <span v-for="(value, key) in subAlert.labels" :key="key" class="label-tag">
              {{ key }}: {{ value }}
            </span>
          </div>
        </div>
        
        <div v-if="Object.keys(subAlert.annotations).length > 0" :class="sectionClass">
          <strong>Annotations:</strong>
          <div class="sub-annotations">
            <div v-for="(value, key) in subAlert.annotations" :key="key" :class="annotationClass">
              <span class="annotation-key">{{ key }}:</span>
              <span :class="annotationValueClass">{{ value }}</span>
            </div>
          </div>
        </div>
        
        <div :class="sectionClass">
          <span v-if="detailLabelClass" :class="detailLabelClass">Active since:</span>
          <strong v-else>Active since:</strong>
          <span :class="detailValueClass">{{ formatDate(subAlert.activeAt) }}</span>
        </div>
      </div>
    </AccordionTab>
  </Accordion>
</template>

<script setup lang="ts">
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import { useAlert, type SubAlert } from '../composables/useAlert'

interface Props {
  subAlerts: SubAlert[]
  valuePrefix?: string
  contentClass?: string
  sectionClass?: string
  annotationClass?: string
  annotationValueClass?: string
  detailLabelClass?: string
  detailValueClass?: string
}

withDefaults(defineProps<Props>(), {
  valuePrefix: '',
  contentClass: 'sub-alert-content',
  sectionClass: 'sub-section',
  annotationClass: 'annotation-item',
  annotationValueClass: '',
  detailLabelClass: '',
  detailValueClass: ''
})

const { formatDate } = useAlert()
</script>

<style scoped>
.sub-alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.sub-alert-state {
  font-weight: 600;
  min-width: 80px;
}

.sub-alert-value {
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
}

.text-alerting {
  color: #f44336;
}

.text-ok {
  color: #4caf50;
}

.sub-alert-content {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.sub-alert-details {
  padding: 1rem;
  border-radius: 8px;
}

.sub-section,
.detail-section {
  margin-bottom: 1rem;
}

.sub-section:last-child,
.detail-section:last-child {
  margin-bottom: 0;
}

.sub-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.label-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

.sub-annotations {
  margin-top: 0.5rem;
}

.annotation-item,
.annotation-row {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.annotation-item:last-child,
.annotation-row:last-child {
  margin-bottom: 0;
}

.annotation-key {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-right: 0.5rem;
}

.annotation-value {
  color: rgba(255, 255, 255, 0.9);
}

.detail-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-right: 0.5rem;
}

.detail-value {
  color: rgba(255, 255, 255, 0.9);
}
</style>
