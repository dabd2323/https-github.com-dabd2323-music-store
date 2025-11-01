#!/usr/bin/env python3
"""
Script pour créer un utilisateur admin
Usage: python3 create_admin.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
import os
from datetime import datetime, timezone

async def create_admin():
    # Configuration
    email = input("Émail de l'admin: ") or "admin@musicstore.com"
    prenom = input("Prénom: ") or "Admin"
    nom = input("Nom: ") or "MusicStore"
    mot_de_passe = input("Mot de passe (8+ caractères): ")
    
    if len(mot_de_passe) < 8:
        print("❌ Le mot de passe doit contenir au moins 8 caractères")
        return
    
    # Connexion MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['music_store']
    
    # Vérifier si l'admin existe déjà
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"⚠️  Un utilisateur avec l'email {email} existe déjà")
        update = input("Mettre à jour en admin? (o/n): ")
        if update.lower() == 'o':
            await db.users.update_one(
                {"email": email},
                {"$set": {"role": "admin", "email_verifie": True}}
            )
            print("✅ Utilisateur mis à jour en admin")
        return
    
    # Hasher le mot de passe
    hashed = bcrypt.hashpw(mot_de_passe.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Créer l'admin
    admin_user = {
        'id': str(uuid.uuid4()),
        'prenom': prenom,
        'nom': nom,
        'email': email,
        'adresse': '123 Admin Street',
        'mot_de_passe': hashed,
        'email_verifie': True,
        'role': 'admin',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    print(f"
✅ Admin créé avec succès!")
    print(f"   Email: {email}")
    print(f"   Mot de passe: {'*' * len(mot_de_passe)}")
    print(f"
🔑 Connectez-vous sur /admin avec ces identifiants")

if __name__ == "__main__":
    print("
🔒 Création d'un utilisateur administrateur\n")
    asyncio.run(create_admin())