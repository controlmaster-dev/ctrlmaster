FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY dist/ ./dist/
COPY tsconfig.json ./

# Create sessions directory
RUN mkdir -p ./sessions

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
