FROM node:22-alpine

# Small Node.js image; the app runs in the /app directory.
WORKDIR /app
# Only production dependencies are installed in the container.
ENV NODE_ENV=production

COPY package*.json ./
# npm ci uses the lockfile for reproducible installs.
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001
# The default command starts the API and the static file server.
CMD ["node", "server.js"]
