# Build stage
FROM node:18-alpine as builder
WORKDIR /conveyor
COPY . .

WORKDIR /conveyor/backend
RUN yarn build

# Production stage
FROM node:18-alpine
WORKDIR /conveyor

ENV LC_ALL C.UTF-8

COPY --from=builder /conveyor/backend/dist .
RUN yarn

ENTRYPOINT ["yarn", "start"]
