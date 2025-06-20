# apps/data-ingestion-service/Dockerfile

# --- STAGE 1: Builder Stage (This part is now working based on your previous outputs) ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --force
WORKDIR /app/apps/data-ingestion-service
RUN pnpm install --frozen-lockfile --prefer-offline
RUN pnpm run build

# --- STAGE 2: Production Stage (FIXING THIS SECTION) ---
FROM node:20-alpine

# Set the working directory for the final application
WORKDIR /app/apps/data-ingestion-service

# Copy the app's package.json
COPY apps/data-ingestion-service/package.json ./package.json

# Copy the root pnpm-lock.yaml from the builder stage to the current WORKDIR.
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install pnpm globally here too
RUN npm install -g pnpm

# Install only production dependencies for this specific app
# --- FIX START ---
# Removed '--lockfile-path' as it's an unknown option.
# pnpm should find 'pnpm-lock.yaml' in the current WORKDIR by default.
RUN pnpm install --prod --frozen-lockfile
# --- FIX END ---

# Copy the built application (dist folder) from the builder stage
COPY --from=builder /app/apps/data-ingestion-service/dist ./dist

# Command to run the application
CMD ["node", "dist/index.js"]