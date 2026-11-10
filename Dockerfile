# Multistage build: compile with dev dependencies, run with production ones.

# Stage 1: build
FROM node:26.13.0-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@12.18.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Generates the Prisma client and compiles to dist/. No database is needed.
RUN pnpm run build

# Stage 2: runtime
FROM node:26.13.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g pnpm@12.18.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 8000
CMD ["node", "dist/main.js"]
