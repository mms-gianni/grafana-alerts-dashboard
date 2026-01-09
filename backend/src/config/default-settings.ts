export interface AppSettings {
  viewMode: 'compact' | 'grid';
  selectedStates: string[];
  selectedInstances: string[];
  selectedLabels: string[];
  fontSize: number;
  theme: 'light' | 'system' | 'dark';
  showNormalSubalerts: boolean;
  highlightDuration: number;
  notificationSound: string;
  notificationVolume: number;
}

/**
 * Get default settings from environment variables.
 * These are sent to the frontend on connection.
 * Cookie settings on the client will always override these defaults.
 */
export const getDefaultSettings = (): AppSettings => {
  const parseStringArray = (value: string | undefined): string[] => {
    if (!value) return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
  };

  return {
    viewMode: (process.env.DEFAULT_VIEW_MODE as 'compact' | 'grid') || 'compact',
    selectedStates: parseStringArray(process.env.DEFAULT_SELECTED_STATES) || 
      ['alerting', 'pending', 'no_data', 'paused', 'silenced', 'ok'],
    selectedInstances: parseStringArray(process.env.DEFAULT_SELECTED_INSTANCES),
    selectedLabels: parseStringArray(process.env.DEFAULT_SELECTED_LABELS),
    fontSize: parseFloat(process.env.DEFAULT_FONT_SIZE || '2'),
    theme: (process.env.DEFAULT_THEME as 'light' | 'system' | 'dark') || 'dark',
    showNormalSubalerts: process.env.DEFAULT_SHOW_NORMAL_SUBALERTS === 'true',
    highlightDuration: parseInt(process.env.DEFAULT_HIGHLIGHT_DURATION || '10', 10),
    notificationSound: process.env.DEFAULT_NOTIFICATION_SOUND || 'notification-1.mp3',
    notificationVolume: parseFloat(process.env.DEFAULT_NOTIFICATION_VOLUME || '0.5'),
  };
};
