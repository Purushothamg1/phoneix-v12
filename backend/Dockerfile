FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /prod_modules ./node_modules
COPY package.json ./

RUN mkdir -p uploads/pdfs uploads/products uploads/logos logs
RUN chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s CMD wget -qO- http://localhost:5000/health || exit 1
CMD ["node", "dist/server.js"]
