FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG SKIP_TLS=false
RUN mkdir -p public/uploads
# Default: secure build. To disable TLS verification during build (only if necessary),
# pass build-arg `SKIP_TLS=true` which will run the build with `NODE_TLS_REJECT_UNAUTHORIZED=0`.
RUN if [ "$SKIP_TLS" = "true" ]; then \
    NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build; \
    else \
    npm run build; \
    fi

EXPOSE 3000

CMD ["npm", "run", "start"]