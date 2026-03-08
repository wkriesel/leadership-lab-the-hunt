FROM node:20-alpine

WORKDIR /app

# Copy package files from backend directory (build context is repo root)
COPY backend/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ .

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-3001}

# Start the server
CMD ["node", "server.js"]
