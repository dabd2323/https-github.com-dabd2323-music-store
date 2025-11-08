# 🚂 Guide Complet Railway.app - Étape par Étape

## 📋 Vue d'Ensemble

**Temps total :** 15 minutes
**Coût :** $5/mois (+ $5 gratuits pour commencer)
**Difficulté :** ⭐ Très facile

---

## 🎯 PARTIE 1 : PRÉPARATION (5 minutes)

### Étape 1.1 : Récupérer Votre Code depuis Emergent

**Option A : Via l'Interface Emergent**

1. Dans Emergent, cherchez un bouton **"Download"**, **"Export"** ou **"Files"**
2. Téléchargez tout le projet en ZIP
3. Décompressez sur votre ordinateur

**Option B : Via Git (si déjà sur GitLab/GitHub)**

```bash
# Sur votre machine locale
git clone https://gitlab.com/dabd2323/music-store.git
cd music-store
```

**Option C : Copier les Fichiers Manuellement**

Si vous avez accès au système de fichiers :
```bash
# Créer une archive
cd /app
tar -czf music-store.tar.gz \
  backend/ \
  frontend/ \
  docker-compose.yml \
  Dockerfile.backend \
  Dockerfile.frontend \
  nginx.conf \
  .env.example \
  create_admin.py

# Téléchargez music-store.tar.gz
```

### Étape 1.2 : Vérifier le Contenu

Assurez-vous d'avoir ces dossiers :
```
music-store/
├── backend/
├── frontend/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
└── .env.example
```

---

## 🚀 PARTIE 2 : INSTALLATION RAILWAY (2 minutes)

### Étape 2.1 : Installer Railway CLI

**Sur Windows :**

1. Ouvrez PowerShell en tant qu'administrateur
2. Exécutez :
```powershell
iwr https://railway.app/install.ps1 -useb | iex
```

**Sur Mac :**

Ouvrez Terminal et exécutez :
```bash
curl -fsSL https://railway.app/install.sh | sh
```

**Ou via npm (si vous avez Node.js) :**

```bash
npm install -g @railway/cli
```

### Étape 2.2 : Vérifier l'Installation

```bash
railway --version
# Devrait afficher : railway version x.x.x
```

---

## 🔑 PARTIE 3 : CONNEXION RAILWAY (1 minute)

### Étape 3.1 : Créer un Compte

1. Exécutez :
```bash
railway login
```

2. Votre navigateur s'ouvre automatiquement
3. Choisissez :
   - **"Sign up with Email"** (recommandé)
   - Ou GitHub/Google
4. Complétez l'inscription
5. Retournez au terminal - vous êtes connecté !

### Étape 3.2 : Vérifier la Connexion

```bash
railway whoami
# Affiche votre email
```

---

## 📦 PARTIE 4 : DÉPLOIEMENT (5 minutes)

### Étape 4.1 : Aller dans Votre Projet

```bash
cd /chemin/vers/music-store
# Exemple Windows : cd C:\Users\VotreNom\music-store
# Exemple Mac/Linux : cd ~/music-store
```

### Étape 4.2 : Initialiser Railway

```bash
railway init
```

**Questions posées :**

1. **"Enter project name"**
   → Tapez : `music-store`

2. **"Choose a starter template"**
   → Tapez : `Empty Project` (ou appuyez sur Entrée)

### Étape 4.3 : Créer le Fichier Railway Config

Créez `railway.json` à la racine :

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.backend"
  },
  "deploy": {
    "startCommand": "uvicorn server:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/products",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Étape 4.4 : Déployer le Backend

```bash
railway up
```

**Attendez 3-5 minutes...**

Vous verrez :
```
✓ Build successful
✓ Deployment successful
✓ Service is live at: https://music-store-production-xxxx.up.railway.app
```

**🎉 Votre backend est en ligne !**

---

## 🗄️ PARTIE 5 : AJOUTER MONGODB (2 minutes)

### Étape 5.1 : Via Dashboard Web

1. Ouvrez Railway Dashboard :
```bash
railway open
```

2. Dans votre projet, cliquez **"+ New"**
3. Sélectionnez **"Database"** → **"Add MongoDB"**
4. Railway crée et connecte automatiquement MongoDB !

### Étape 5.2 : Via CLI

```bash
railway add
# Choisissez "MongoDB"
```

**Railway configure automatiquement la variable `MONGO_URL` !**

---

## ⚙️ PARTIE 6 : CONFIGURER LES VARIABLES (3 minutes)

### Étape 6.1 : Via Dashboard

1. Dans Railway Dashboard (`railway open`)
2. Cliquez sur votre service **backend**
3. Onglet **"Variables"**
4. Cliquez **"+ New Variable"**

Ajoutez :

```
JWT_SECRET = votre-secret-ultra-securise-production-123456789
STRIPE_API_KEY = sk_live_votre_vraie_cle_stripe
SENDGRID_API_KEY = votre_cle_sendgrid
SENDER_EMAIL = contact@votre-domaine.com
CORS_ORIGINS = *
```

### Étape 6.2 : Via CLI

```bash
railway variables set JWT_SECRET="votre-secret-123456"
railway variables set STRIPE_API_KEY="sk_live_votre_cle"
railway variables set SENDGRID_API_KEY="votre_cle"
railway variables set SENDER_EMAIL="contact@votre-domaine.com"
railway variables set CORS_ORIGINS="*"
```

### Étape 6.3 : Redéployer

```bash
railway up
```

---

## 👤 PARTIE 7 : CRÉER LE COMPTE ADMIN (2 minutes)

### Option A : Via Railway Shell

```bash
railway run python backend/create_admin.py
```

**Suivez les instructions à l'écran :**
- Email : admin@votre-domaine.com
- Prénom : Admin
- Nom : MusicStore
- Mot de passe : (minimum 8 caractères)

### Option B : Via Dashboard

1. Railway Dashboard → Votre service
2. Onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. **"View Logs"**
5. Cherchez une console ou shell

---

## 🌐 PARTIE 8 : DÉPLOYER LE FRONTEND (5 minutes)

### Étape 8.1 : Créer un Nouveau Service

```bash
# Dans le même projet
railway service create frontend
```

### Étape 8.2 : Créer railway.json pour Frontend

Dans `frontend/railway.json` :

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.frontend"
  },
  "deploy": {
    "startCommand": "nginx -g 'daemon off;'",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Étape 8.3 : Configurer Variable Frontend

```bash
# Récupérer l'URL du backend
railway status

# Ajouter la variable
railway variables set REACT_APP_BACKEND_URL="https://votre-backend-url.railway.app"
```

### Étape 8.4 : Déployer Frontend

```bash
cd frontend
railway up
```

---

## ✅ PARTIE 9 : VÉRIFICATION FINALE (2 minutes)

### Étape 9.1 : Obtenir les URLs

```bash
railway status
```

Vous aurez :
- **Backend URL** : `https://music-store-backend-xxxx.railway.app`
- **Frontend URL** : `https://music-store-frontend-xxxx.railway.app`

### Étape 9.2 : Tester

1. **Ouvrez le frontend dans votre navigateur**
   ```bash
   railway open
   ```

2. **Testez le backend**
   ```bash
   curl https://votre-backend-url.railway.app/api/products
   ```

3. **Connectez-vous en tant qu'admin**
   - Email : admin@votre-domaine.com
   - Mot de passe : celui que vous avez créé

4. **Allez sur** `/admin` pour accéder au back office

---

## 🎉 FÉLICITATIONS !

**Votre site est maintenant en ligne !**

✅ Backend déployé
✅ Frontend déployé
✅ MongoDB connectée
✅ Variables configurées
✅ Admin créé
✅ SSL/HTTPS automatique

---

## 🔄 MISES À JOUR FUTURES

Pour mettre à jour votre site :

```bash
cd music-store

# Modifier votre code
# ...

# Redéployer
railway up
```

**C'est aussi simple que ça !**

---

## 💰 TARIFICATION

**Plan Starter (inclus) :**
- $5 de crédits gratuits
- Parfait pour tester

**Plan Developer :**
- $5/mois
- 500h d'exécution
- Parfait pour production

**Vous voyez les coûts en temps réel dans le Dashboard**

---

## 🆘 COMMANDES UTILES

```bash
# Voir les logs
railway logs

# Ouvrir le dashboard
railway open

# Voir le statut
railway status

# Variables
railway variables

# Shell interactif
railway run bash

# Aide
railway help
```

---

## 📞 SUPPORT

- **Documentation** : docs.railway.app
- **Discord** : discord.gg/railway
- **Twitter** : @Railway

---

## 🎯 RÉCAPITULATIF

1. ✅ Installer Railway CLI
2. ✅ `railway login`
3. ✅ `railway init`
4. ✅ `railway up` (backend)
5. ✅ Ajouter MongoDB
6. ✅ Configurer variables
7. ✅ Créer admin
8. ✅ Déployer frontend
9. ✅ Site en ligne !

**Temps total : ~15 minutes**

---

**Votre site e-commerce musical est maintenant professionnel et en production ! 🎵🚀**
