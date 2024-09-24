# Build stage
FROM node:20-alpine as builder
WORKDIR /conveyor
COPY . .
RUN yarn build

# Production stage
FROM node:20-alpine
WORKDIR /conveyor

ENV LC_ALL C.UTF-8

COPY --from=builder /conveyor/dist .
RUN yarn

ENTRYPOINT ["yarn", "start"]
