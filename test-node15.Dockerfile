# Test the Node15 environment to crash in a friendly manner
FROM node:15-stretch-slim
WORKDIR /app

RUN npm install -g pm2

COPY ../ /app

COPY docker/entrypoint_jest.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
