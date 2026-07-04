# Stage 1: Build the React client
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine AS runner
# Copy built assets to Nginx html path
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration to override default behavior (allows SPA router reloads)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
