# Multiple Grafana Instances Configuration Guide

## Overview

The dashboard now supports monitoring alerts from multiple Grafana instances simultaneously. Each alert displays a badge indicating its source instance, and all alerts are aggregated in a single view.

## Configuration Format

Use the `GRAFANA_INSTANCES` environment variable with a JSON array:

```json
[{"name":"instance1","url":"https://grafana.example.com","apiKey":"glsa_xxx"}]
```

### JSON Object Properties:
- **name**: Display name for the instance (shown in badge)
- **url**: Full Grafana URL including protocol (e.g., `https://grafana-prod.example.com:3000`)
- **apiKey**: Grafana API key with viewer permissions

### Environment Variable

```bash
GRAFANA_INSTANCES='[{"name":"prod","url":"https://grafana-prod.example.com","apiKey":"glsa_xxx"},{"name":"staging","url":"https://grafana-staging.example.com","apiKey":"glsa_yyy"}]'
```

> **Note**: Wrap the JSON string in single quotes to prevent shell interpretation.

## Configuration Examples

### Single Instance

```bash
GRAFANA_INSTANCES='[{"name":"default","url":"https://localhost:3000","apiKey":"glsa_your_api_key_here"}]'
```

### Multiple Instances

```bash
GRAFANA_INSTANCES='[{"name":"prod","url":"https://grafana-prod.local:3000","apiKey":"glsa_prod_key"},{"name":"staging","url":"https://grafana-staging.local:3000","apiKey":"glsa_staging_key"}]'
```

### Formatted for Readability (same value, just formatted)

```json
[
  {
    "name": "prod",
    "url": "https://grafana-prod.local:3000",
    "apiKey": "glsa_prod_key"
  },
  {
    "name": "staging",
    "url": "https://grafana-staging.local:3000",
    "apiKey": "glsa_staging_key"
  }
]
```

### Docker Compose

```yaml
environment:
  - GRAFANA_INSTANCES=[{"name":"prod","url":"https://grafana-prod:3000","apiKey":"glsa_xxx"},{"name":"staging","url":"https://grafana-staging:3000","apiKey":"glsa_yyy"}]
```

## Priority

The `GRAFANA_INSTANCES` environment variable is **required**. If not set, the backend will log an error and no instances will be configured.

## Backend Changes

### GrafanaService

- **`instances[]`**: Array of configured Grafana instances with name, URL, and axios client
- **`initializeInstances()`**: Parses configuration and initializes axios clients for each instance
- **`getSilences()`**: Renamed, now returns DisplayAlert[] aggregated from all instances
- **`getSilencesForInstance()`**: New private method to fetch silences from a specific instance
- **`transformAlertToDisplay()`**: Updated to accept `instanceName` and `instanceUrl` parameters
- **`getAlerts()`**: Now calls `getSilences()` which aggregates from all instances
- **`getAlertById()`**: Searches across all instances sequentially
- **`pauseAlert()`**: Searches across all instances to find and pause the alert

### DisplayAlert Interface

Added optional field:
```typescript
instanceName?: string
```

## Frontend Changes

### AlertRow Component

- Added instance badge display next to alert name
- Badge only shows if `instanceName` exists and is not "default"
- Purple/pink color scheme to distinguish from state and label badges
- Flex layout ensures badge doesn't break alert name overflow

### AlertCard Component

- Added instance badge above labels section
- Consistent styling with AlertRow
- Badge appears below alert name for better visual hierarchy

### Badge Styling

```css
.instance-badge {
  background: rgba(156, 39, 176, 0.2);
  color: #ce93d8;
  border: 1px solid rgba(156, 39, 176, 0.3);
}
```

## API Key Permissions

Each Grafana API key needs:
- **Viewer** role minimum
- Access to:
  - `/api/v1/provisioning/alert-rules` (read alert rules)
  - `/api/alertmanager/grafana/api/v2/silences` (read silences)

## Error Handling

- If an instance fails to respond, it's logged as an error but doesn't block other instances
- Failed instances return empty alert arrays
- Alerts from successful instances are still displayed
- Each instance has independent error logging with instance name prefix

## Performance

- All instances are queried in parallel using `Promise.all()`
- Polling interval applies to all instances simultaneously (every 30 seconds by default)
- Silences are fetched concurrently with alerts for each instance
- Total aggregated alerts are logged for monitoring

## Migration Guide

### From Colon-Separated Format

If you're upgrading from the colon-separated format:

```bash
# Old format (no longer supported)
GRAFANA_INSTANCES=default:http://localhost:3000:glsa_xxx

# New JSON format
GRAFANA_INSTANCES='[{"name":"default","url":"http://localhost:3000","apiKey":"glsa_xxx"}]'
```

### From Single Instance Variables

If you're upgrading from single instance configuration:

```bash
# Old format (no longer supported)
GRAFANA_URL=https://localhost:3000
GRAFANA_API_KEY=glsa_xxx

# New JSON format
GRAFANA_INSTANCES='[{"name":"default","url":"https://localhost:3000","apiKey":"glsa_xxx"}]'
```

### Steps:

1. Update your `.env` file with the new JSON format
2. Restart the backend service
3. Verify in backend logs: "Initialized Grafana instance: default"

## Troubleshooting

### No instances detected
**Check**: Environment variable is valid JSON
```bash
# Correct
GRAFANA_INSTANCES='[{"name":"prod","url":"https://grafana:3000","apiKey":"key1"}]'

# Incorrect (missing quotes around JSON)
GRAFANA_INSTANCES=[{"name":"prod","url":"https://grafana:3000","apiKey":"key1"}]

# Validate JSON online or with: echo $GRAFANA_INSTANCES | jq
```

### Instance not showing alerts
**Check**: 
- Backend logs for errors from that specific instance
- API key has correct permissions
- URL is accessible from backend container/server
- Grafana version compatibility (tested with Grafana 9.x and 10.x)

### Badges not appearing
**Check**:
- Instance name is not "default" (default name is hidden)
- Frontend has received updated alert data (check browser console for WebSocket messages)
- Alert object includes `instanceName` property

## Example Logs

Successful initialization:
```
[GrafanaService] Initialized Grafana instance: prod (http://grafana-prod:3000)
[GrafanaService] Initialized Grafana instance: staging (http://grafana-staging:3000)
```

Successful fetch:
```
[GrafanaService] Successfully fetched 45 alert rules and 3 active silences from prod
[GrafanaService] Successfully fetched 12 alert rules and 1 active silences from staging
[GrafanaService] Total alerts from all instances: 57
```
