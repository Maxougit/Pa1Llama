# Pa1Llama

## Prérequis

Avant de démarrer, assurez-vous d'avoir installé les logiciels suivants :

- Python 3.12 ou plus récent (_pour le mode developpment_)
- Node.js 18.x ou plus récent (_pour le mode developpment_)
- Ollama (*https://ollama.com/*) (_pour le mode developpment et production_)
- Docker (_pour le mode production_)

## Installation de l'application en mode **developpement**

### Installation des modèles d'IA

```bash
ollama pull llama3
ollama pull snowflake-arctic-embed
```

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/Maxougit/POC_ADS.git
   ```
2. **Installer les dépendances pour le backend :**
   ```bash
   cd POC_ADS
   python3 -m venv venv
   source venv/bin/activate # ou venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Installer les dépendances pour le frontend :**
   ```bash
   cd Pa1Llama/pa1llama
   npm install
   ```

### Ajuster les variables d'environnement

```bash
OLLAMA_HOST = 'http://localhost:11434'
MODE = 'dev'
```

### Démarrer l'application

1. **Démarrer le backend :**

   ```bash
   cd POC_ADS
   source venv/bin/activate # ou venv\Scripts\activate
   python app.py
   ```

2. **Démarrer le frontend :**
   ```bash
    cd Pa1Llama/pa1llama
    npm run dev
   ```
3. **Accéder à l'application :**
   ```bash
    http://localhost:3000
   ```

# ------------------------------

## Installation de l'application en mode **production**

### Installation des modèles d'IA

```bash
ollama pull llama3
ollama pull snowflake-arctic-embed
```

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/Maxougit/POC_ADS.git
   ```
2. **Lancer le conteneur Docker :**
   ```bash
   cd POC_ADS
   docker-compose up --build
   ```
3. **Accéder à l'application :**
   ```bash
    http://localhost:3000
   ```
