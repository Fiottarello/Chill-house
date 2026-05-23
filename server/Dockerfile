# Usa l'immagine ufficiale di Node.js (leggera)
FROM node:20-alpine

# Crea la cartella di lavoro nel container
WORKDIR /app

# Copia i file delle dipendenze e installale
COPY package*.json ./
RUN npm install

# Copia tutto il resto del codice
COPY . .

# Esponi la porta del server
EXPOSE 3001

# Avvia prima il setup del DB e poi il server vero e proprio
CMD ["sh", "-c", "node db_setup.mjs && node server.mjs"]