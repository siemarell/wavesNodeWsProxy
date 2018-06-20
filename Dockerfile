FROM node:9-alpine
COPY . /app
RUN cd app && npm install --only=production
RUN cd app node dist/storage.init.js
EXPOSE 40510
CMD cd app && node dist/app.js