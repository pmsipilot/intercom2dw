FROM node:8.2 as builder
ENV NODE_ENV=production

RUN npm install -g yarn

COPY . /src
WORKDIR /src

RUN yarn && \
    node_modules/.bin/pkg --output dist/intercom2dw index.js && \
    cp node_modules/libpq/build/Release/addon.node ./dist/

FROM node:8.2
ENV NODE_ENV=production
ENV INTERCOM2DW_CRON="0 6 * * *"

COPY --from=builder /src/dist /app
COPY ./schemas/init.sql /docker-entrypoint-initdb.d/init.sql

VOLUME /docker-entrypoint-initdb.d

ADD resources/entrypoint /app/entrypoint

RUN yarn global add pm2 && \
    chmod +x /app/entrypoint

ENTRYPOINT ["/app/entrypoint"]
