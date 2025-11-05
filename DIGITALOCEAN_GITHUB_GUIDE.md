# Guide de Déploiement DigitalOcean via GitHub

## 🎯 Vue d'Ensemble

Déployez votre site e-commerce musical sur DigitalOcean directement depuis GitHub avec mise à jour automatique à chaque push.

**2 Options disponibles :**
1. **App Platform** (Recommandé) - Déploiement automatique, le plus simple
2. **Droplet** (VPS) - Plus de contrôle, configuration manuelle

---

## 🚀 Option 1 : DigitalOcean App Platform (Recommandé)

### Pourquoi App Platform ?

✅ Déploiement automatique depuis GitHub  
✅ Mise à jour auto à chaque push  
✅ SSL/HTTPS inclus automatiquement  
✅ Scaling automatique  
✅ Base de données MongoDB managée  
✅ Pas de gestion serveur  

### Prix Estimé

- **App (Backend + Frontend)** : $12/mois (Basic)
- **MongoDB Database** : $15/mois (starter)
- **Total** : ~$27/mois

---

## 📋 Étape 1 : Préparer le Repository GitHub

### A. Pousser votre Code sur GitHub

```bash
# Dans votre projet local
cd /chemin/vers/music-store

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Music Store E-Commerce"

# Créer un repository sur GitHub.com
# Puis le lier :
git remote add origin https://github.com/votre-username/music-store.git

# Pousser le code
git branch -M main
git push -u origin main
```

### B. Créer les Fichiers de Configuration DigitalOcean

Créez `.do/app.yaml` à la racine du projet :

```yaml
name: music-store
region: fra

# Base de données MongoDB
databases:
  - name: music-store-db
    engine: MONGODB
    version: "6"
    size: db-s-1vcpu-1gb

# Backend FastAPI
services:
  - name: backend
    github:
      repo: votre-username/music-store
      branch: main
      deploy_on_push: true
    source_dir: /backend
    dockerfile_path: Dockerfile.backend
    
    envs:
      - key: MONGO_URL
        scope: RUN_AND_BUILD_TIME
        value: ${music-store-db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_AND_BUILD_TIME
        type: SECRET
        value: "votre-secret-jwt-production"
      - key: STRIPE_API_KEY
        scope: RUN_AND_BUILD_TIME
        type: SECRET
        value: "sk_live_votre_cle"
      - key: SENDGRID_API_KEY
        scope: RUN_AND_BUILD_TIME
        type: SECRET
        value: "votre_cle_sendgrid"
      - key: SENDER_EMAIL
        scope: RUN_AND_BUILD_TIME
        value: "contact@votre-domaine.com"
      - key: CORS_ORIGINS
        scope: RUN_AND_BUILD_TIME
        value: "*"
    
    http_port: 8001
    health_check:
      http_path: /api/products
    
    instance_count: 1
    instance_size_slug: basic-xs

# Frontend React
static_sites:
  - name: frontend
    github:
      repo: votre-username/music-store
      branch: main
      deploy_on_push: true
    source_dir: /frontend
    dockerfile_path: Dockerfile.frontend
    
    envs:
      - key: REACT_APP_BACKEND_URL
        scope: BUILD_TIME
        value: ${backend.PUBLIC_URL}
    
    output_dir: /build
    
    routes:
      - path: /
```

### C. Adaptez les Dockerfiles pour DigitalOcean

**Dockerfile.backend** (déjà créé, vérifiez qu'il contient) :
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/uploads/images /app/uploads/audio_previews /app/uploads/audio_files

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Dockerfile.frontend** (déjà créé) :
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### D. Créer `.gitignore`

```
# Dependencies
node_modules/
__pycache__/
*.pyc

# Environment
.env
.env.local

# Build
build/
dist/

# Uploads (ne pas commiter les fichiers uploadés)
uploads/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

---

## 📦 Étape 2 : Déployer sur DigitalOcean App Platform

### A. Via Interface Web (Plus Simple)

1. **Créer un compte DigitalOcean**
   - Allez sur [digitalocean.com](https://www.digitalocean.com)
   - Inscrivez-vous (100$ de crédits gratuits pendant 60 jours avec le code promo)

2. **Créer une nouvelle App**
   - Cliquez sur **Create → Apps**
   - Choisissez **GitHub** comme source
   - Autorisez DigitalOcean à accéder à GitHub
   - Sélectionnez votre repository `music-store`
   - Choisissez la branche `main`
   - Cochez **Autodeploy** (déploiement auto à chaque push)

3. **Configurer les Services**
   
   **Backend :**
   - Type : Web Service
   - Source Directory : `/backend`
   - Build Command : (Docker auto-détecté)
   - Run Command : `uvicorn server:app --host 0.0.0.0 --port 8001`
   - Port : 8001

   **Frontend :**
   - Type : Static Site
   - Source Directory : `/frontend`
   - Build Command : `yarn install && yarn build`
   - Output Directory : `/build`

4. **Ajouter la Base de Données**
   - Cliquez sur **Add Resource → Database**
   - Sélectionnez **MongoDB**
   - Choisissez le plan : **Basic (1GB RAM, $15/mois)**
   - La variable `${music-store-db.DATABASE_URL}` sera auto-injectée

5. **Configurer les Variables d'Environnement**
   
   Pour le **Backend** :
   ```
   MONGO_URL = ${music-store-db.DATABASE_URL}
   JWT_SECRET = votre-secret-ultra-securise-123456789
   STRIPE_API_KEY = sk_live_votre_cle_stripe
   SENDGRID_API_KEY = votre_cle_sendgrid
   SENDER_EMAIL = contact@votre-domaine.com
   CORS_ORIGINS = *
   ```
   
   Pour le **Frontend** :
   ```
   REACT_APP_BACKEND_URL = ${backend.PUBLIC_URL}
   ```

6. **Lancer le Déploiement**
   - Cliquez sur **Create Resources**
   - Attendez 5-10 minutes
   - Votre app sera accessible sur une URL : `https://music-store-xxxxx.ondigitalocean.app`

### B. Via CLI doctl (Pour les Développeurs)

```bash
# Installer doctl
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf doctl-*.tar.gz
sudo mv doctl /usr/local/bin

# Authentifier
doctl auth init

# Créer l'app depuis le fichier de config
doctl apps create --spec .do/app.yaml

# Voir le statut
doctl apps list

# Voir les logs
doctl apps logs YOUR_APP_ID
```

---

## 🔄 Étape 3 : Mise à Jour Automatique

### Workflow Automatique

1. Vous modifiez votre code localement
2. Vous faites un commit et push :
   ```bash
   git add .
   git commit -m "Ajout de nouvelles fonctionnalités"
   git push origin main
   ```
3. DigitalOcean détecte automatiquement le push
4. Rebuild et redéploiement automatique (~5 min)
5. Votre site est mis à jour !

### Désactiver l'Auto-Deploy (si besoin)

Dans les paramètres de l'App :
- Settings → General → **Autodeploy** : Off
- Vous devrez déclencher les déploiements manuellement

---

## 🗄️ Étape 4 : Configurer MongoDB Atlas (Alternative)

Si vous préférez MongoDB Atlas au lieu de la DB DigitalOcean :

1. **Créer un cluster sur [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)**
2. **Obtenir la connection string**
3. **Dans DigitalOcean App Platform :**
   - Supprimez la database resource
   - Modifiez `MONGO_URL` avec votre connection string Atlas

---

## 🌐 Étape 5 : Configurer un Domaine Personnalisé

1. **Dans DigitalOcean App Platform**
   - Settings → Domains
   - Add Domain : `votre-domaine.com`
   - DigitalOcean vous donnera des enregistrements DNS

2. **Chez votre Registrar (ex: Hostinger, OVH)**
   - Créez un enregistrement CNAME :
   - `www` → `music-store-xxxxx.ondigitalocean.app`
   - `@` → Utilisez l'adresse fournie par DigitalOcean

3. **SSL/HTTPS**
   - Automatique ! DigitalOcean gère Let's Encrypt

---

## 📊 Étape 6 : Monitoring et Logs

### Voir les Logs

**Via Interface Web :**
- Apps → Votre App → Runtime Logs
- Sélectionnez backend ou frontend

**Via CLI :**
```bash
# Logs backend
doctl apps logs YOUR_APP_ID --type RUN --component backend

# Logs frontend
doctl apps logs YOUR_APP_ID --type BUILD --component frontend
```

### Monitoring

- **Insights** : CPU, RAM, requêtes (intégré)
- **Alertes** : Configurez des alertes email/Slack
- **Metrics** : Temps de réponse, erreurs 5xx

---

## 💾 Étape 7 : Gestion du Stockage de Fichiers

### Problème

Les fichiers uploadés dans `/app/uploads` seront perdus à chaque redéploiement.

### Solution : Spaces (S3 Compatible)

**DigitalOcean Spaces** (équivalent S3, $5/mois pour 250GB) :

1. **Créer un Space**
   - Create → Spaces Object Storage
   - Région : Frankfurt (FRA)
   - Nom : `music-store-uploads`

2. **Générer les clés API**
   - Settings → API → Spaces Keys
   - Créez une nouvelle clé
   - Notez : Access Key et Secret Key

3. **Modifier le code Backend**

Installez boto3 :
```bash
pip install boto3
```

Modifiez `/backend/server.py` :
```python
import boto3
from botocore.client import Config

# Configuration Spaces
spaces = boto3.client(
    's3',
    region_name='fra1',
    endpoint_url='https://fra1.digitaloceanspaces.com',
    aws_access_key_id=os.getenv('SPACES_KEY'),
    aws_secret_access_key=os.getenv('SPACES_SECRET')
)

BUCKET_NAME = 'music-store-uploads'

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin: User = Depends(get_admin_user)):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"images/{uuid.uuid4()}.{file_extension}"
    
    # Upload vers Spaces
    spaces.upload_fileobj(
        file.file,
        BUCKET_NAME,
        unique_filename,
        ExtraArgs={'ACL': 'public-read'}
    )
    
    return {"url": f"https://{BUCKET_NAME}.fra1.digitaloceanspaces.com/{unique_filename}"}
```

4. **Ajouter les variables d'environnement**
```
SPACES_KEY = votre_access_key
SPACES_SECRET = votre_secret_key
```

---

## 🔐 Étape 8 : Créer le Compte Admin

### Via Console (Interface Web)

1. Apps → Votre App → Console
2. Sélectionnez le composant **backend**
3. Cliquez sur **Launch Console**
4. Exécutez :
```bash
python3 create_admin.py
```

### Via doctl

```bash
doctl apps exec YOUR_APP_ID --component backend -- python3 create_admin.py
```

---

## 💰 Coûts Mensuels DigitalOcean

### Configuration Starter

| Service | Prix |
|---------|------|
| App Platform Basic | $12/mois |
| MongoDB 1GB | $15/mois |
| Spaces 250GB | $5/mois |
| **Total** | **$32/mois** |

### Configuration Production

| Service | Prix |
|---------|------|
| App Platform Professional | $24/mois |
| MongoDB 4GB | $60/mois |
| Spaces 250GB | $5/mois |
| Load Balancer | $12/mois |
| **Total** | **$101/mois** |

### Crédits Gratuits

- **Nouveau compte** : $200 crédits pendant 60 jours
- Parfait pour tester gratuitement !

---

## 🎯 GitHub Actions (CI/CD Avancé)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to DigitalOcean
        uses: digitalocean/app_action@v1
        with:
          app_name: music-store
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      
      - name: Wait for deployment
        run: sleep 300
      
      - name: Test deployment
        run: |
          curl -f https://music-store-xxxxx.ondigitalocean.app/api/products || exit 1
```

---

## ✅ Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Fichiers Docker créés
- [ ] App créée sur DigitalOcean
- [ ] MongoDB configurée
- [ ] Variables d'environnement définies
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] SSL activé (automatique)
- [ ] Compte admin créé
- [ ] Spaces configuré pour uploads
- [ ] Tests de paiement Stripe
- [ ] SendGrid configuré pour emails

---

## 🆘 Dépannage

### Build Failed

```bash
# Voir les logs de build
doctl apps logs YOUR_APP_ID --type BUILD
```

### App ne démarre pas

- Vérifiez les variables d'environnement
- Vérifiez la connexion MongoDB
- Consultez les Runtime Logs

### Fichiers uploadés perdus

- Migrez vers Spaces (voir Étape 7)

---

## 📞 Support DigitalOcean

- **Documentation** : docs.digitalocean.com
- **Community** : digitalocean.com/community
- **Support Ticket** : cloud.digitalocean.com/support

---

## 🎉 Résumé

✅ Push sur GitHub → Déploiement automatique  
✅ SSL/HTTPS inclus  
✅ Scaling automatique  
✅ Monitoring intégré  
✅ ~$32/mois pour commencer  
✅ 100% managé, pas de serveur à gérer  

Votre site e-commerce est maintenant professionnel et prêt à scaler ! 🚀