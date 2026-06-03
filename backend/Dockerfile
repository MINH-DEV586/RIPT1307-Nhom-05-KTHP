# Use the official Node.js 20 image based on Alpine Linux
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including tsx which is needed to run TS files)
RUN npm ci

# Copy the rest of the backend source files
COPY . .

# Ensure an empty .env file exists so Node's --env-file=.env doesn't crash on startup
RUN touch .env

# Expose the port the backend runs on
EXPOSE 5001

# Set the environment variable to production
ENV NODE_ENV=production

# Start the backend server
CMD ["npm", "run", "start"]
