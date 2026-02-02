# Usa una imagen de Node ligera para correr la app, no para compilarla
FROM node:20-alpine

WORKDIR /app

# Copiamos SOLO lo necesario para ejecutar
COPY package*.json ./
RUN npm install --omit=dev

# Copiamos la carpeta 'dist' que ya construiste en tu Mac
COPY dist ./dist
# Si tu servidor backend está en una carpeta 'server', cópiala también
COPY server ./server

# Exponemos el puerto de tu panel de campañas
EXPOSE 5005

# Ejecutamos directamente con Node (sin ts-node ni cargadores pesados)
CMD ["node", "dist/server/index.js"]
