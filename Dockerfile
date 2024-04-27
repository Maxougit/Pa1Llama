# Étape 1: Construire l'application Next.js
FROM node:latest as nextjs-build

# Définir le répertoire de travail pour le build de Next.js
WORKDIR /app

# Copier les fichiers package.json et installer les dépendances
COPY Pa1Llama/pa1llama/package.json Pa1Llama/pa1llama/package-lock.json ./
RUN npm install

# Copier les fichiers source du projet Next.js et construire le projet
COPY Pa1Llama/pa1llama/ ./
RUN npm run build

# Installation de Ollama via un script shell
# Ici, je suppose que Ollama doit être installé à l'étape de Node.js
# Si Ollama est requis uniquement pour l'étape Flask, cette partie devra être déplacée
RUN curl -fsSL https://ollama.com/install.sh | sh
RUN ollama pull llama3

# Étape 2: Préparer l'environnement Flask
FROM python:3

# Définir le répertoire de travail pour le backend Flask
WORKDIR /app

# Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier les fichiers backend Flask dans le conteneur
COPY . .

# Copier les fichiers statiques de Next.js du stage de build
COPY --from=nextjs-build /app/.next/static /app/Pa1Llama/pa1llama/.next/static

# Exposer le port pour Next.js
EXPOSE 3000

# Exposer le port pour Flask
EXPOSE 5000

# Définir les variables d'environnement pour Flask
ENV FLASK_APP=main.py
ENV FLASK_RUN_HOST=0.0.0.0

# Commande pour démarrer l'application (démarre Flask)
CMD ["flask", "run"]
