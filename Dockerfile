# Statische Buchungsbestätigung, ausgeliefert von nginx
FROM nginx:1.27-alpine
COPY headers.conf /etc/nginx/headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY en/ /usr/share/nginx/html/en/
COPY assets/ /usr/share/nginx/html/assets/
RUN nginx -t
EXPOSE 80
