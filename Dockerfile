# Optimized multistage Dockerfile for building and running a lightweight
# production-ready Node.js application
# Stage 1: Build
FROM node:24-alpine AS builder

# Build-time defaults (placeholder values) to satisfy prisma.config.ts
ARG ENVIRONMENT=dev
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV ENVIRONMENT=${ENVIRONMENT} \
    DATABASE_URL=${DATABASE_URL}

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm@10.26.0 && pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Runtime
FROM node:24-alpine AS runtime

# Set the working directory
WORKDIR /app

# Copy the build output and package files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Expose the application port
EXPOSE 8000

# Command to run the application
CMD ["node", "dist/src/main.js"]
