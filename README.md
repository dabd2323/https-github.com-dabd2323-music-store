# 🎵 MusicStore - Plateforme E-Commerce Musicale

Site e-commerce complet pour la vente d'albums et de singles musicaux avec paiements en ligne, gestion de produits et envoi de newsletters.

## ✨ Fonctionnalités

### Pour les Clients
- 🎵 Catalogue de musique (albums et singles)
- ▶️ Lecteur audio intégré (preview avant achat)
- 🛒 Panier d'achat
- 💳 Paiement sécurisé (Stripe + PayPal)
- 📥 Téléchargement instantané après achat
- 👤 Compte utilisateur avec historique des achats
- 🔐 Authentification JWT avec vérification email

### Pour les Administrateurs
- 📊 Dashboard d'administration complet
- ➕ Ajout/modification/suppression de produits
- 📤 Upload de fichiers (images + audio) en local
- 🎼 Support multi-pistes pour les albums
- 👥 Gestion des utilisateurs
- 📧 Envoi de newsletters (SendGrid)
- 📦 Gestion des commandes

## 🛠️ Technologies

**Backend:**
- FastAPI (Python)
- MongoDB
- JWT Authentication
- Stripe + PayPal (paiements)
- SendGrid (emails)

**Frontend:**
- React 18
- Tailwind CSS
- Shadcn/UI Components
- Axios

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)

## 📋 Prérequis

- Docker et Docker Compose
- Node.js 18+ (pour développement local)
- Python 3.11+ (pour développement local)
- Compte AWS (pour déploiement)

## 🚀 Démarrage Rapide

### Option 1 : Avec Docker (Recommandé)

```bash
# Cloner le projet
git clone https://github.com/votre-username/music-store.git
cd music-store

# Créer le fichier .env
cp .env.example .env
# Éditez .env avec vos valeurs

# Démarrer l'application
docker-compose up -d

# Créer le compte admin
docker exec -it music_store_backend python3 create_admin.py

# Ouvrir dans le navigateur
open http://localhost
```

### Option 2 : Développement Local

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
yarn install
yarn start
```

## 📦 Déploiement sur AWS

### Méthode Simple (Script Automatique)

```bash
# 1. Créez une instance EC2 sur AWS
# 2. Configurez les groupes de sécurité (ports 22, 80, 443)
# 3. Téléchargez votre clé PEM

# 4. Déployez avec le script
./deploy-aws.sh [IP_EC2] [CHEMIN_CLE_PEM]

# Exemple:
./deploy-aws.sh 54.123.45.67 ~/.ssh/my-key.pem
```

### Guide Complet

Consultez **[AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)** pour :
- Configuration EC2 détaillée
- Déploiement Elastic Beanstalk
- Configuration S3 pour le stockage
- SSL/HTTPS avec Let's Encrypt
- Monitoring et maintenance

## 🔑 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
# MongoDB
MONGO_URL=mongodb://mongodb:27017
DB_NAME=music_store

# JWT
JWT_SECRET=votre-secret-ultra-securise-123456

# Stripe
STRIPE_API_KEY=sk_live_votre_cle

# PayPal (optionnel)
PAYPAL_CLIENT_ID=votre_client_id
PAYPAL_SECRET=votre_secret

# SendGrid (optionnel)
SENDGRID_API_KEY=votre_cle_sendgrid
SENDER_EMAIL=contact@votre-domaine.com

# Frontend
REACT_APP_BACKEND_URL=http://votre-domaine.com
```

## 📁 Structure du Projet

```
music-store/
├── backend/                # Backend FastAPI
│   ├── server.py          # API principale
│   ├── requirements.txt   # Dépendances Python
│   └── .env              # Variables d'environnement backend
│
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── pages/        # Pages de l'application
│   │   ├── components/   # Composants réutilisables
│   │   └── App.js        # Application principale
│   ├── package.json      # Dépendances Node.js
│   └── .env             # Variables d'environnement frontend
│
├── uploads/              # Fichiers uploadés (images, audio)
│   ├── images/
│   ├── audio_previews/
│   └── audio_files/
│
├── docker-compose.yml    # Configuration Docker
├── Dockerfile.backend    # Image Docker backend
├── Dockerfile.frontend   # Image Docker frontend
├── nginx.conf           # Configuration Nginx
├── deploy-aws.sh        # Script de déploiement AWS
└── create_admin.py      # Script création admin
```

## 📚 Documentation

- **[AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)** - Guide de déploiement AWS complet
- **[CODE_SOURCE_GUIDE.md](./CODE_SOURCE_GUIDE.md)** - Comment récupérer le code source

## 💰 Estimation des Coûts AWS

**Configuration de départ** (~$40-50/mois):
- EC2 t3.medium : ~$30/mois
- Stockage EBS 30GB : ~$3/mois
- Transfert données : ~$5-10/mois

**Configuration production** (~$140-160/mois):
- EC2 t3.large : ~$60/mois
- Load Balancer : ~$16/mois
- MongoDB Atlas : ~$57/mois
- S3 + CloudFront : ~$10-20/mois

---

**Version:** 1.0.0  
**Dernière mise à jour:** Janvier 2025
