# Base Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for ts-node)
# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Copy built assets
COPY dist ./dist

# Expose the application port
EXPOSE 5005

# Start the application
# We use the same command as dev for now because we rely on ts-node, 
# but in a container environment 'dev' script works fine or we can call node directly.
# Using 'node --loader...' directly is safer to avoid concurrent frontend start which is already built.
CMD ["node", "--loader", "ts-node/esm", "server/index.ts"]
