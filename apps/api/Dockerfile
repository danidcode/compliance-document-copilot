FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile=false

FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 4000
CMD ["pnpm", "--filter", "@cdc/api", "dev"]

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm --filter @cdc/contracts build
RUN pnpm --filter @cdc/api build

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --prod --frozen-lockfile=false
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY apps/api/migrations apps/api/migrations
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
