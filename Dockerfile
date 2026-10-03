FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY bin/ ./bin/
COPY instructions.md ./instructions.md
COPY manifest.json ./manifest.json

ENV NODE_ENV=production \
    OLLAMA_BASE_URL=http://localhost:11434 \
    TRANSLATION_MODEL=gemma2:2b \
    HTTP_PORT=8772 \
    HTTP_HOST=0.0.0.0 \
    LOG_LEVEL=info

EXPOSE 8772

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8772/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js", "daemon"]
