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

# Install PHP and PHPCS for code analysis
RUN apt-get update && apt-get install -y \
    php-cli \
    php-xml \
    php-mbstring \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && php -v

# Install PHPCS (PHP CodeSniffer) for WordPress coding standards
RUN wget -q https://squizlabs.github.io/PHP_CodeSniffer/phpcs.phar \
    && chmod +x phpcs.phar \
    && mv phpcs.phar /usr/local/bin/phpcs \
    && phpcs --version

# Install WordPress Coding Standards for PHPCS
RUN apt-get update && apt-get install -y unzip --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && wget -q https://github.com/WordPress/WordPress-Coding-Standards/archive/refs/heads/main.zip \
    && unzip -q main.zip -d /usr/local/share/ \
    && rm main.zip \
    && phpcs --config-set installed_paths /usr/local/share/WordPress-Coding-Standards-main

# Copy package files (build context is backend/ folder)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code (build context is backend/ folder)
COPY . ./

# Create necessary directories
RUN mkdir -p uploads temp logs

# Set environment variable for Railway
ENV RAILWAY_ENVIRONMENT=true

# Expose port (Railway will set PORT env var dynamically)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]

