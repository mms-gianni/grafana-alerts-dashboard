<template>
  <Sidebar v-model:visible="isVisible" position="right" header="Settings">
    <div class="drawer-content">
      <div class="drawer-section">
        <h3 class="drawer-section-title">Filter by State</h3>
        <MultiSelect
          id="state-filter"
          :modelValue="selectedStates"
          @update:modelValue="$emit('update:selectedStates', $event)"
          :options="stateOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select states"
          :maxSelectedLabels="3"
          class="state-filter"
        >
          <template #option="slotProps">
            <div class="filter-option">
              <i :class="slotProps.option.icon" :style="{ color: slotProps.option.color }"></i>
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
        </MultiSelect>
      </div>

      <div class="drawer-section" v-if="availableInstances.length > 0">
        <h3 class="drawer-section-title">Filter by Instance</h3>
        <MultiSelect
          id="instance-filter"
          :modelValue="selectedInstances"
          @update:modelValue="$emit('update:selectedInstances', $event)"
          :options="availableInstances"
          placeholder="All instances"
          :maxSelectedLabels="3"
          class="instance-filter"
        >
          <template #option="slotProps">
            <div class="filter-option">
              <i class="pi pi-server" style="color: #ce93d8"></i>
              <span>{{ slotProps.option }}</span>
            </div>
          </template>
        </MultiSelect>
      </div>

      <div class="drawer-section" v-if="availableLabels.length > 0">
        <h3 class="drawer-section-title">Filter by Labels</h3>
        <MultiSelect
          id="label-filter"
          :modelValue="selectedLabels"
          @update:modelValue="$emit('update:selectedLabels', $event)"
          :options="availableLabels"
          placeholder="All labels"
          display="chip"
          :maxSelectedLabels="3"
          class="label-filter"
        >
          <template #option="slotProps">
            <div class="filter-option">
              <i class="pi pi-tag" style="color: #64b5f6"></i>
              <span>{{ slotProps.option }}</span>
            </div>
          </template>
        </MultiSelect>
      </div>

      <div class="drawer-section">
        <h3 class="drawer-section-title">Text Size</h3>
        <div class="size-control">
          <i class="pi pi-search-minus"></i>
          <input 
            type="range" 
            :value="fontSize"
            @input="$emit('update:fontSize', parseFloat(($event.target as HTMLInputElement).value))"
            min="1" 
            max="3" 
            step="0.1" 
            class="size-slider"
            title="Adjust text size"
          />
          <i class="pi pi-search-plus"></i>
        </div>
      </div>

      <div class="drawer-section">
        <h3 class="drawer-section-title">Sub-Alerts</h3>
        <div class="switch-control">
          <label for="show-normal-subalerts" class="switch-label">
            <span>Show Normal State</span>
            <InputSwitch 
              id="show-normal-subalerts"
              :modelValue="showNormalSubalerts"
              @update:modelValue="$emit('update:showNormalSubalerts', $event)"
            />
          </label>
        </div>
      </div>

      <div class="drawer-section">
        <h3 class="drawer-section-title">Notifications</h3>
        <div class="duration-control">
          <div class="duration-label">
            <span>Highlight Duration</span>
            <span class="duration-value">{{ highlightDuration === 0 ? 'Off' : `${highlightDuration}s` }}</span>
          </div>
          <input 
            type="range" 
            :value="highlightDuration"
            @input="$emit('update:highlightDuration', parseInt(($event.target as HTMLInputElement).value))"
            min="0" 
            max="300" 
            step="5" 
            class="duration-slider"
            title="Highlight duration in seconds (0 = off)"
          />
        </div>        <div class="sound-control">
          <label for="notification-sound" class="control-label">Notification Sound</label>
          <Select
            id="notification-sound"
            :modelValue="notificationSound"
            @update:modelValue="handleSoundChange"
            :options="soundOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a sound"
            class="sound-select"
          />
        </div>
        <div class="volume-control">
          <div class="duration-label">
            <span>Volume</span>
            <span class="duration-value">{{ Math.round(notificationVolume * 100) }}%</span>
          </div>
          <input 
            type="range" 
            :value="notificationVolume"
            @input="$emit('update:notificationVolume', parseFloat(($event.target as HTMLInputElement).value))"
            min="0" 
            max="1" 
            step="0.1" 
            class="volume-slider"
            title="Notification volume"
          />
        </div>      </div>

      <div class="drawer-section">
        <h3 class="drawer-section-title">Theme</h3>
        <div class="theme-toggle">
          <button 
            :class="['toggle-btn', { active: theme === 'light' }]" 
            @click="$emit('update:theme', 'light')"
            title="Light Theme"
          >
            <i class="pi pi-sun"></i>
            <span>Light</span>
          </button>
          <button 
            :class="['toggle-btn', { active: theme === 'system' }]" 
            @click="$emit('update:theme', 'system')"
            title="System Theme"
          >
            <i class="pi pi-desktop"></i>
            <span>System</span>
          </button>
          <button 
            :class="['toggle-btn', { active: theme === 'dark' }]" 
            @click="$emit('update:theme', 'dark')"
            title="Dark Theme"
          >
            <i class="pi pi-moon"></i>
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div class="drawer-section">
        <h3 class="drawer-section-title">View Mode</h3>
        <div class="view-toggle">
          <button 
            :class="['toggle-btn', { active: viewMode === 'compact' }]" 
            @click="$emit('update:viewMode', 'compact')"
            title="Compact View"
          >
            <i class="pi pi-list"></i>
            <span>Compact</span>
          </button>
          <button 
            :class="['toggle-btn', { active: viewMode === 'grid' }]" 
            @click="$emit('update:viewMode', 'grid')"
            title="Grid View"
          >
            <i class="pi pi-th-large"></i>
            <span>Grid</span>
          </button>
        </div>
      </div>

      <div class="drawer-section github-link-section">
        <a 
          href="https://github.com/mms-gianni/grafana-alerts-dashboard" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-link"
          title="View on GitHub"
        >
          <i class="pi pi-github"></i>
          <span>View on GitHub</span>
        </a>
      </div>

    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from 'primevue/sidebar'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'
import Select from 'primevue/select'

interface Props {
  visible: boolean
  selectedStates: string[]
  selectedInstances: string[]
  selectedLabels: string[]
  fontSize: number
  viewMode: 'compact' | 'grid'
  theme: 'light' | 'system' | 'dark'
  availableInstances: string[]
  availableLabels: string[]
  showNormalSubalerts: boolean
  highlightDuration: number
  notificationSound: string
  notificationVolume: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:selectedStates': [value: string[]]
  'update:selectedInstances': [value: string[]]
  'update:selectedLabels': [value: string[]]
  'update:fontSize': [value: number]
  'update:viewMode': [value: 'compact' | 'grid']
  'update:theme': [value: 'light' | 'system' | 'dark']
  'update:showNormalSubalerts': [value: boolean]
  'update:highlightDuration': [value: number]
  'update:notificationSound': [value: string]
  'update:notificationVolume': [value: number]
}>()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const stateOptions = [
  { label: 'Alerting', value: 'alerting', icon: 'pi pi-exclamation-triangle', color: '#f44336' },
  { label: 'Pending', value: 'pending', icon: 'pi pi-clock', color: '#ff9800' },
  { label: 'No Data', value: 'no_data', icon: 'pi pi-question-circle', color: '#2196f3' },
  { label: 'Paused', value: 'paused', icon: 'pi pi-times-circle', color: '#9e9e9e' },
  { label: 'Silenced', value: 'silenced', icon: 'pi pi-volume-off', color: '#757575' },
  { label: 'OK', value: 'ok', icon: 'pi pi-check-circle', color: '#4caf50' },
]

const soundOptions = [
  { label: 'None', value: '' },
  { label: 'Sound 1', value: 'notification-1.mp3' },
  { label: 'Sound 2', value: 'notification-2.mp3' },
  { label: 'Sound 3', value: 'notification-3.mp3' },
  { label: 'Sound 4', value: 'notification-4.mp3' },
  { label: 'Sound 5', value: 'notification-5.mp3' },
]

const handleSoundChange = (newSound: string) => {
  emit('update:notificationSound', newSound)
  
  // Play preview of selected sound
  if (newSound) {
    const previewAudio = new Audio(`/${newSound}`)
    previewAudio.volume = props.notificationVolume
    previewAudio.play().catch(err => {
      console.log('Could not play preview sound:', err)
    })
  }
}
</script>

<style>
.p-sidebar-header {
  padding: 1.5rem !important;
  margin-bottom: 1rem !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.p-multiselect-item , .p-multiselect-header {
  padding: 0.25rem 0.5rem !important;
}
</style>

<style scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem 0;
  margin: 2rem;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drawer-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.filter-option i {
  font-size: 1rem;
}

.state-filter {  
  width: 100%;
}

.instance-filter {
  width: 100%;
}

.size-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.size-control i {
  color: #aaa;
  font-size: 1rem;
}

.size-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #64b5f6;
  cursor: pointer;
}

.size-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #64b5f6;
  cursor: pointer;
  border: none;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.theme-toggle {
  display: flex;
  gap: 0.35rem;
  width: 100%;
}

.toggle-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 0.75rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  min-width: 0;
}

.toggle-btn i {
  font-size: 1.2rem;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.toggle-btn.active {
  background: rgba(100, 181, 246, 0.3);
  color: #64b5f6;
  border: 1px solid rgba(100, 181, 246, 0.5);
}

.switch-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.switch-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
}

.switch-label span {
  color: #ccc;
}

.duration-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.duration-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #ccc;
}

.duration-value {
  font-weight: 600;
  color: #64b5f6;
  font-size: 0.85rem;
}

.duration-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.duration-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #64b5f6;
  cursor: pointer;
}

.duration-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #64b5f6;
  cursor: pointer;
  border: none;
}

.sound-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.9rem;
  color: #ccc;
}

.sound-select {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.sound-select:hover {
  background: rgba(255, 255, 255, 0.15);
}

.sound-select option {
  background: #1e1e1e;
  color: #fff;
}

.volume-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.volume-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #64b5f6;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #64b5f6;
  cursor: pointer;
  border: none;
}

.github-link-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ccc;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.github-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.github-link i {
  font-size: 1.25rem;
}
</style>
<style>
/* Dark theme sidebar styles - non-scoped for portaled sidebar */
body:has(.theme-dark) .p-sidebar,
body:has(.theme-dark) .p-drawer {
  --p-drawer-background: #0f0f1a !important;
  --p-sidebar-background: #0f0f1a !important;
  --p-overlay-modal-background: #0f0f1a !important;
  --p-drawer-border-color: rgba(255, 255, 255, 0.1) !important;
  --p-overlay-modal-border-color: rgba(255, 255, 255, 0.1) !important;
  --p-drawer-color: #ffffff !important;
  --p-overlay-modal-color: #ffffff !important;
  background: #0f0f1a !important;
  border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

body:has(.theme-dark) .p-sidebar-header {
  background: #0f0f1a !important;
  color: #fff !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
}

body:has(.theme-dark) .p-sidebar-header-content {
  color: #fff !important;
}

body:has(.theme-dark) .p-sidebar-close-icon {
  color: #fff !important;
}

/* Dark mode form components */
body:has(.theme-dark) .p-multiselect,
body:has(.theme-dark) .p-select,
body:has(.theme-dark) .p-inputtext {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

body:has(.theme-dark) .p-multiselect:hover,
body:has(.theme-dark) .p-select:hover,
body:has(.theme-dark) .p-inputtext:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

body:has(.theme-dark) .p-multiselect-overlay,
body:has(.theme-dark) .p-select-overlay,
body:has(.theme-dark) .p-multiselect-panel {
  background: #1a1a2e !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

body:has(.theme-dark) .p-overlay,
body:has(.theme-dark) .p-component-overlay {
  background: #1a1a2e !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

body:has(.theme-dark) .p-multiselect-list,
body:has(.theme-dark) .p-select-list {
  background: #1a1a2e !important;
  color: #fff !important;
}

body:has(.theme-dark) .p-multiselect-header {
  background: #1a1a2e !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

body:has(.theme-dark) .p-multiselect-filter {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

body:has(.theme-dark) .p-multiselect-item,
body:has(.theme-dark) .p-select-option {
  color: #fff !important;
  background: transparent !important;
}

body:has(.theme-dark) .p-multiselect-option,
body:has(.theme-dark) .p-select-item {
  color: #fff !important;
  background: transparent !important;
}

body:has(.theme-dark) .p-multiselect-item:hover,
body:has(.theme-dark) .p-select-option:hover {
  background: rgba(255, 255, 255, 0.15) !important;
}

body:has(.theme-dark) .p-multiselect-option:hover,
body:has(.theme-dark) .p-select-item:hover {
  background: rgba(255, 255, 255, 0.15) !important;
}

body:has(.theme-dark) .p-multiselect-item.p-focus,
body:has(.theme-dark) .p-select-option.p-focus {
  background: rgba(100, 181, 246, 0.25) !important;
}

body:has(.theme-dark) .p-multiselect-option.p-focus,
body:has(.theme-dark) .p-select-item.p-focus {
  background: rgba(100, 181, 246, 0.25) !important;
}

body:has(.theme-dark) .p-multiselect-label,
body:has(.theme-dark) .p-select-label {
  color: #fff !important;
}

body:has(.theme-dark) .p-multiselect-dropdown,
body:has(.theme-dark) .p-select-dropdown {
  color: #fff !important;
}

body:has(.theme-dark) .p-checkbox-box {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

body:has(.theme-dark) .p-checkbox-box:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

body:has(.theme-dark) .p-checkbox-box.p-checked {
  background: #64b5f6 !important;
  border-color: #64b5f6 !important;
}

/* Light theme form components */
body:has(.theme-light) .p-sidebar,
body:has(.theme-light) .p-drawer {
  --p-drawer-background: #ffffff !important;
  --p-sidebar-background: #ffffff !important;
  --p-overlay-modal-background: #ffffff !important;
  --p-drawer-border-color: rgba(0, 0, 0, 0.12) !important;
  --p-overlay-modal-border-color: rgba(0, 0, 0, 0.12) !important;
  --p-drawer-color: #1a1a1a !important;
  --p-overlay-modal-color: #1a1a1a !important;
  background: #ffffff !important;
  border-left: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-sidebar-header {
  background: #f8f9fa !important;
  color: #1a1a1a !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

body:has(.theme-light) .p-sidebar-header-content {
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-sidebar-close-icon {
  color: #1a1a1a !important;
}

/* Light mode form components */
body:has(.theme-light) .p-multiselect,
body:has(.theme-light) .p-select,
body:has(.theme-light) .p-inputtext {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-multiselect:hover,
body:has(.theme-light) .p-select:hover,
body:has(.theme-light) .p-inputtext:hover {
  border-color: #9ca3af !important;
  background: #ededed !important;
}

b

body:has(.theme-light) .p-overlay,
body:has(.theme-light) .p-component-overlay {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

body:has(.theme-light) .p-multiselect-list,
body:has(.theme-light) .p-select-list {
  background: #ffffff !important;
  color: #1a1a1a !important;
}ody:has(.theme-light) .p-multiselect-overlay,
body:has(.theme-light) .p-select-overlay,
body:has(.theme-light) .p-multiselect-panel {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  color: #1a1a1a !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

body:has(.theme-light) .p-multiselect-header {
  background: #f9fafb !important;
  background: transparent !important;
}

body:has(.theme-light) .p-multiselect-option,
body:has(.theme-light) .p-select-item {
  color: #1a1a1a !important;
  background: transparent !important;
  border-bottom: 1px solid #e5e7eb !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-multiselect-filter {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-multiselect-item,
body:has(.theme-light) .p-select-option {
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-multiselect-item:hover,
body:has(.theme-light) .p-select-option:hover {
  background: #e5e7eb !important;
}

body:has(.theme-light) .p-multiselect-option:hover,
body:has(.theme-light) .p-select-item:hover {
  background: #e5e7eb !important;
}

body:has(.theme-light) .p-multiselect-item.p-focus,
body:has(.theme-light) .p-select-option.p-focus {
  background: #dbeafe !important;
}

body:has(.theme-light) .p-multiselect-option.p-focus,
body:has(.theme-light) .p-select-item.p-focus {
  background: #dbeafe !important;
}

body:has(.theme-light) .p-multiselect-label,
body:has(.theme-light) .p-select-label {
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-multiselect-dropdown,
body:has(.theme-light) .p-select-dropdown {
  color: #1a1a1a !important;
}

body:has(.theme-light) .p-checkbox-box,
body:has(.theme-light) .p-toggleswitch-input {
  background: #4c7bb1 !important;
  border-color: #4c7bb1 !important;
}

body:has(.theme-light) .p-checkbox-box:hover,
body:has(.theme-light) .p-toggleswitch-input:hover {
  background: #f9fafb !important;
  border-color: #9ca3af !important;
}

body:has(.theme-light) .p-checkbox-box.p-checked {
  background: #0a4a93 !important;
  border-color: #0a4a93 !important;
}

body:has(.theme-light) .drawer-content {
  color: #1a1a1a !important;
}

body:has(.theme-light) .drawer-section-title {
  color: #2d2d2d !important;
  font-weight: 700 !important;
}

body:has(.theme-light) .switch-label span,
body:has(.theme-light) .control-label,
body:has(.theme-light) .duration-label {
  color: #1a1a1a !important;
}

body:has(.theme-light) .duration-value {
  color: #1565c0 !important;
  font-weight: 700 !important;
}

body:has(.theme-light) .size-control i {
  color: #555 !important;
}

body:has(.theme-light) .sound-select {
  background: rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.25) !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .sound-select:hover {
  background: rgba(0, 0, 0, 0.12) !important;
}

body:has(.theme-light) .sound-select option {
  background: #fff !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .github-link {
  background: rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .github-link:hover {
  background: rgba(0, 0, 0, 0.14) !important;
  color: #000 !important;
  border-color: rgba(0, 0, 0, 0.25) !important;
}

body:has(.theme-light) .github-link-section {
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
}

body:has(.theme-light) .toggle-btn {
  background: rgba(0, 0, 0, 0.05) !important;
  color: #555 !important;
  border: 1px solid transparent !important;
}

body:has(.theme-light) .toggle-btn:hover {
  background: rgba(0, 0, 0, 0.1) !important;
  color: #1a1a1a !important;
}

body:has(.theme-light) .toggle-btn.active {
  background: rgba(100, 181, 246, 0.15) !important;
  color: #1565c0 !important;
  border: 1px solid rgba(100, 181, 246, 0.4) !important;
}
</style>