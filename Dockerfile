# 1. Usa un'immagine Node.js leggera per compilare il frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copia i file del client e installa le dipendenze
COPY client/package*.json ./client/
RUN cd client && npm install

# Copia tutto il codice del client e compila
COPY client/ ./client/
# Imposta le variabili d'ambiente per la build del client
ENV VITE_API_URL="/api"
RUN cd client && npm run build

# 2. Usa un'immagine nuova e pulita per far girare il server
FROM node:20-alpine
WORKDIR /app

# Copia i file del server e installa le dipendenze di produzione
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copia tutto il codice del server
COPY server/ ./server/

# Copia i file compilati del frontend dal builder precedente
COPY --from=builder /app/client/dist ./client/dist

# Assicuriamoci che la cartella dati del DB esista
RUN mkdir -p /app/server/data

# Impostiamo la variabile d'ambiente per il server
ENV NODE_ENV=production

# Esponi la porta del server
EXPOSE 3001

# Avvia il setup del DB e poi il server
CMD ["sh", "-c", "cd server && node db_setup.mjs && node server.mjs"]
