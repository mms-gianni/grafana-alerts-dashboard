# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy backend source code
COPY backend/ ./backend/

# Build the application
WORKDIR /app/backend
RUN yarn build

# Production stage with distroless
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./

# Expose port
EXPOSE 3001

# Run the application
CMD ["dist/main.js"]
