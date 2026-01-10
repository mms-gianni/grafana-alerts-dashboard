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

# Production stage - pure Node.js
#FROM node:20-alpine
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy built backend
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built frontend to be served by NestJS
COPY --from=builder /app/frontend/dist ./public

# Expose port
EXPOSE 3001

# Start Node.js backend (serves both API and static frontend)
#CMD ["node", "dist/main.js"]
CMD ["dist/main.js"]
