FROM node:8.2 as builder
ENV NODE_ENV=production

RUN npm install -g yarn

COPY . /src
WORKDIR /src

RUN yarn && \
    node_modules/.bin/pkg --output dist/intercom2dw index.js && \
    cp node_modules/libpq/build/Release/addon.node ./dist/

FROM node:8.2

COPY --from=builder /src/dist /app

RUN ln -sf /app/intercom2dw /usr/local/bin/intercom2dw

ENTRYPOINT ["intercom2dw"]
