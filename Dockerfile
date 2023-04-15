FROM node:18-alpine

WORKDIR /conveyor

ENV LC_ALL C.UTF-8

COPY . .

WORKDIR /conveyor/backend
RUN yarn build

CMD ["yarn", "start"]
