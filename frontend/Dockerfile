# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY frontend/package.json ./frontend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the application
WORKDIR /app/frontend
RUN yarn build

# Production stage with nginx and distroless-like minimal image
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --from=builder /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
