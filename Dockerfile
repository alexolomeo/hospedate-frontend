# ---------- BUILD ----------
FROM node:22 AS builder
WORKDIR /app

COPY package*.json ./
#RUN npm ci

COPY . .
COPY .env .env
RUN npx astro build


# ---------- RUNTIME: Lambda Node.js 22 ----------
FROM public.ecr.aws/lambda/nodejs:22

WORKDIR /var/task

# Copiar build final
COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/dist/client ./export/s3
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./.env



# Copiamos el wrapper para Lambda
COPY index.mjs ./index.mjs

# Lambda ejecutará este archivo como handler
CMD [ "index.handler" ]
