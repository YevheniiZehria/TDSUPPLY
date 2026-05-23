# Base image for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency configs
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the built output from builder
COPY --from=builder /app/dist ./dist

# Expose port (Google Cloud Run will inject PORT, default is usually 8080)
EXPOSE 8080

# Start NestJS application
CMD ["node", "dist/main"]
