FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp logs

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
