# # First Stage: Builder
# FROM node:19-alpine3.17 as builder
# WORKDIR /app

# # Copy package.json and package-lock.json first for better caching
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application files
# COPY . .

# # Run the development server
# RUN npm run dev &  # This will start the dev server in the background

# # Install curl for any network requests
# RUN apk add curl

# # Second Stage: Runner
# FROM node:19-alpine3.17 as runner
# WORKDIR /app

# # Copy the app files from the builder stage
# COPY --from=builder /app/ .

# # Expose the development server port
# EXPOSE 3000

# # Command to run the development server
# CMD ["npm", "run", "dev"]

# Build stage
FROM node:19-alpine3.17 as builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:19-alpine3.17 as production
WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Expose the production port
EXPOSE 3000

# Start the server
CMD ["node", ".output/server/index.mjs"]