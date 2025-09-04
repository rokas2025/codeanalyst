FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp logs

# Expose port (Railway will set PORT env var dynamically)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
