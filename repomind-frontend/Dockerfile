FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build && npm cache clean --force

EXPOSE 3000

CMD ["npm", "run", "start"]
