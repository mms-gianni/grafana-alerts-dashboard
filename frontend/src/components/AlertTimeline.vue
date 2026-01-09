<template>
  <div class="timeline-container">
    <div v-if="loading" class="timeline-loading">Loading history...</div>
    <div v-else-if="error" class="timeline-error">{{ error }}</div>
    <div v-else class="timeline-wrapper">
      <div class="timeline-bar">
        <div
          v-for="(segment, index) in timelineSegments"
          :key="index"
          class="timeline-segment"
          :class="`timeline-${segment.state.toLowerCase()}`"
          :style="{ width: `${segment.percentage}%` }"
          :title="`${segment.state} - ${formatDuration(segment.duration)}`"
        ></div>
      </div>
      <div class="timeline-labels">
        <span>24h ago</span>
        <span>Now</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Annotation {
  id: number
  alertId: number
  newState: string
  prevState: string
  time: number
  timeEnd: number
}

interface TimelineSegment {
  state: string
  start: number
  end: number
  duration: number
  percentage: number
}

interface Props {
  alertId: number
  instanceName?: string
}

const props = defineProps<Props>()

const annotations = ref<Annotation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const TWENTY_FOUR_HOURS = 86400000 // 24 hours in milliseconds

const fetchAnnotations = async () => {
  loading.value = true
  error.value = null
  
  try {
    if (!props.instanceName) {
      error.value = 'Instance name is required'
      loading.value = false
      return
    }
    const response = await fetch(`/api/annotations?alertId=${props.alertId}&instanceName=${encodeURIComponent(props.instanceName)}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch annotations')
    }
    
    const data = await response.json()
    annotations.value = data.sort((a: Annotation, b: Annotation) => a.time - b.time)
  } catch (e) {
    error.value = 'Failed to load timeline data'
    console.error('Error fetching annotations:', e)
  } finally {
    loading.value = false
  }
}

const timelineSegments = computed((): TimelineSegment[] => {
  if (annotations.value.length === 0) {
    return []
  }

  const now = Date.now()
  const startTime = now - TWENTY_FOUR_HOURS
  const segments: TimelineSegment[] = []

  // Sort annotations by time
  const sortedAnnotations = [...annotations.value].sort((a, b) => a.time - b.time)

  // Find the first annotation before or at startTime
  let currentState = 'Normal'
  for (let i = 0; i < sortedAnnotations.length; i++) {
    if (sortedAnnotations[i].time <= startTime) {
      currentState = sortedAnnotations[i].newState
    } else {
      break
    }
  }

  let segmentStart = startTime

  // Process annotations within the 24-hour window
  for (const annotation of sortedAnnotations) {
    if (annotation.time > startTime && annotation.time <= now) {
      // Create segment for the previous state
      const segmentEnd = annotation.time
      const duration = segmentEnd - segmentStart
      const percentage = (duration / TWENTY_FOUR_HOURS) * 100

      segments.push({
        state: currentState,
        start: segmentStart,
        end: segmentEnd,
        duration,
        percentage
      })

      // Update for next segment
      currentState = annotation.newState
      segmentStart = segmentEnd
    }
  }

  // Add final segment from last state change to now
  const finalDuration = now - segmentStart
  const finalPercentage = (finalDuration / TWENTY_FOUR_HOURS) * 100

  segments.push({
    state: currentState,
    start: segmentStart,
    end: now,
    duration: finalDuration,
    percentage: finalPercentage
  })

  return segments
})

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

onMounted(() => {
  fetchAnnotations()
})
</script>

<style scoped>
.timeline-container {
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  margin-bottom: 1px;
}

.timeline-loading,
.timeline-error {
  font-size: 0.85rem;
  color: #aaa;
  text-align: center;
  padding: 0.5rem;
}

.timeline-error {
  color: #f44336;
}

.timeline-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-bar {
  display: flex;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.timeline-segment {
  height: 100%;
  transition: opacity 0.2s;
}

.timeline-segment:hover {
  opacity: 0.8;
}

.timeline-alerting {
  background-color: #f44336;
}

.timeline-pending {
  background-color: #ff9800;
}

.timeline-normal {
  background-color: #4caf50;
}

.timeline-ok {
  background-color: #4caf50;
}

.timeline-paused {
  background-color: #9e9e9e;
}

.timeline-no_data {
  background-color: #2196f3;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #888;
  padding: 0 0.25rem;
}
</style>
