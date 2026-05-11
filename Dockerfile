FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_ESPN_SITE_API_BASE_URL=/api/espn/site
ARG VITE_ESPN_CORE_API_BASE_URL=/api/espn/core
ARG VITE_ESPN_STANDINGS_API_BASE_URL=/api/espn/v2
ARG VITE_ESPN_WEB_API_BASE_URL=/api/espn/web

ENV VITE_ESPN_SITE_API_BASE_URL=$VITE_ESPN_SITE_API_BASE_URL
ENV VITE_ESPN_CORE_API_BASE_URL=$VITE_ESPN_CORE_API_BASE_URL
ENV VITE_ESPN_STANDINGS_API_BASE_URL=$VITE_ESPN_STANDINGS_API_BASE_URL
ENV VITE_ESPN_WEB_API_BASE_URL=$VITE_ESPN_WEB_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
