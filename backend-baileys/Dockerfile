FROM node:20-alpine

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Create directories for data and auth
RUN mkdir -p /app/data /app/auth_info

# Expose port
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV WORKERS_API_URL=https://catat-uang-api.muhamadbasim.workers.dev/api
ENV DASHBOARD_URL=https://nyatetin.pages.dev

# Start the app
CMD ["node", "dist/index.js"]
