# Grafana Alerts Dashboard Helm Chart

This Helm chart deploys the Grafana Alerts Dashboard application to Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Docker image built and pushed to a registry

## Installation

### Quick Start

```bash
# Add your custom values
helm install grafana-alerts-dashboard ./helm/grafana-alerts-dashboard \
  --set image.repository=your-registry/grafana-alerts-dashboard \
  --set image.tag=latest
```

### Using a values file

```bash
helm install grafana-alerts-dashboard ./helm/grafana-alerts-dashboard \
  -f custom-values.yaml
```

## Configuration

### Basic Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `grafana-alerts-dashboard` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Service Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `3001` |
| `service.targetPort` | Container port | `3001` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.hosts[0].host` | Hostname | `grafana-alerts.example.com` |
| `ingress.tls` | TLS configuration | `[]` |

### Application Environment Variables

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env.NODE_ENV` | Node environment | `production` |
| `env.PORT` | Application port | `3001` |
| `env.CORS_ORIGIN` | CORS origin | `*` |

### Resource Limits

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `resources.requests.cpu` | CPU request | `250m` |
| `resources.requests.memory` | Memory request | `256Mi` |

## Examples

### Enable Ingress with TLS

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: grafana-alerts.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: grafana-alerts-tls
      hosts:
        - grafana-alerts.yourdomain.com
```

### Configure Grafana Connection

```yaml
env:
  NODE_ENV: production
  PORT: "3001"
  GRAFANA_URL: "https://grafana.yourdomain.com"
  GRAFANA_API_KEY: "your-api-key"
```

### Use Secrets for Sensitive Data

```yaml
envFrom:
  - secretRef:
      name: grafana-alerts-secrets
```

Then create the secret:

```bash
kubectl create secret generic grafana-alerts-secrets \
  --from-literal=GRAFANA_API_KEY=your-api-key
```

### Enable Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80
```

## Upgrading

```bash
helm upgrade grafana-alerts-dashboard ./helm/grafana-alerts-dashboard \
  -f custom-values.yaml
```

## Uninstalling

```bash
helm uninstall grafana-alerts-dashboard
```

## Building and Pushing Docker Image

Before deploying, build and push your Docker image:

```bash
# Build the image
docker build -t your-registry/grafana-alerts-dashboard:latest .

# Push to registry
docker push your-registry/grafana-alerts-dashboard:latest
```

## Troubleshooting

### Check pod status
```bash
kubectl get pods -l app.kubernetes.io/name=grafana-alerts-dashboard
```

### View logs
```bash
kubectl logs -l app.kubernetes.io/name=grafana-alerts-dashboard
```

### Check service
```bash
kubectl get svc grafana-alerts-dashboard
```

### Port-forward for local testing
```bash
kubectl port-forward svc/grafana-alerts-dashboard 8080:3001
```
