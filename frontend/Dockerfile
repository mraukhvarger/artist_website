# Stage 1: Сборка Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Раздача через Nginx
FROM nginx:alpine

# Очищаем дефолтные файлы Nginx
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы в root Nginx
# Если Angular создаст папочку browser, берем файлы напрямую оттуда
COPY --from=build /app/dist/browser /usr/share/nginx/html/
# На случай, если они скомпилировались без вложенности /browser:
COPY --from=build /app/dist /usr/share/nginx/html/

# Копируем конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]