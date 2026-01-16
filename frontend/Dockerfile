# Stage 1: Building the code
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the code
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# You only need to copy these if you are not using standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
