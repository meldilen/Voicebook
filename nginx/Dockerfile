# Stage 1: Build the React application
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
RUN chmod -R +x /app/node_modules/.bin/

# Copy the rest of the frontend source code
COPY frontend/ .

# Build the production assets
RUN npm run build

# Stage 2: Set up the Nginx server
FROM nginx:stable-alpine

# Copy the built frontend assets from the builder stage
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# Copy Nginx configuration files
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf
COPY nginx/ssl /etc/ssl

EXPOSE 80 443
