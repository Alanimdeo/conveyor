FROM node:18-alpine

WORKDIR /conveyor

COPY . .

WORKDIR /conveyor/backend
RUN yarn build

CMD ["yarn", "start"]
