# Base image
FROM node:20-alpine AS base

# Step 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Step 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build for privacy and speed
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets (standalone output doesn't copy public or static by default)
COPY --from=builder /app/public ./public

# Set permissions for nextjs user
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the standalone output folder and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Google Cloud Run will inject PORT, default is usually 8080
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Start Next.js from the standalone build entry point
CMD ["node", "server.js"]
