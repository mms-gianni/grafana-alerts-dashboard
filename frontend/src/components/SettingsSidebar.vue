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

    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from 'primevue/sidebar'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'

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
</style>
