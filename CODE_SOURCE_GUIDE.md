# Guide : Récupérer le Code Source depuis Emergent

## Méthode 1 : Via GitHub (Recommandé)

### Étape 1 : Connecter Emergent à GitHub

1. Dans l'interface Emergent, cliquez sur **Settings** ou **Deploy**
2. Cherchez l'option **"Connect to GitHub"** ou **"Push to GitHub"**
3. Autorisez Emergent à accéder à votre compte GitHub
4. Créez un nouveau repository (ex: `music-store-app`)
5. Emergent va automatiquement pusher tout votre code

### Étape 2 : Cloner sur votre machine

```bash
# Cloner le repository
git clone https://github.com/votre-username/music-store-app.git
cd music-store-app

# Vérifier que tout est là
ls -la
```

---

## Méthode 2 : Téléchargement Manuel

### Si GitHub n'est pas disponible

1. Dans l'interface Emergent, cherchez l'option **"Download"** ou **"Export"**
2. Téléchargez l'archive ZIP de votre projet
3. Décompressez l'archive sur votre machine

```bash
# Décompresser
unzip music-store-app.zip
cd music-store-app
```

---

## Méthode 3 : Via l'API Emergent (Avancé)

Si vous avez accès à l'API Emergent :

```bash
# Utilisez l'API pour télécharger les fichiers
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.emergent.ai/projects/YOUR_PROJECT_ID/export \
     -o music-store.zip
```

---

## Structure des Fichiers à Vérifier

Après récupération, vérifiez que vous avez :

```
music-store-app/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
└── AWS_DEPLOYMENT_GUIDE.md
```

---

## Ajouter les Fichiers Docker (si manquants)

Si les fichiers Docker ne sont pas inclus :

```bash
# Copier depuis /app (où je les ai créés)
cp /app/Dockerfile.backend ./
cp /app/Dockerfile.frontend ./
cp /app/docker-compose.yml ./
cp /app/nginx.conf ./
cp /app/AWS_DEPLOYMENT_GUIDE.md ./
cp /app/deploy-aws.sh ./
cp /app/create_admin.py ./backend/

# Rendre le script exécutable
chmod +x deploy-aws.sh
```

---

## Tester Localement avec Docker

Avant de déployer sur AWS, testez en local :

```bash
# Assurez-vous que Docker est installé
docker --version
docker-compose --version

# Créez le fichier .env
cp .env.example .env
# Éditez .env avec vos valeurs

# Démarrez l'application
docker-compose up -d

# Vérifiez que tout fonctionne
docker-compose ps
docker-compose logs -f

# Ouvrez http://localhost dans votre navigateur
```

---

## Préparer pour AWS

### 1. Modifiez le fichier .env

```bash
# Éditez .env
nano .env
```

Mettez à jour :
```env
MONGO_URL=mongodb://mongodb:27017
JWT_SECRET=changez-moi-en-production-secret-unique-123456789
STRIPE_API_KEY=sk_live_votre_vraie_cle_stripe
SENDGRID_API_KEY=votre_cle_sendgrid
SENDER_EMAIL=contact@votre-domaine.com
REACT_APP_BACKEND_URL=http://votre-ip-ec2-ou-domaine.com
```

### 2. Créez un repository Git (si pas déjà fait)

```bash
git init
git add .
git commit -m "Initial commit for AWS deployment"
git remote add origin https://github.com/votre-username/music-store.git
git push -u origin main
```

---

## Prochain Étape

Vous êtes prêt pour le déploiement AWS ! Consultez :
- `AWS_DEPLOYMENT_GUIDE.md` pour le guide complet
- `deploy-aws.sh` pour le déploiement automatisé

### Déploiement Rapide

```bash
# Une fois votre EC2 créée
./deploy-aws.sh [IP_EC2] [CHEMIN_CLE_PEM]

# Exemple
./deploy-aws.sh 54.123.45.67 ~/.ssh/my-ec2-key.pem
```

Bonne chance ! 🚀