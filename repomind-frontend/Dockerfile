FROM node:22-alpine
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY package.json ./
# Install production & build dependencies
RUN npm install --no-audit --no-fund && npm cache clean --force

COPY . .
RUN npm run build && npm cache clean --force

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
