# Grafana Alerts Dashboard

Alternative dashboard for Grafana alerts optimized for wall screen displays. Built with NestJS backend, Vue 3 + Vite frontend, and PrimeVue UI components with real-time WebSocket updates.

## Features

- **Real-time Updates**: WebSocket-based live alert updates from Grafana
- **Wall Screen Optimized**: Large, clear display designed for monitoring walls
- **Alert Status Visualization**: Color-coded alerts by state (alerting, pending, ok, paused, no_data)
- **Auto-refresh**: Automatic polling of Grafana API every 30 seconds
- **Statistics Dashboard**: Real-time stats showing alert counts by state
- **Responsive Design**: Works on both large displays and regular screens

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **WebSocket Gateway** - Real-time bidirectional communication
- **Axios** - HTTP client for Grafana API
- **@nestjs/schedule** - Cron jobs for periodic alert polling

### Frontend
- **Vue 3** - Progressive JavaScript framework (Composition API)
- **Vite** - Next-generation frontend build tool
- **PrimeVue** - Rich UI component library
- **Socket.io Client** - WebSocket client for real-time updates
- **TypeScript** - Type-safe development

## Project Structure

```
monitoring/
├── backend/              # NestJS backend application
│   ├── src/
│   │   ├── alerts/      # Alerts module (Gateway, Service, Grafana integration)
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example     # Backend environment variables template
│   └── package.json
├── frontend/            # Vue 3 + Vite frontend application
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── assets/      # CSS and static assets
│   │   ├── App.vue      # Main dashboard component
│   │   └── main.ts
│   ├── .env.example     # Frontend environment variables template
│   └── package.json
├── .github/
│   └── copilot-instructions.md
└── package.json         # Root workspace configuration
```

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
   
   Edit `backend/.env` with your Grafana configuration:
   ```env
   GRAFANA_URL=http://your-grafana-instance:3000
   GRAFANA_API_KEY=your-grafana-api-key
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

## Getting a Grafana API Key

1. Log in to your Grafana instance
2. Go to **Configuration** → **API Keys**
3. Click **Add API key**
4. Set a name (e.g., "Alerts Dashboard")
5. Set role to **Viewer**
6. Set expiration as needed
7. Click **Add** and copy the generated key
8. Paste the key into your `backend/.env` file

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

## Features in Detail

### Real-time WebSocket Updates

The backend polls Grafana API every 30 seconds and pushes updates to all connected clients via WebSocket. No manual refresh needed!

### Alert States

Alerts are displayed with color coding:
- **Red** - Alerting (critical)
- **Orange** - Pending
- **Green** - OK
- **Gray** - Paused
- **Blue** - No Data

### Wall Screen Optimization

- Large, readable fonts
- High contrast color scheme
- Auto-scaling grid layout
- Duration tracking for each alert
- Real-time connection status indicator

## API Reference

### WebSocket Events

**Client → Server**
- `getAlerts` - Request current alerts

**Server → Client**
- `alerts` - Alert data update (array of GrafanaAlert)
- `error` - Error message

### Grafana Alert Object

```typescript
interface GrafanaAlert {
  id: number
  name: string
  state: 'ok' | 'paused' | 'alerting' | 'pending' | 'no_data'
  newStateDate: string
  evalDate: string
  url: string
}
```

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

## License

MIT

## Support

For issues or questions, please check:
- Grafana API documentation
- NestJS WebSocket documentation
- Vue 3 and PrimeVue documentation
