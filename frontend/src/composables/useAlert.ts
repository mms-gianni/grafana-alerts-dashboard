import { computed, type ComputedRef, type Ref } from 'vue'

export interface SubAlert {
  labels: Record<string, string>
  annotations: Record<string, string>
  state: 'Alerting' | 'Normal'
  activeAt: string
  value: string
}

export interface GrafanaAlert {
  id: number
  name: string
  state: 'ok' | 'paused' | 'alerting' | 'pending' | 'no_data'
  newStateDate: string
  evalDate: string
  url: string
  ruleGroup?: string
  labels?: Record<string, string>
  instanceName?: string
  isSilenced?: boolean
  isSilencedBy?: string[]
  totals?: {
    alerting: number
    normal: number
  }
  alerts?: SubAlert[]
}

export function useAlert() {
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

  const useFilteredSubAlerts = (
    alert: Ref<GrafanaAlert> | ComputedRef<GrafanaAlert>,
    showNormalSubalerts: Ref<boolean> | ComputedRef<boolean>
  ): ComputedRef<SubAlert[]> => {
    return computed(() => {
      const alertValue = alert.value
      const showNormal = showNormalSubalerts.value
      
      if (!alertValue?.alerts) return []
      if (showNormal) return alertValue.alerts
      return alertValue.alerts.filter((subAlert: SubAlert) => subAlert.state === 'Alerting')
    })
  }

  return {
    getStateIcon,
    formatDate,
    getDuration,
    useFilteredSubAlerts
  }
}
