FROM node:9-alpine
COPY . /app
RUN cd app && npm install
RUN npm install typescript -g
RUN cd app && tsc
EXPOSE 40510
CMD cd app && node dist/app.js