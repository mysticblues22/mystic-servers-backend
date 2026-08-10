FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

COPY packages ./packages
COPY apps ./apps

RUN pnpm install

RUN pnpm build

WORKDIR /app/apps/auth-service

CMD ["node", "dist/main.js"]
