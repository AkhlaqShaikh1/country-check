FROM node:20.10.0

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 31000

CMD ["node", "server.js"]