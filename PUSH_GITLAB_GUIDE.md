# 🦊 Guide : Pousser Votre Code sur GitLab

GitLab est une excellente alternative à GitHub avec CI/CD intégré !

---

## 📋 Étape 1 : Créer un Projet GitLab

1. **Allez sur GitLab.com**
   👉 [gitlab.com/projects/new](https://gitlab.com/projects/new)
   
2. **Créez le projet**
   ```
   Project name: music-store
   Project URL: gitlab.com/dabd2323/music-store
   Visibility: Private (recommandé)
   
   ❌ NE COCHEZ PAS "Initialize repository with a README"
   ```

3. **Cliquez sur** "Create project"

4. **Copiez l'URL du projet**
   ```
   https://gitlab.com/dabd2323/music-store.git
   ```

---

## 💻 Étape 2 : Configurer Git et Pousser

### Commandes à Exécuter

```bash
cd /app

# Ajouter GitLab comme remote
git remote add origin https://gitlab.com/dabd2323/music-store.git

# Vérifier
git remote -v

# Pousser le code
git push -u origin main
```

### Authentification

GitLab vous demandera :
- **Username:** `dabd2323`
- **Password:** Utilisez un **Personal Access Token** (voir ci-dessous)

---

## 🔑 Étape 3 : Créer un Personal Access Token GitLab

GitLab nécessite un token pour push :

1. **Allez sur**
   👉 [gitlab.com/-/profile/personal_access_tokens](https://gitlab.com/-/profile/personal_access_tokens)

2. **Créez le token**
   ```
   Token name: Music Store Deploy
   Expiration: Dans 1 an
   
   ☑️ Cochez "write_repository"
   ☑️ Cochez "read_repository"
   ```

3. **Cliquez sur** "Create personal access token"

4. **COPIEZ LE TOKEN**
   - Format : `glpat-xxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ Sauvegardez-le, vous ne le reverrez plus !

5. **Utilisez-le comme password** lors du push

---

## ✅ Étape 4 : Push Complet

```bash
cd /app

# Configurer le remote GitLab
git remote add origin https://gitlab.com/dabd2323/music-store.git

# Push avec le token
git push -u origin main
```

**Quand demandé :**
- Username: `dabd2323`
- Password: `glpat-xxxxxxxxxxxxxxxxxxxxx` (votre token)

---

## 🚀 Étape 5 : Déploiement depuis GitLab

GitLab a un excellent CI/CD intégré !

### Option A : Déployer sur DigitalOcean depuis GitLab

DigitalOcean peut aussi se connecter à GitLab :

1. **Créez votre app sur DigitalOcean**
   - Create → Apps
   - Choisissez **GitLab** au lieu de GitHub
   - Autorisez l'accès
   - Sélectionnez `dabd2323/music-store`
   - Auto-deploy activé

### Option B : Utiliser GitLab CI/CD

GitLab a son propre CI/CD (gratuit, illimité pour projets privés) !

Créez `.gitlab-ci.yml` à la racine :

```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_DRIVER: overlay2

# Build Backend
build-backend:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t music-store-backend -f Dockerfile.backend .
  only:
    - main

# Build Frontend
build-frontend:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t music-store-frontend -f Dockerfile.frontend .
  only:
    - main

# Deploy to server
deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
  script:
    - echo "Deploying to server..."
    - ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "cd /app/music-store && git pull && docker-compose up -d --build"
  only:
    - main
```

### Option C : Déployer sur un VPS avec GitLab CI

1. **Configurez les variables dans GitLab**
   - Settings → CI/CD → Variables
   - Ajoutez :
     - `SSH_USER`: root
     - `SSH_HOST`: IP de votre serveur
     - `SSH_PRIVATE_KEY`: Votre clé SSH

2. **Push et c'est automatique !**

---

## 🎯 Déploiement sur Hostinger/AWS depuis GitLab

### Avec Hostinger VPS

```bash
# Sur votre VPS Hostinger
ssh root@VOTRE_IP_VPS

# Cloner depuis GitLab
git clone https://gitlab.com/dabd2323/music-store.git
cd music-store

# Configurer .env
cp .env.example .env
nano .env

# Démarrer
docker-compose up -d
```

### Mises à jour automatiques

```bash
# Sur le VPS, créez un webhook
cd /app/music-store

# Créez un script de mise à jour
cat > update.sh << 'EOF'
#!/bin/bash
cd /app/music-store
git pull origin main
docker-compose up -d --build
EOF

chmod +x update.sh

# Configurez le webhook dans GitLab
# Settings → Webhooks → Add webhook
```

---

## 🔄 Workflow GitLab vs GitHub

| Fonctionnalité | GitLab | GitHub |
|----------------|--------|--------|
| **CI/CD Gratuit** | ✅ Illimité | ⚠️ 2000 min/mois |
| **Private Repos** | ✅ Gratuit | ✅ Gratuit |
| **Container Registry** | ✅ Gratuit | ⚠️ Payant |
| **Auto DevOps** | ✅ Intégré | ❌ |
| **Deploy to DO** | ✅ Possible | ✅ Natif |

---

## 💡 Avantages GitLab

✅ **CI/CD gratuit illimité**
✅ **Container Registry intégré**
✅ **Auto DevOps**
✅ **Issues, Wiki, Planning intégrés**
✅ **Pas de limite sur projets privés**

---

## 📝 Commandes Résumées

```bash
# 1. Supprimer l'ancien remote GitHub
cd /app
git remote remove origin

# 2. Ajouter GitLab
git remote add origin https://gitlab.com/dabd2323/music-store.git

# 3. Push
git push -u origin main
# Username: dabd2323
# Password: glpat-votre-token
```

---

## ✅ Vérification

Après le push, vérifiez sur :
👉 **[gitlab.com/dabd2323/music-store](https://gitlab.com/dabd2323/music-store)**

---

## 🚀 Prochaines Étapes

1. **Push sur GitLab** ✓
2. **Déployer** :
   - Option A : DigitalOcean (connecté à GitLab)
   - Option B : Hostinger VPS (clone GitLab)
   - Option C : AWS EC2 (clone GitLab)
   - Option D : GitLab CI/CD → Auto-deploy

---

## 🆘 Problèmes Courants

### "Authentication failed"
- Utilisez un Personal Access Token (glpat-xxx)
- Pas votre mot de passe GitLab

### "Permission denied"
- Vérifiez que le token a `write_repository`

### "Repository not found"
- Vérifiez l'URL : `https://gitlab.com/dabd2323/music-store.git`

---

Besoin d'aide ? Dites-moi où vous en êtes ! 🦊
