# Guide de Déploiement Hostinger - MusicStore E-Commerce

## 🎯 Résumé Rapide

**Oui, vous pouvez héberger sur Hostinger !**

**Solution recommandée :** VPS Hostinger (car votre app nécessite Docker + MongoDB + configurations personnalisées)

---

## 📋 Prérequis Hostinger

### Type d'Hébergement Nécessaire

❌ **Hébergement Partagé** - Ne fonctionnera PAS (pas de Docker, pas de contrôle serveur)
✅ **VPS Hostinger** - Fonctionne parfaitement (contrôle total du serveur)
✅ **Cloud Hosting** - Alternative possible

### Plan VPS Recommandé

**VPS 2 (Recommandé pour démarrer)**
- 2 vCPU
- 4 GB RAM
- 100 GB SSD
- Prix : ~€9.99/mois
- Parfait pour commencer

**VPS 4 (Pour production avec trafic)**
- 4 vCPU
- 8 GB RAM
- 200 GB SSD
- Prix : ~€19.99/mois

---

## 🚀 Méthode 1 : Déploiement VPS Hostinger (Recommandé)

### Étape 1 : Commander un VPS Hostinger

1. Allez sur **[Hostinger.fr](https://www.hostinger.fr)**
2. Sélectionnez **VPS Hosting**
3. Choisissez le plan **VPS 2** ou supérieur
4. Sélectionnez **Ubuntu 22.04** comme système d'exploitation
5. Complétez l'achat

### Étape 2 : Accéder à votre VPS

Après l'achat, vous recevrez :
- **Adresse IP du serveur** (ex: 154.12.34.56)
- **Identifiants SSH** (root / mot de passe)
- **Accès au panel Hostinger**

```bash
# Connectez-vous à votre VPS via SSH
ssh root@VOTRE_IP_VPS

# Première connexion : changez le mot de passe
passwd
```

### Étape 3 : Configurer le Serveur

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
apt install -y docker.io docker-compose

# Installer Git
apt install -y git

# Créer un utilisateur non-root (optionnel mais recommandé)
adduser musicstore
usermod -aG sudo musicstore
usermod -aG docker musicstore

# Basculer vers le nouvel utilisateur
su - musicstore
```

### Étape 4 : Déployer l'Application

```bash
# Cloner votre projet
git clone https://github.com/votre-username/music-store.git
cd music-store

# Créer le fichier .env
nano .env
```

**Copiez cette configuration dans .env :**
```env
MONGO_URL=mongodb://mongodb:27017
DB_NAME=music_store
CORS_ORIGINS=*
JWT_SECRET=changez-moi-secret-unique-production-987654321
STRIPE_API_KEY=sk_live_votre_cle_stripe
SENDGRID_API_KEY=votre_cle_sendgrid
SENDER_EMAIL=contact@votre-domaine.com
REACT_APP_BACKEND_URL=http://VOTRE_IP_VPS
```

```bash
# Démarrer l'application
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### Étape 5 : Créer le Compte Admin

```bash
# Créer l'admin
docker exec -it music_store_backend python3 create_admin.py
```

### Étape 6 : Configurer le Pare-feu

```bash
# Autoriser les ports nécessaires
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Étape 7 : Configurer un Nom de Domaine (Optionnel)

**Option A : Domaine Hostinger**
1. Dans le panel Hostinger, allez dans **Domains**
2. Ajoutez un enregistrement A pointant vers l'IP de votre VPS
3. Attendez la propagation DNS (1-24h)

**Option B : Domaine externe**
1. Chez votre registrar, créez un enregistrement A
2. Pointez vers l'IP de votre VPS

### Étape 8 : Installer SSL (HTTPS)

```bash
# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL (remplacez par votre domaine)
certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Le certificat se renouvelle automatiquement
```

---

## 🔧 Méthode 2 : Via Panel hPanel Hostinger

Hostinger propose un panel de gestion simplifié (hPanel), mais pour Docker, vous devrez utiliser le terminal SSH.

### Accéder au Terminal SSH via hPanel

1. Connectez-vous à **[hpanel.hostinger.com](https://hpanel.hostinger.com)**
2. Sélectionnez votre **VPS**
3. Cliquez sur **Browser Terminal** ou **SSH Access**
4. Suivez les étapes de la Méthode 1

---

## 💰 Comparaison des Coûts : Hostinger vs AWS

| Critère | Hostinger VPS | AWS EC2 |
|---------|---------------|---------|
| **Prix départ** | ~€9.99/mois | ~$40-50/mois |
| **Facilité** | ⭐⭐⭐⭐⭐ Plus simple | ⭐⭐⭐ Plus technique |
| **Support FR** | ✅ Chat 24/7 en français | ❌ Anglais uniquement |
| **Panel Web** | ✅ hPanel intuitif | ⚠️ AWS Console complexe |
| **Scalabilité** | ⭐⭐⭐ Limitée | ⭐⭐⭐⭐⭐ Excellente |
| **Performance** | ⭐⭐⭐⭐ Bonne | ⭐⭐⭐⭐⭐ Excellente |

### Recommandation

- **Hostinger VPS** : Idéal pour démarrer, budget limité, support en français
- **AWS EC2** : Pour scalabilité, trafic élevé, fonctionnalités avancées

---

## 📊 Script de Déploiement Automatique Hostinger

Créez un fichier `deploy-hostinger.sh` :

```bash
#!/bin/bash

# Script de déploiement Hostinger VPS
# Usage: ./deploy-hostinger.sh [IP_VPS]

VPS_IP=$1

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./deploy-hostinger.sh [IP_VPS]"
    echo "Exemple: ./deploy-hostinger.sh 154.12.34.56"
    exit 1
fi

echo "🚀 Déploiement sur Hostinger VPS: $VPS_IP"

# Transférer les fichiers
echo "1/4 Transfert des fichiers..."
scp -r backend frontend docker-compose.yml Dockerfile.* nginx.conf .env.example root@$VPS_IP:/root/music-store/

# Installer Docker si nécessaire
echo "2/4 Installation de Docker..."
ssh root@$VPS_IP << 'ENDSSH'
    if ! command -v docker &> /dev/null; then
        apt update
        apt install -y docker.io docker-compose git
    fi
ENDSSH

# Démarrer l'application
echo "3/4 Démarrage de l'application..."
ssh root@$VPS_IP << 'ENDSSH'
    cd /root/music-store
    
    # Créer .env si inexistant
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "⚠️  Modifiez /root/music-store/.env avec vos vraies clés!"
    fi
    
    # Démarrer
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    
    echo "✅ Application démarrée!"
    docker-compose ps
ENDSSH

echo "4/4 Vérification..."
sleep 5

echo "
🎉 Déploiement terminé!

🌐 Accédez à votre application:
   http://$VPS_IP

🔑 Créez le compte admin:
   ssh root@$VPS_IP
   cd /root/music-store
   docker exec -it music_store_backend python3 create_admin.py

📝 Logs:
   ssh root@$VPS_IP
   cd /root/music-store
   docker-compose logs -f
"
```

Rendez-le exécutable et utilisez-le :

```bash
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh 154.12.34.56
```

---

## 🔐 Sécurité Hostinger VPS

### Checklist de Sécurité

```bash
# 1. Changer le mot de passe root
passwd

# 2. Créer un utilisateur non-root
adduser votre-username
usermod -aG sudo votre-username

# 3. Désactiver connexion root SSH
nano /etc/ssh/sshd_config
# Changez: PermitRootLogin no
systemctl restart sshd

# 4. Installer Fail2Ban (protection contre brute force)
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# 5. Configurer le pare-feu
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## 🛠️ Maintenance sur Hostinger

### Voir les Logs

```bash
ssh root@VOTRE_IP_VPS
cd /root/music-store
docker-compose logs -f backend
```

### Redémarrer l'Application

```bash
ssh root@VOTRE_IP_VPS
cd /root/music-store
docker-compose restart
```

### Mettre à Jour l'Application

```bash
ssh root@VOTRE_IP_VPS
cd /root/music-store
git pull
docker-compose up -d --build
```

### Sauvegarde MongoDB

```bash
# Créer une sauvegarde
docker exec music_store_mongodb mongodump --out /data/backup

# Télécharger localement
scp -r root@VOTRE_IP_VPS:/data/backup ./backup-$(date +%Y%m%d)
```

---

## 🆘 Problèmes Courants

### 1. "Cannot connect to Docker daemon"
```bash
# Redémarrer Docker
systemctl restart docker
```

### 2. "Port 80 already in use"
```bash
# Voir ce qui utilise le port
lsof -i :80
# Arrêter le service
systemctl stop apache2  # ou nginx
```

### 3. Application ne démarre pas
```bash
# Vérifier les logs
docker-compose logs
# Vérifier l'espace disque
df -h
```

---

## 📞 Support Hostinger

- **Chat 24/7** : Disponible dans hPanel
- **Email** : support@hostinger.com
- **Base de connaissances** : https://support.hostinger.fr

---

## ✅ Avantages Hostinger pour votre Projet

✅ **Prix abordable** : Dès €9.99/mois
✅ **Support français** : Chat 24/7
✅ **Interface simple** : hPanel facile à utiliser
✅ **Bon pour débuter** : Parfait pour MVP et premiers clients
✅ **Pas de surprise** : Prix fixe mensuel

---

## 🎯 Résumé des Étapes

1. **Commander VPS Hostinger** (VPS 2 ou plus)
2. **Se connecter en SSH**
3. **Installer Docker**
4. **Cloner votre projet**
5. **Configurer .env**
6. **Lancer docker-compose up -d**
7. **Créer l'admin**
8. **Configurer domaine + SSL**
9. **C'est prêt !** 🎉

Besoin d'aide ? Le support Hostinger est là 24/7 en français !
