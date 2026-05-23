# Fase 1: Costruzione (Build)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Fase 2: Produzione con Nginx
FROM nginx:alpine
# Copia la build di React nella cartella pubblica di Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Esponi la porta standard per i siti web
EXPOSE 80

# Avvia Nginx
CMD ["nginx", "-g", "daemon off;"]