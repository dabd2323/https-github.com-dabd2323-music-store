# Guide de Déploiement AWS - MusicStore E-Commerce

## 📋 Prérequis

1. Compte AWS actif
2. AWS CLI installé et configuré
3. Docker installé localement (pour tester)
4. Nom de domaine (optionnel mais recommandé)

---

## 🚀 Option 1 : Déploiement sur EC2 (Recommandé pour débuter)

### Étape 1 : Créer une instance EC2

1. **Connectez-vous à AWS Console**
2. **Allez dans EC2 > Instances > Launch Instance**
3. **Configuration recommandée :**
   - **Nom :** music-store-server
   - **AMI :** Ubuntu Server 22.04 LTS
   - **Type d'instance :** t3.medium (2 vCPU, 4 GB RAM) - minimum pour début
   - **Paire de clés :** Créez ou sélectionnez une clé SSH
   - **Stockage :** 30 GB gp3 (pour les fichiers uploadés)
   - **Groupe de sécurité :** Ouvrez les ports :
     - 22 (SSH)
     - 80 (HTTP)
     - 443 (HTTPS)
     - 8001 (Backend - temporaire pour test)

### Étape 2 : Installer Docker sur EC2

```bash
# Connectez-vous à votre instance
ssh -i votre-cle.pem ubuntu@votre-ip-ec2

# Mettez à jour le système
sudo apt update && sudo apt upgrade -y

# Installez Docker
sudo apt install -y docker.io docker-compose

# Ajoutez l'utilisateur au groupe docker
sudo usermod -aG docker ubuntu

# Redémarrez la session
exit
# Reconnectez-vous
ssh -i votre-cle.pem ubuntu@votre-ip-ec2
```

### Étape 3 : Déployer l'application

```bash
# Créez le répertoire de l'application
mkdir -p ~/music-store
cd ~/music-store

# Transférez vos fichiers (depuis votre machine locale)
# Option A : Via SCP
scp -i votre-cle.pem -r /chemin/vers/votre/app/* ubuntu@votre-ip-ec2:~/music-store/

# Option B : Via Git (si vous avez pushé sur GitHub)
git clone https://github.com/votre-username/music-store.git .

# Créez le fichier .env
nano .env
# Copiez le contenu de .env.example et modifiez les valeurs

# Démarrez les conteneurs
docker-compose up -d

# Vérifiez que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### Étape 4 : Configurez un nom de domaine (optionnel)

1. **Allez dans Route 53** ou utilisez votre registrar
2. **Créez un enregistrement A** pointant vers l'IP Elastic de votre EC2
3. **Installez Certbot pour SSL :**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d votre-domaine.com
```

### Étape 5 : Créer le compte admin

```bash
# Connectez-vous au conteneur backend
docker exec -it music_store_backend bash

# Utilisez Python pour créer un admin
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid

async def create_admin():
    client = AsyncIOMotorClient('mongodb://mongodb:27017')
    db = client['music_store']
    
    hashed = bcrypt.hashpw('VotreMotDePasse123!'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.users.insert_one({
        'id': str(uuid.uuid4()),
        'prenom': 'Admin',
        'nom': 'Principal',
        'email': 'admin@votre-domaine.com',
        'adresse': '123 Admin Street',
        'mot_de_passe': hashed,
        'email_verifie': True,
        'role': 'admin',
        'created_at': '2025-01-01T00:00:00+00:00'
    })
    print('Admin créé avec succès!')

asyncio.run(create_admin())
"

exit
```

---

## 🌐 Option 2 : Déploiement sur AWS Elastic Beanstalk (Plus simple)

### Prérequis
```bash
pip install awsebcli
```

### Étape 1 : Initialiser Elastic Beanstalk

```bash
cd /votre/projet
eb init -p docker music-store-app --region us-east-1
```

### Étape 2 : Créer l'environnement

```bash
eb create music-store-env \
  --instance-type t3.medium \
  --envvars MONGO_URL=mongodb://votre-mongodb-atlas-url,JWT_SECRET=votre-secret
```

### Étape 3 : Déployer

```bash
eb deploy
```

### Étape 4 : Ouvrir l'application

```bash
eb open
```

---

## 💾 Option 3 : Utiliser AWS S3 pour le stockage de fichiers

### Pourquoi S3 ?
- Stockage persistant (pas de perte lors des redéploiements)
- Scalable et fiable
- CDN intégré avec CloudFront
- Coût très bas (~$0.023/GB)

### Configuration S3

1. **Créez un bucket S3 :**
   - Nom : `music-store-uploads`
   - Région : `us-east-1` (ou votre région)
   - Désactivez "Block all public access"

2. **Configurez CORS :**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

3. **Créez un utilisateur IAM avec accès S3 :**
   - Service : IAM > Users > Create User
   - Attachez la policy : `AmazonS3FullAccess`
   - Notez l'Access Key et Secret Key

4. **Ajoutez à votre .env :**
```env
AWS_ACCESS_KEY_ID=votre_access_key
AWS_SECRET_ACCESS_KEY=votre_secret_key
AWS_S3_BUCKET=music-store-uploads
AWS_REGION=us-east-1
```

*Note : Je peux modifier votre code pour utiliser S3 si vous le souhaitez.*

---

## 📊 Monitoring et Maintenance

### Logs
```bash
# Voir les logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
```

### Sauvegarde MongoDB
```bash
# Créer une sauvegarde
docker exec music_store_mongodb mongodump --out /data/backup

# Copier la sauvegarde localement
docker cp music_store_mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

### Mise à jour de l'application
```bash
# Récupérez les derniers changements
git pull

# Reconstruisez et redémarrez
docker-compose up -d --build
```

---

## 💰 Estimation des coûts AWS

### Configuration minimale (début)
- **EC2 t3.medium :** ~$30/mois
- **Stockage EBS 30GB :** ~$3/mois
- **Transfert de données :** ~$5-10/mois
- **Total estimé :** ~$40-50/mois

### Configuration production
- **EC2 t3.large :** ~$60/mois
- **Load Balancer :** ~$16/mois
- **RDS MongoDB (Atlas) :** ~$57/mois
- **S3 + CloudFront :** ~$5-20/mois
- **Total estimé :** ~$140-160/mois

---

## 🔒 Sécurité - Checklist

- [ ] Changez le JWT_SECRET en production
- [ ] Utilisez des clés Stripe en mode live (pas test)
- [ ] Configurez un certificat SSL (Let's Encrypt)
- [ ] Limitez l'accès SSH aux IPs connues
- [ ] Activez les backups automatiques MongoDB
- [ ] Configurez CloudWatch pour les alertes
- [ ] Utilisez AWS Secrets Manager pour les clés sensibles

---

## 📞 Besoin d'aide ?

Si vous avez des questions sur le déploiement AWS, je suis là pour vous aider !

**Commandes utiles :**
```bash
# Redémarrer tous les services
docker-compose restart

# Voir l'utilisation des ressources
docker stats

# Nettoyer les containers arrêtés
docker system prune -a
```