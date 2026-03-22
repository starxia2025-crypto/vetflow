from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="VetFlow CRM API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Client (Pet Owner)
class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    notes: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    client_id: str = Field(default_factory=lambda: f"cli_{uuid.uuid4().hex[:12]}")
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Pet
class PetCreate(BaseModel):
    name: str
    species_id: str
    breed_id: Optional[str] = None
    client_id: str
    birth_date: Optional[str] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    color: Optional[str] = None
    microchip: Optional[str] = None
    notes: Optional[str] = None

class Pet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    pet_id: str = Field(default_factory=lambda: f"pet_{uuid.uuid4().hex[:12]}")
    name: str
    species_id: str
    breed_id: Optional[str] = None
    client_id: str
    birth_date: Optional[str] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    color: Optional[str] = None
    microchip: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Doctor
class DoctorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    schedule: Optional[Dict[str, Any]] = None

class Doctor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    doctor_id: str = Field(default_factory=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    schedule: Optional[Dict[str, Any]] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Cabinet/Consultation Room
class CabinetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    equipment: Optional[List[str]] = None

class Cabinet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cabinet_id: str = Field(default_factory=lambda: f"cab_{uuid.uuid4().hex[:12]}")
    name: str
    description: Optional[str] = None
    equipment: Optional[List[str]] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Species
class SpeciesCreate(BaseModel):
    name: str
    name_en: Optional[str] = None

class Species(BaseModel):
    model_config = ConfigDict(extra="ignore")
    species_id: str = Field(default_factory=lambda: f"spe_{uuid.uuid4().hex[:12]}")
    name: str
    name_en: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Breed
class BreedCreate(BaseModel):
    name: str
    name_en: Optional[str] = None
    species_id: str

class Breed(BaseModel):
    model_config = ConfigDict(extra="ignore")
    breed_id: str = Field(default_factory=lambda: f"bre_{uuid.uuid4().hex[:12]}")
    name: str
    name_en: Optional[str] = None
    species_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Vaccine
class VaccineCreate(BaseModel):
    pet_id: str
    name: str
    applied_date: str
    next_due_date: Optional[str] = None
    doctor_id: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None

class Vaccine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    vaccine_id: str = Field(default_factory=lambda: f"vac_{uuid.uuid4().hex[:12]}")
    pet_id: str
    name: str
    applied_date: str
    next_due_date: Optional[str] = None
    doctor_id: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Medical Analysis/Treatment
class AnalysisCreate(BaseModel):
    pet_id: str
    type: str  # consultation, analysis, surgery, etc.
    description: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    doctor_id: Optional[str] = None
    cabinet_id: Optional[str] = None
    date: str
    next_appointment: Optional[str] = None
    attachments: Optional[List[str]] = None

class Analysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    analysis_id: str = Field(default_factory=lambda: f"ana_{uuid.uuid4().hex[:12]}")
    pet_id: str
    type: str
    description: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    doctor_id: Optional[str] = None
    cabinet_id: Optional[str] = None
    date: str
    next_appointment: Optional[str] = None
    attachments: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Inventory Item
class InventoryItemCreate(BaseModel):
    name: str
    category: str  # medicine, supply, equipment
    quantity: int
    unit: str
    min_stock: int = 0
    price: float = 0
    cost: float = 0
    expiry_date: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    name: str
    category: str
    quantity: int
    unit: str
    min_stock: int = 0
    price: float = 0
    cost: float = 0
    expiry_date: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Invoice
class InvoiceItemInput(BaseModel):
    description: str
    quantity: int
    unit_price: float

class InvoiceCreate(BaseModel):
    client_id: str
    pet_id: Optional[str] = None
    items: List[InvoiceItemInput]
    notes: Optional[str] = None
    status: str = "pending"  # pending, paid, cancelled

class InvoiceItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    invoice_number: str
    client_id: str
    pet_id: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float
    tax: float
    total: float
    notes: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None

# Chat Message for AI
class ChatMessageInput(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    user_id: str
    session_id: str
    role: str  # user or assistant
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPERS ====================

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != '_id'}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookie or header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "VetFlow CRM API", "status": "running"}

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = auth_response.json()
    
    # Check if user exists
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data["name"],
                "picture": user_data.get("picture")
            }}
        )
    else:
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = user_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "session_id": f"sess_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user to return
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return serialize_doc(user_doc)

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await require_auth(request)
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== DASHBOARD ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    await require_auth(request)
    
    # Count totals
    total_clients = await db.clients.count_documents({})
    total_pets = await db.pets.count_documents({})
    total_doctors = await db.doctors.count_documents({"active": True})
    
    # Pending invoices
    pending_invoices = await db.invoices.count_documents({"status": "pending"})
    pending_amount = 0
    async for inv in db.invoices.find({"status": "pending"}, {"_id": 0, "total": 1}):
        pending_amount += inv.get("total", 0)
    
    # Low stock items
    low_stock_items = await db.inventory.count_documents({
        "$expr": {"$lte": ["$quantity", "$min_stock"]}
    })
    
    # Upcoming vaccines (next 30 days)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    thirty_days = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    upcoming_vaccines = await db.vaccines.count_documents({
        "next_due_date": {"$gte": today, "$lte": thirty_days}
    })
    
    # Recent activity
    recent_analyses = await db.analyses.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_clients": total_clients,
        "total_pets": total_pets,
        "total_doctors": total_doctors,
        "pending_invoices": pending_invoices,
        "pending_amount": pending_amount,
        "low_stock_items": low_stock_items,
        "upcoming_vaccines": upcoming_vaccines,
        "recent_analyses": [serialize_doc(a) for a in recent_analyses]
    }

@api_router.get("/dashboard/upcoming-vaccines")
async def get_upcoming_vaccines(request: Request):
    """Get vaccines due in the next 30 days"""
    await require_auth(request)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    thirty_days = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    
    vaccines = await db.vaccines.find(
        {"next_due_date": {"$gte": today, "$lte": thirty_days}},
        {"_id": 0}
    ).sort("next_due_date", 1).to_list(100)
    
    # Enrich with pet and client data
    result = []
    for vaccine in vaccines:
        pet = await db.pets.find_one({"pet_id": vaccine["pet_id"]}, {"_id": 0})
        if pet:
            client = await db.clients.find_one({"client_id": pet.get("client_id")}, {"_id": 0})
            vaccine["pet_name"] = pet.get("name")
            vaccine["client_name"] = client.get("name") if client else None
            vaccine["client_phone"] = client.get("phone") if client else None
        result.append(serialize_doc(vaccine))
    
    return result

# ==================== CLIENTS ====================

@api_router.get("/clients")
async def get_clients(request: Request, search: Optional[str] = None):
    """Get all clients"""
    await require_auth(request)
    
    query = {}
    if search:
        query = {"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]}
    
    clients = await db.clients.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    return [serialize_doc(c) for c in clients]

@api_router.get("/clients/{client_id}")
async def get_client(request: Request, client_id: str):
    """Get single client"""
    await require_auth(request)
    
    client = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get client's pets
    pets = await db.pets.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    client["pets"] = [serialize_doc(p) for p in pets]
    
    return serialize_doc(client)

@api_router.post("/clients")
async def create_client(request: Request, data: ClientCreate):
    """Create new client"""
    await require_auth(request)
    
    client = Client(**data.model_dump())
    doc = client.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.clients.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/clients/{client_id}")
async def update_client(request: Request, client_id: str, data: ClientCreate):
    """Update client"""
    await require_auth(request)
    
    result = await db.clients.update_one(
        {"client_id": client_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    updated = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.delete("/clients/{client_id}")
async def delete_client(request: Request, client_id: str):
    """Delete client"""
    await require_auth(request)
    
    result = await db.clients.delete_one({"client_id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return {"message": "Client deleted"}

# ==================== PETS ====================

@api_router.get("/pets")
async def get_pets(request: Request, search: Optional[str] = None, client_id: Optional[str] = None):
    """Get all pets"""
    await require_auth(request)
    
    query = {}
    if client_id:
        query["client_id"] = client_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"microchip": {"$regex": search, "$options": "i"}}
        ]
    
    pets = await db.pets.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    
    # Enrich with species, breed, and client data
    result = []
    for pet in pets:
        species = await db.species.find_one({"species_id": pet.get("species_id")}, {"_id": 0})
        breed = await db.breeds.find_one({"breed_id": pet.get("breed_id")}, {"_id": 0}) if pet.get("breed_id") else None
        client = await db.clients.find_one({"client_id": pet.get("client_id")}, {"_id": 0})
        
        pet["species_name"] = species.get("name") if species else None
        pet["breed_name"] = breed.get("name") if breed else None
        pet["client_name"] = client.get("name") if client else None
        result.append(serialize_doc(pet))
    
    return result

@api_router.get("/pets/{pet_id}")
async def get_pet(request: Request, pet_id: str):
    """Get single pet with full history"""
    await require_auth(request)
    
    pet = await db.pets.find_one({"pet_id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Enrich data
    species = await db.species.find_one({"species_id": pet.get("species_id")}, {"_id": 0})
    breed = await db.breeds.find_one({"breed_id": pet.get("breed_id")}, {"_id": 0}) if pet.get("breed_id") else None
    client = await db.clients.find_one({"client_id": pet.get("client_id")}, {"_id": 0})
    
    pet["species_name"] = species.get("name") if species else None
    pet["breed_name"] = breed.get("name") if breed else None
    pet["client"] = serialize_doc(client) if client else None
    
    # Get vaccines
    vaccines = await db.vaccines.find({"pet_id": pet_id}, {"_id": 0}).sort("applied_date", -1).to_list(100)
    pet["vaccines"] = [serialize_doc(v) for v in vaccines]
    
    # Get medical history
    analyses = await db.analyses.find({"pet_id": pet_id}, {"_id": 0}).sort("date", -1).to_list(100)
    pet["medical_history"] = [serialize_doc(a) for a in analyses]
    
    return serialize_doc(pet)

@api_router.post("/pets")
async def create_pet(request: Request, data: PetCreate):
    """Create new pet"""
    await require_auth(request)
    
    pet = Pet(**data.model_dump())
    doc = pet.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.pets.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/pets/{pet_id}")
async def update_pet(request: Request, pet_id: str, data: PetCreate):
    """Update pet"""
    await require_auth(request)
    
    result = await db.pets.update_one(
        {"pet_id": pet_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    updated = await db.pets.find_one({"pet_id": pet_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.delete("/pets/{pet_id}")
async def delete_pet(request: Request, pet_id: str):
    """Delete pet"""
    await require_auth(request)
    
    result = await db.pets.delete_one({"pet_id": pet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"message": "Pet deleted"}

# ==================== DOCTORS ====================

@api_router.get("/doctors")
async def get_doctors(request: Request, active_only: bool = True):
    """Get all doctors"""
    await require_auth(request)
    
    query = {"active": True} if active_only else {}
    doctors = await db.doctors.find(query, {"_id": 0}).sort("name", 1).to_list(100)
    return [serialize_doc(d) for d in doctors]

@api_router.get("/doctors/{doctor_id}")
async def get_doctor(request: Request, doctor_id: str):
    """Get single doctor"""
    await require_auth(request)
    
    doctor = await db.doctors.find_one({"doctor_id": doctor_id}, {"_id": 0})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return serialize_doc(doctor)

@api_router.post("/doctors")
async def create_doctor(request: Request, data: DoctorCreate):
    """Create new doctor"""
    await require_auth(request)
    
    doctor = Doctor(**data.model_dump())
    doc = doctor.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.doctors.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/doctors/{doctor_id}")
async def update_doctor(request: Request, doctor_id: str, data: DoctorCreate):
    """Update doctor"""
    await require_auth(request)
    
    result = await db.doctors.update_one(
        {"doctor_id": doctor_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    updated = await db.doctors.find_one({"doctor_id": doctor_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.delete("/doctors/{doctor_id}")
async def delete_doctor(request: Request, doctor_id: str):
    """Deactivate doctor"""
    await require_auth(request)
    
    result = await db.doctors.update_one(
        {"doctor_id": doctor_id},
        {"$set": {"active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {"message": "Doctor deactivated"}

# ==================== CABINETS ====================

@api_router.get("/cabinets")
async def get_cabinets(request: Request, active_only: bool = True):
    """Get all cabinets"""
    await require_auth(request)
    
    query = {"active": True} if active_only else {}
    cabinets = await db.cabinets.find(query, {"_id": 0}).sort("name", 1).to_list(100)
    return [serialize_doc(c) for c in cabinets]

@api_router.post("/cabinets")
async def create_cabinet(request: Request, data: CabinetCreate):
    """Create new cabinet"""
    await require_auth(request)
    
    cabinet = Cabinet(**data.model_dump())
    doc = cabinet.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.cabinets.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/cabinets/{cabinet_id}")
async def update_cabinet(request: Request, cabinet_id: str, data: CabinetCreate):
    """Update cabinet"""
    await require_auth(request)
    
    result = await db.cabinets.update_one(
        {"cabinet_id": cabinet_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cabinet not found")
    
    updated = await db.cabinets.find_one({"cabinet_id": cabinet_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.delete("/cabinets/{cabinet_id}")
async def delete_cabinet(request: Request, cabinet_id: str):
    """Deactivate cabinet"""
    await require_auth(request)
    
    result = await db.cabinets.update_one(
        {"cabinet_id": cabinet_id},
        {"$set": {"active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cabinet not found")
    
    return {"message": "Cabinet deactivated"}

# ==================== SPECIES & BREEDS ====================

@api_router.get("/species")
async def get_species(request: Request):
    """Get all species"""
    await require_auth(request)
    
    species = await db.species.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    return [serialize_doc(s) for s in species]

@api_router.post("/species")
async def create_species(request: Request, data: SpeciesCreate):
    """Create new species"""
    await require_auth(request)
    
    species = Species(**data.model_dump())
    doc = species.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.species.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.delete("/species/{species_id}")
async def delete_species(request: Request, species_id: str):
    """Delete species"""
    await require_auth(request)
    
    result = await db.species.delete_one({"species_id": species_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Species not found")
    
    return {"message": "Species deleted"}

@api_router.get("/breeds")
async def get_breeds(request: Request, species_id: Optional[str] = None):
    """Get all breeds"""
    await require_auth(request)
    
    query = {"species_id": species_id} if species_id else {}
    breeds = await db.breeds.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return [serialize_doc(b) for b in breeds]

@api_router.post("/breeds")
async def create_breed(request: Request, data: BreedCreate):
    """Create new breed"""
    await require_auth(request)
    
    breed = Breed(**data.model_dump())
    doc = breed.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.breeds.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.delete("/breeds/{breed_id}")
async def delete_breed(request: Request, breed_id: str):
    """Delete breed"""
    await require_auth(request)
    
    result = await db.breeds.delete_one({"breed_id": breed_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Breed not found")
    
    return {"message": "Breed deleted"}

# ==================== VACCINES ====================

@api_router.get("/vaccines")
async def get_vaccines(request: Request, pet_id: Optional[str] = None):
    """Get vaccines"""
    await require_auth(request)
    
    query = {"pet_id": pet_id} if pet_id else {}
    vaccines = await db.vaccines.find(query, {"_id": 0}).sort("applied_date", -1).to_list(1000)
    return [serialize_doc(v) for v in vaccines]

@api_router.post("/vaccines")
async def create_vaccine(request: Request, data: VaccineCreate):
    """Create vaccine record"""
    await require_auth(request)
    
    vaccine = Vaccine(**data.model_dump())
    doc = vaccine.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.vaccines.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.delete("/vaccines/{vaccine_id}")
async def delete_vaccine(request: Request, vaccine_id: str):
    """Delete vaccine"""
    await require_auth(request)
    
    result = await db.vaccines.delete_one({"vaccine_id": vaccine_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vaccine not found")
    
    return {"message": "Vaccine deleted"}

# ==================== ANALYSES ====================

@api_router.get("/analyses")
async def get_analyses(request: Request, pet_id: Optional[str] = None):
    """Get medical analyses"""
    await require_auth(request)
    
    query = {"pet_id": pet_id} if pet_id else {}
    analyses = await db.analyses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [serialize_doc(a) for a in analyses]

@api_router.post("/analyses")
async def create_analysis(request: Request, data: AnalysisCreate):
    """Create analysis record"""
    await require_auth(request)
    
    analysis = Analysis(**data.model_dump())
    doc = analysis.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.analyses.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/analyses/{analysis_id}")
async def update_analysis(request: Request, analysis_id: str, data: AnalysisCreate):
    """Update analysis"""
    await require_auth(request)
    
    result = await db.analyses.update_one(
        {"analysis_id": analysis_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    updated = await db.analyses.find_one({"analysis_id": analysis_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.delete("/analyses/{analysis_id}")
async def delete_analysis(request: Request, analysis_id: str):
    """Delete analysis"""
    await require_auth(request)
    
    result = await db.analyses.delete_one({"analysis_id": analysis_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {"message": "Analysis deleted"}

# ==================== INVENTORY ====================

@api_router.get("/inventory")
async def get_inventory(request: Request, category: Optional[str] = None, low_stock: bool = False):
    """Get inventory items"""
    await require_auth(request)
    
    query = {}
    if category:
        query["category"] = category
    if low_stock:
        query["$expr"] = {"$lte": ["$quantity", "$min_stock"]}
    
    items = await db.inventory.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    return [serialize_doc(i) for i in items]

@api_router.post("/inventory")
async def create_inventory_item(request: Request, data: InventoryItemCreate):
    """Create inventory item"""
    await require_auth(request)
    
    item = InventoryItem(**data.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.inventory.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/inventory/{item_id}")
async def update_inventory_item(request: Request, item_id: str, data: InventoryItemCreate):
    """Update inventory item"""
    await require_auth(request)
    
    result = await db.inventory.update_one(
        {"item_id": item_id},
        {"$set": data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated = await db.inventory.find_one({"item_id": item_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(request: Request, item_id: str):
    """Delete inventory item"""
    await require_auth(request)
    
    result = await db.inventory.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted"}

# ==================== INVOICES ====================

@api_router.get("/invoices")
async def get_invoices(request: Request, status: Optional[str] = None, client_id: Optional[str] = None):
    """Get invoices"""
    await require_auth(request)
    
    query = {}
    if status:
        query["status"] = status
    if client_id:
        query["client_id"] = client_id
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with client data
    result = []
    for inv in invoices:
        client = await db.clients.find_one({"client_id": inv.get("client_id")}, {"_id": 0})
        inv["client_name"] = client.get("name") if client else None
        result.append(serialize_doc(inv))
    
    return result

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(request: Request, invoice_id: str):
    """Get single invoice"""
    await require_auth(request)
    
    invoice = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    client = await db.clients.find_one({"client_id": invoice.get("client_id")}, {"_id": 0})
    invoice["client"] = serialize_doc(client)
    
    if invoice.get("pet_id"):
        pet = await db.pets.find_one({"pet_id": invoice.get("pet_id")}, {"_id": 0})
        invoice["pet"] = serialize_doc(pet)
    
    return serialize_doc(invoice)

@api_router.post("/invoices")
async def create_invoice(request: Request, data: InvoiceCreate):
    """Create invoice"""
    await require_auth(request)
    
    # Generate invoice number
    count = await db.invoices.count_documents({})
    invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{count + 1:04d}"
    
    # Calculate totals
    items = []
    subtotal = 0
    for item in data.items:
        total = item.quantity * item.unit_price
        items.append(InvoiceItem(
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=total
        ))
        subtotal += total
    
    tax = subtotal * 0.16  # 16% IVA
    total = subtotal + tax
    
    invoice = Invoice(
        invoice_number=invoice_number,
        client_id=data.client_id,
        pet_id=data.pet_id,
        items=[i.model_dump() for i in items],
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=data.notes,
        status=data.status
    )
    
    doc = invoice.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.invoices.insert_one(doc)
    
    return serialize_doc(doc)

@api_router.put("/invoices/{invoice_id}/pay")
async def pay_invoice(request: Request, invoice_id: str):
    """Mark invoice as paid"""
    await require_auth(request)
    
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    updated = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.put("/invoices/{invoice_id}/cancel")
async def cancel_invoice(request: Request, invoice_id: str):
    """Cancel invoice"""
    await require_auth(request)
    
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    updated = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    return serialize_doc(updated)

# ==================== AI ASSISTANT ====================

@api_router.post("/ai/chat")
async def ai_chat(request: Request, data: ChatMessageInput):
    """Chat with AI assistant"""
    user = await require_auth(request)
    
    session_id = data.session_id or f"chat_{uuid.uuid4().hex[:12]}"
    
    # Get system context
    stats = {
        "total_clients": await db.clients.count_documents({}),
        "total_pets": await db.pets.count_documents({}),
        "total_doctors": await db.doctors.count_documents({"active": True}),
        "pending_invoices": await db.invoices.count_documents({"status": "pending"})
    }
    
    # Get upcoming vaccines
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    thirty_days = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    upcoming_vaccines = await db.vaccines.find(
        {"next_due_date": {"$gte": today, "$lte": thirty_days}},
        {"_id": 0}
    ).to_list(10)
    
    # Low stock
    low_stock = await db.inventory.find(
        {"$expr": {"$lte": ["$quantity", "$min_stock"]}},
        {"_id": 0, "name": 1, "quantity": 1, "min_stock": 1}
    ).to_list(10)
    
    system_message = f"""Eres VetFlow AI, un asistente inteligente para clínicas veterinarias. 
Tienes acceso al sistema CRM y puedes ayudar con:
- Buscar clientes, mascotas, doctores
- Crear recordatorios de vacunas
- Verificar inventario
- Generar resúmenes de actividad
- Responder preguntas sobre el sistema

Contexto actual del sistema:
- Total clientes: {stats['total_clients']}
- Total mascotas: {stats['total_pets']}
- Doctores activos: {stats['total_doctors']}
- Facturas pendientes: {stats['pending_invoices']}

Vacunas próximas a vencer (próximos 30 días): {len(upcoming_vaccines)} vacunas
Productos con stock bajo: {len(low_stock)} productos

Responde de forma concisa y profesional. Si necesitas más información, pregunta.
Siempre responde en el idioma del usuario."""

    # Save user message
    user_msg = ChatMessage(
        user_id=user.user_id,
        session_id=session_id,
        role="user",
        content=data.message
    )
    user_msg_doc = user_msg.model_dump()
    user_msg_doc["created_at"] = user_msg_doc["created_at"].isoformat()
    await db.chat_messages.insert_one(user_msg_doc)
    
    # Get chat history
    history = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(20)
    
    # Call OpenAI
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        # Build conversation
        for msg in history[-10:]:  # Last 10 messages
            if msg["role"] == "user":
                chat.add_user_message(msg["content"])
            else:
                chat.add_assistant_message(msg["content"])
        
        # Get response
        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)
        
        # Save assistant response
        assistant_msg = ChatMessage(
            user_id=user.user_id,
            session_id=session_id,
            role="assistant",
            content=response
        )
        assistant_msg_doc = assistant_msg.model_dump()
        assistant_msg_doc["created_at"] = assistant_msg_doc["created_at"].isoformat()
        await db.chat_messages.insert_one(assistant_msg_doc)
        
        return {
            "session_id": session_id,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return {
            "session_id": session_id,
            "response": f"Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo. Error: {str(e)}"
        }

@api_router.get("/ai/history")
async def get_chat_history(request: Request, session_id: Optional[str] = None):
    """Get chat history"""
    user = await require_auth(request)
    
    query = {"user_id": user.user_id}
    if session_id:
        query["session_id"] = session_id
    
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(100)
    return [serialize_doc(m) for m in messages]

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data(request: Request):
    """Seed initial data"""
    await require_auth(request)
    
    # Seed species
    species_data = [
        {"species_id": "spe_dog", "name": "Perro", "name_en": "Dog"},
        {"species_id": "spe_cat", "name": "Gato", "name_en": "Cat"},
        {"species_id": "spe_bird", "name": "Ave", "name_en": "Bird"},
        {"species_id": "spe_rabbit", "name": "Conejo", "name_en": "Rabbit"},
        {"species_id": "spe_hamster", "name": "Hámster", "name_en": "Hamster"},
        {"species_id": "spe_reptile", "name": "Reptil", "name_en": "Reptile"},
    ]
    
    for s in species_data:
        existing = await db.species.find_one({"species_id": s["species_id"]})
        if not existing:
            s["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.species.insert_one(s)
    
    # Seed breeds
    breeds_data = [
        {"breed_id": "bre_labrador", "name": "Labrador Retriever", "species_id": "spe_dog"},
        {"breed_id": "bre_german", "name": "Pastor Alemán", "name_en": "German Shepherd", "species_id": "spe_dog"},
        {"breed_id": "bre_bulldog", "name": "Bulldog", "species_id": "spe_dog"},
        {"breed_id": "bre_poodle", "name": "Caniche", "name_en": "Poodle", "species_id": "spe_dog"},
        {"breed_id": "bre_chihuahua", "name": "Chihuahua", "species_id": "spe_dog"},
        {"breed_id": "bre_persian", "name": "Persa", "name_en": "Persian", "species_id": "spe_cat"},
        {"breed_id": "bre_siamese", "name": "Siamés", "name_en": "Siamese", "species_id": "spe_cat"},
        {"breed_id": "bre_maine", "name": "Maine Coon", "species_id": "spe_cat"},
    ]
    
    for b in breeds_data:
        existing = await db.breeds.find_one({"breed_id": b["breed_id"]})
        if not existing:
            b["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.breeds.insert_one(b)
    
    return {"message": "Data seeded successfully"}

# ==================== SETUP ====================

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
