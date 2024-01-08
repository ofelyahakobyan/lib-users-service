FROM node:18-alpine

WORKDIR /home/node/app

COPY ./package.json ./package.json

RUN yarn install

COPY ./src ./src

CMD ["yarn", "start"]