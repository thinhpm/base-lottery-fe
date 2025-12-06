# Stage 1: Build
FROM node:22.19.0 AS build

WORKDIR /app
COPY package*.json ./
# RUN npm cache clean --force && npm install --legacy-peer-deps
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static files with serve
FROM node:22.19.0-alpine

WORKDIR /app
# Install 'serve' globally
RUN npm install -g serve

COPY --from=build /app/dist /app/dist

EXPOSE 7866
CMD ["serve", "-s", "dist", "-l", "7866"]