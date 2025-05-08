


FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN SERVER_ROOT=https://playground.accordproject.org NODE_OPTIONS=--max_old_space_size=8192 npm run build


FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
