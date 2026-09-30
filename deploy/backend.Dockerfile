FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
RUN npm install -g pnpm@10.19.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
RUN pnpm install --frozen-lockfile
COPY backend backend
COPY shared shared
COPY type-patches type-patches
COPY schema.graphql schema.graphql
USER node
WORKDIR /app/backend
ENV NODE_ENV=production
CMD ["../node_modules/.bin/tsx", "src/server.ts"]
