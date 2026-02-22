FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# El usuario debe montar credenciales.json y container.json como volúmenes o copiarlos
# Ejemplo: docker run -v $(pwd)/credenciales.json:/app/credenciales.json gtm-importer

CMD ["npm", "start"]
