# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine
WORKDIR /app

RUN addgroup -g 1001 mcpuser && adduser -u 1001 -G mcpuser -s /bin/sh -D mcpuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ ./dist/

RUN chown -R mcpuser:mcpuser /app

USER mcpuser

ENV MCP_TRANSPORT=http
ENV MCP_PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
