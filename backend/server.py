from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client['music_store']

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.getenv('STRIPE_API_KEY', 'sk_test_emergent')

# Security
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserRegister(BaseModel):
    prenom: str
    nom: str
    email: EmailStr
    adresse: str
    mot_de_passe: str

class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prenom: str
    nom: str
    email: str
    adresse: str
    email_verifie: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titre: str
    artiste: str
    type: str  # "album" or "single"
    prix: float
    image_url: str
    audio_preview_url: str
    audio_file_url: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItem(BaseModel):
    product_id: str
    quantite: int = 1

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderItem(BaseModel):
    product_id: str
    titre: str
    prix: float
    quantite: int
    download_url: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total: float
    stripe_session_id: str
    payment_status: str = "pending"  # pending, paid, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    order_id: str
    amount: float
    currency: str
    status: str = "pending"  # pending, completed, failed
    payment_status: str = "unpaid"  # unpaid, paid
    metadata: dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailVerificationToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

class CheckoutRequest(BaseModel):
    origin_url: str

# ============= UTILITIES =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return User(**user)

# ============= AUTH ROUTES =============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    user = User(
        prenom=user_data.prenom,
        nom=user_data.nom,
        email=user_data.email,
        adresse=user_data.adresse,
        email_verifie=False
    )
    
    user_dict = user.model_dump()
    user_dict['mot_de_passe'] = hash_password(user_data.mot_de_passe)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create verification token
    verification = EmailVerificationToken(user_id=user.id)
    verification_dict = verification.model_dump()
    verification_dict['expires_at'] = verification_dict['expires_at'].isoformat()
    await db.email_verifications.insert_one(verification_dict)
    
    # In production, send email with verification link
    # For now, return token in response (for testing)
    
    return {
        "message": "Inscription réussie. Vérifiez votre email.",
        "user_id": user.id,
        "verification_token": verification.token  # Remove in production
    }

@api_router.get("/auth/verify-email/{token}")
async def verify_email(token: str):
    verification = await db.email_verifications.find_one({"token": token}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=400, detail="Token de vérification invalide")
    
    # Check expiration
    expires_at = datetime.fromisoformat(verification['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token expiré")
    
    # Update user
    await db.users.update_one(
        {"id": verification['user_id']},
        {"$set": {"email_verifie": True}}
    )
    
    # Delete verification token
    await db.email_verifications.delete_one({"token": token})
    
    return {"message": "Email vérifié avec succès"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.mot_de_passe, user['mot_de_passe']):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not user.get('email_verifie', False):
        raise HTTPException(status_code=403, detail="Veuillez vérifier votre email avant de vous connecter")
    
    token = create_access_token(user['id'], user['email'])
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "prenom": user['prenom'],
            "nom": user['nom'],
            "email": user['email']
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============= PRODUCTS ROUTES =============

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return Product(**product)

# Admin route to add products (for testing)
@api_router.post("/products", response_model=Product)
async def create_product(product: Product):
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    await db.products.insert_one(product_dict)
    return product

# ============= CART ROUTES =============

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart:
        return {"items": []}
    
    # Get product details for each item
    items_with_details = []
    for item in cart.get('items', []):
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            items_with_details.append({
                **item,
                "product": product
            })
    
    return {"items": items_with_details}

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    # Verify product exists
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    cart = await db.carts.find_one({"user_id": current_user.id})
    
    if not cart:
        # Create new cart
        new_cart = Cart(user_id=current_user.id, items=[item])
        cart_dict = new_cart.model_dump()
        cart_dict['created_at'] = cart_dict['created_at'].isoformat()
        await db.carts.insert_one(cart_dict)
    else:
        # Update existing cart
        items = cart.get('items', [])
        existing_item = next((i for i in items if i['product_id'] == item.product_id), None)
        
        if existing_item:
            existing_item['quantite'] += item.quantite
        else:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            {"user_id": current_user.id},
            {"$set": {"items": items}}
        )
    
    return {"message": "Produit ajouté au panier"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        raise HTTPException(status_code=404, detail="Panier vide")
    
    items = [i for i in cart.get('items', []) if i['product_id'] != product_id]
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": items}}
    )
    
    return {"message": "Produit retiré du panier"}

@api_router.delete("/cart/clear")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": current_user.id})
    return {"message": "Panier vidé"}

# ============= CHECKOUT & PAYMENT ROUTES =============

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: CheckoutRequest, current_user: User = Depends(get_current_user)):
    # Get user's cart
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart or not cart.get('items'):
        raise HTTPException(status_code=400, detail="Panier vide")
    
    # Calculate total
    total = 0.0
    order_items = []
    
    for item in cart['items']:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            item_total = product['prix'] * item['quantite']
            total += item_total
            order_items.append(OrderItem(
                product_id=product['id'],
                titre=product['titre'],
                prix=product['prix'],
                quantite=item['quantite'],
                download_url=product['audio_file_url']
            ))
    
    if total == 0:
        raise HTTPException(status_code=400, detail="Le panier ne contient aucun produit valide")
    
    # Create order
    order = Order(
        user_id=current_user.id,
        items=order_items,
        total=total,
        stripe_session_id="",
        payment_status="pending"
    )
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    await db.orders.insert_one(order_dict)
    
    # Initialize Stripe
    webhook_url = f"{request.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{request.origin_url}/success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{request.origin_url}/cart"
    
    checkout_request = CheckoutSessionRequest(
        amount=total,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user.id,
            "order_id": order.id
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Update order with session_id
    await db.orders.update_one(
        {"id": order.id},
        {"$set": {"stripe_session_id": session.session_id}}
    )
    
    # Create payment transaction
    transaction = PaymentTransaction(
        session_id=session.session_id,
        user_id=current_user.id,
        order_id=order.id,
        amount=total,
        currency="eur",
        status="pending",
        payment_status="unpaid",
        metadata={"user_id": current_user.id, "order_id": order.id}
    )
    transaction_dict = transaction.model_dump()
    transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
    await db.payment_transactions.insert_one(transaction_dict)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, current_user: User = Depends(get_current_user)):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    # If already paid, return immediately
    if transaction['payment_status'] == 'paid':
        return {
            "status": "complete",
            "payment_status": "paid",
            "order_id": transaction['order_id']
        }
    
    # Check Stripe status
    webhook_url = f"https://example.com/webhook"  # Not used for status check
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and order
    if checkout_status.payment_status == 'paid' and transaction['payment_status'] != 'paid':
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "completed",
                "payment_status": "paid"
            }}
        )
        
        # Update order
        await db.orders.update_one(
            {"id": transaction['order_id']},
            {"$set": {"payment_status": "paid"}}
        )
        
        # Clear cart
        await db.carts.delete_one({"user_id": current_user.id})
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "order_id": transaction['order_id']
    }

# ============= ORDERS ROUTES =============

@api_router.get("/orders")
async def get_my_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order

# ============= WEBHOOK =============

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    body = await request.body()
    
    webhook_url = "https://example.com/webhook"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Update transaction and order based on webhook
        if webhook_response.payment_status == 'paid':
            session_id = webhook_response.session_id
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "status": "completed",
                    "payment_status": "paid"
                }}
            )
            
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction:
                await db.orders.update_one(
                    {"id": transaction['order_id']},
                    {"$set": {"payment_status": "paid"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ============= SEED DATA FOR TESTING =============

@api_router.post("/seed-products")
async def seed_products():
    # Clear existing products
    await db.products.delete_many({})
    
    products = [
        Product(
            titre="Midnight Dreams",
            artiste="DJ Shadow",
            type="album",
            prix=15.99,
            image_url="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500",
            audio_preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            audio_file_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            description="Un album électronique captivant qui vous transporte dans un voyage nocturne."
        ),
        Product(
            titre="Summer Vibes",
            artiste="The Sunsets",
            type="single",
            prix=2.99,
            image_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
            audio_preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            audio_file_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            description="Le single parfait pour vos journées d'été ensoleillées."
        ),
        Product(
            titre="Urban Rhythm",
            artiste="MC Flow",
            type="album",
            prix=12.99,
            image_url="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500",
            audio_preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            audio_file_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            description="Des beats urbains qui capturent l'énergie de la ville."
        ),
        Product(
            titre="Acoustic Sessions",
            artiste="Sarah Woods",
            type="single",
            prix=1.99,
            image_url="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500",
            audio_preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            audio_file_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            description="Une performance acoustique intime et émotionnelle."
        ),
        Product(
            titre="Electronic Fusion",
            artiste="Synth Masters",
            type="album",
            prix=18.99,
            image_url="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=500",
            audio_preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            audio_file_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            description="Une fusion innovante de sons électroniques et organiques."
        ),
        Product(
            titre="Jazz Nights",
            artiste="The Quartet",
            type="album",
            prix=14.99,
            image_url="https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500",
            audio_preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
            audio_file_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
            description="Des mélodies jazz sophistiquées pour vos soirées."
        )
    ]
    
    for product in products:
        product_dict = product.model_dump()
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        await db.products.insert_one(product_dict)
    
    return {"message": f"{len(products)} produits créés avec succès"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()