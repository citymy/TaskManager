FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start"]