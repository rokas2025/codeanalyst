FROM node:22-bullseye-slim

WORKDIR /app

# Install Chrome and dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && google-chrome-stable --version

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Create necessary directories
RUN mkdir -p uploads temp logs

# Set environment variable for Railway
ENV RAILWAY_ENVIRONMENT=true

# Expose port (Railway will set PORT env var dynamically)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]

