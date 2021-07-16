FROM node:13-stretch
WORKDIR /app

RUN npm install yarn
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn run build
RUN yarn run test:e2e
