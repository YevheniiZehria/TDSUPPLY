# Multi-stage Dockerfile for Monorepo (Next.js Frontend + NestJS Backend)

# --- Stage 1: Build NestJS Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend-service
COPY backend-service/package*.json ./
RUN npm ci
COPY backend-service/ .
RUN npm run build

# --- Stage 2: Build Next.js Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .

# We set NEXT_PUBLIC_API_URL to an empty string during build.
# This forces the client-side API requests to use relative URLs (e.g. /products instead of http://localhost:3001/products).
# These requests will be proxied to the backend via Next.js rewrites.
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Stage 3: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for backend
WORKDIR /app/backend-service
COPY backend-service/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/backend-service/dist ./dist
RUN mkdir -p public

# Setup frontend standalone server
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

# Setup startup entrypoint script at the root
WORKDIR /app

RUN echo '#!/bin/sh' > start.sh && \
    echo 'PORT=3001 node backend-service/dist/main &' >> start.sh && \
    echo 'PORT=${PORT:-8080} HOSTNAME=0.0.0.0 node frontend/server.js' >> start.sh && \
    chmod +x start.sh

# Google Cloud Run will inject PORT, default is usually 8080
EXPOSE 8080

CMD ["./start.sh"]
