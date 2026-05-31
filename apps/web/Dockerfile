FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile=false

FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["pnpm", "--filter", "@cdc/web", "dev", "--host", "0.0.0.0"]

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm --filter @cdc/contracts build
RUN pnpm --filter @cdc/web build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
