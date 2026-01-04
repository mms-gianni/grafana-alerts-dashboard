# Multi-stage build for both frontend and backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy source code for both services
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build backend
WORKDIR /app/backend
RUN yarn build

# Build frontend
WORKDIR /app/frontend
RUN yarn build

# Production stage - nginx with node
FROM node:20-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy built frontend to nginx html directory
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/node_modules ./node_modules

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Create nginx directories
RUN mkdir -p /run/nginx /var/log/supervisor

# Expose port
EXPOSE 80

# Start supervisor (will manage both nginx and backend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
