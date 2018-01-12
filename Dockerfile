FROM node:8.6-alpine as builder

RUN apk update && \
    apk add python make g++ postgresql-dev yarn

COPY package.json yarn.lock /src/

WORKDIR /src
RUN yarn

ADD index.js /src
ADD lib/ /src/lib
ADD schemas/ /src/schemas

RUN node_modules/.bin/pkg --output dist/intercom2dw . && \
    cp node_modules/libpq/build/Release/addon.node ./dist/

FROM node:8.6-alpine
ENV NODE_ENV=production
ENV INTERCOM2DW_CRON="0 */12 * * *"

RUN apk update && \
    apk add postgresql-dev

COPY --from=builder /src/dist /app

ADD resources/entrypoint /app/entrypoint

RUN chmod +x /app/entrypoint

ENTRYPOINT ["/app/entrypoint"]
