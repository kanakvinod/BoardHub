# Stage 1: Build the TypeScript code
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Create production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
# Copy prisma schema so migrate/seeding can be run if needed in the container
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Health check to monitor backend uptime
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/server.js"]
