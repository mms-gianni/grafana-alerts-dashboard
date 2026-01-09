## Development Setup

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Grafana instance with API access
- Grafana API key with viewer permissions

## Installation

1. **Clone or navigate to the project directory**

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Configure Backend Environment**
   
   Create `backend/.env` from the example:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env`:
   ```env
   # JSON array format
   GRAFANA_INSTANCES='[{"name":"prod","url":"https://grafana-prod:3000","apiKey":"glsa_xxx"},{"name":"staging","url":"https://grafana-staging:3000","apiKey":"glsa_yyy"}]'
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   POLL_INTERVAL=30000
   ```

4. **Configure Frontend Environment (Optional)**
   
   Create `frontend/.env` if you need to customize the backend URL:
   ```bash
   cd frontend
   cp .env.example .env
   ```
   
   Edit `frontend/.env`:
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   ```
## Running the Application

### Development Mode

Run both backend and frontend concurrently:

**Option 1: Separate Terminals**
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run frontend
```

**Option 2: Using VS Code Tasks**
- Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux)
- Select "Run Backend and Frontend"

### Access the Dashboard

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

### Production Build

Build both applications:
```bash
npm run build
```

This creates:
- `backend/dist/` - Compiled NestJS application
- `frontend/dist/` - Static frontend assets

Run production backend:
```bash
cd backend
npm run start:prod
```

Serve frontend with any static file server (nginx, Apache, etc.)

## Troubleshooting

### Backend won't start
- Check if `.env` file exists and contains valid Grafana credentials
- Verify Grafana URL is accessible
- Ensure port 3001 is not in use

### Frontend can't connect to backend
- Verify backend is running on http://localhost:3001
- Check CORS settings in `backend/src/main.ts`
- Verify `VITE_BACKEND_URL` in `frontend/.env` (if set)

### No alerts showing
- Verify Grafana API key has correct permissions
- Check if Grafana instance has any alerts configured
- Look at backend logs for API errors

### WebSocket connection issues
- Check firewall/network settings
- Verify WebSocket protocol is not blocked
- Check browser console for connection errors

## Development

### Adding New Features

**Backend (NestJS)**
- Add new services in `backend/src/alerts/`
- Modify WebSocket gateway in `alerts.gateway.ts`
- Update Grafana service for new API endpoints

**Frontend (Vue 3)**
- Add new components in `frontend/src/components/`
- Modify main dashboard in `App.vue`
- Add PrimeVue components as needed

### Code Style

Both projects use TypeScript with ESLint and Prettier:

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```