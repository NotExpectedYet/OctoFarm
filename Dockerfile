FROM node:14.17-stretch-slim
WORKDIR /app

RUN npm install -g pm2

COPY . /app

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
