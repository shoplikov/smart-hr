# syntax=docker/dockerfile:1.7
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

ENV NPM_CONFIG_CACHE=/root/.npm
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]