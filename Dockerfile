# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (opcional, se pueden pasar en build time)
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy public files (robots.txt, sitemap.xml, etc.)
COPY --from=builder /app/public/robots.txt /usr/share/nginx/html/robots.txt
COPY --from=builder /app/public/sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY --from=builder /app/public/privacy-policy.html /usr/share/nginx/html/privacy-policy.html
COPY --from=builder /app/public/terms.html /usr/share/nginx/html/terms.html
COPY --from=builder /app/public/cookies.html /usr/share/nginx/html/cookies.html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

