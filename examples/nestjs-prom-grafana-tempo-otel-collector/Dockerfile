FROM node:14.15.5-alpine3.13
EXPOSE 5555

RUN mkdir /app && chown -R node:node /app

USER node

COPY package.json package-lock.json /app/
RUN cd /app && npm install

WORKDIR /app

COPY --chown=node:node . /app

RUN npm run build

CMD [ "npm", "run" ,"start" ]
