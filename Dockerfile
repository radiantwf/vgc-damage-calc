FROM --platform=linux/amd64 nginx:stable-alpine

RUN rm -rf /etc/nginx/conf.d/*

COPY ./build /front_end

COPY ./docker/nginx/server.conf /etc/nginx/conf.d/server.conf
COPY ./docker/nginx/nginx.conf /etc/nginx/nginx.conf
ENV TZ=Asia/Shanghai

EXPOSE 80