import hashlib
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import HTMLResponse
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine, func
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:3000").rstrip("/")
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000").rstrip("/")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN") or None
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "lax").lower()
ACCESS_TOKEN_EXPIRE_DAYS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_DAYS", "30"))
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "VetFlow CRM")
CORS_ORIGINS = [
    item.strip()
    for item in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if item.strip()
]

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def prefixed_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def slugify(value: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    slug = "-".join(part for part in slug.split("-") if part)
    return slug or f"clinic-{uuid.uuid4().hex[:6]}"


class CompanyModel(Base):
    __tablename__ = "companies"

    company_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    slug = __import__("sqlalchemy").Column(String(255), nullable=False, unique=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class UserModel(Base):
    __tablename__ = "users"

    user_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    email = __import__("sqlalchemy").Column(String(255), nullable=False, unique=True, index=True)
    password_hash = __import__("sqlalchemy").Column(String(255), nullable=True)
    google_sub = __import__("sqlalchemy").Column(String(255), nullable=True, unique=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    picture = __import__("sqlalchemy").Column(Text, nullable=True)
    role = __import__("sqlalchemy").Column(String(32), nullable=False, default="admin")
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)

    company = relationship("CompanyModel")


class UserSessionModel(Base):
    __tablename__ = "user_sessions"

    session_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    user_id = __import__("sqlalchemy").Column(String(32), ForeignKey("users.user_id"), nullable=False, index=True)
    session_token_hash = __import__("sqlalchemy").Column(String(128), nullable=False, unique=True, index=True)
    expires_at = __import__("sqlalchemy").Column(DateTime(timezone=True), nullable=False)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class ClientModel(Base):
    __tablename__ = "clients"

    client_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    email = __import__("sqlalchemy").Column(String(255), nullable=True)
    phone = __import__("sqlalchemy").Column(String(64), nullable=False)
    address = __import__("sqlalchemy").Column(Text, nullable=True)
    notes = __import__("sqlalchemy").Column(Text, nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class SpeciesModel(Base):
    __tablename__ = "species"

    species_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    name_en = __import__("sqlalchemy").Column(String(255), nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class BreedModel(Base):
    __tablename__ = "breeds"

    breed_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    species_id = __import__("sqlalchemy").Column(String(32), ForeignKey("species.species_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    name_en = __import__("sqlalchemy").Column(String(255), nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class PetModel(Base):
    __tablename__ = "pets"

    pet_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    client_id = __import__("sqlalchemy").Column(String(32), ForeignKey("clients.client_id"), nullable=False, index=True)
    species_id = __import__("sqlalchemy").Column(String(32), ForeignKey("species.species_id"), nullable=False, index=True)
    breed_id = __import__("sqlalchemy").Column(String(32), ForeignKey("breeds.breed_id"), nullable=True, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    birth_date = __import__("sqlalchemy").Column(String(32), nullable=True)
    weight = __import__("sqlalchemy").Column(Float, nullable=True)
    gender = __import__("sqlalchemy").Column(String(16), nullable=True)
    color = __import__("sqlalchemy").Column(String(128), nullable=True)
    microchip = __import__("sqlalchemy").Column(String(128), nullable=True)
    notes = __import__("sqlalchemy").Column(Text, nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class DoctorModel(Base):
    __tablename__ = "doctors"

    doctor_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    email = __import__("sqlalchemy").Column(String(255), nullable=True)
    phone = __import__("sqlalchemy").Column(String(64), nullable=True)
    specialty = __import__("sqlalchemy").Column(String(255), nullable=True)
    license_number = __import__("sqlalchemy").Column(String(255), nullable=True)
    schedule = __import__("sqlalchemy").Column(JSON, nullable=True)
    active = __import__("sqlalchemy").Column(Boolean, nullable=False, default=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class CabinetModel(Base):
    __tablename__ = "cabinets"

    cabinet_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    description = __import__("sqlalchemy").Column(Text, nullable=True)
    equipment = __import__("sqlalchemy").Column(JSON, nullable=True)
    active = __import__("sqlalchemy").Column(Boolean, nullable=False, default=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class VaccineModel(Base):
    __tablename__ = "vaccines"

    vaccine_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    pet_id = __import__("sqlalchemy").Column(String(32), ForeignKey("pets.pet_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    applied_date = __import__("sqlalchemy").Column(String(32), nullable=False)
    next_due_date = __import__("sqlalchemy").Column(String(32), nullable=True)
    doctor_id = __import__("sqlalchemy").Column(String(32), ForeignKey("doctors.doctor_id"), nullable=True)
    batch_number = __import__("sqlalchemy").Column(String(255), nullable=True)
    notes = __import__("sqlalchemy").Column(Text, nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class AnalysisModel(Base):
    __tablename__ = "analyses"

    analysis_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    pet_id = __import__("sqlalchemy").Column(String(32), ForeignKey("pets.pet_id"), nullable=False, index=True)
    type = __import__("sqlalchemy").Column(String(64), nullable=False)
    description = __import__("sqlalchemy").Column(Text, nullable=False)
    diagnosis = __import__("sqlalchemy").Column(Text, nullable=True)
    treatment = __import__("sqlalchemy").Column(Text, nullable=True)
    doctor_id = __import__("sqlalchemy").Column(String(32), ForeignKey("doctors.doctor_id"), nullable=True)
    cabinet_id = __import__("sqlalchemy").Column(String(32), ForeignKey("cabinets.cabinet_id"), nullable=True)
    date = __import__("sqlalchemy").Column(String(32), nullable=False)
    next_appointment = __import__("sqlalchemy").Column(String(32), nullable=True)
    attachments = __import__("sqlalchemy").Column(JSON, nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class InventoryItemModel(Base):
    __tablename__ = "inventory_items"

    item_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    name = __import__("sqlalchemy").Column(String(255), nullable=False)
    category = __import__("sqlalchemy").Column(String(64), nullable=False)
    quantity = __import__("sqlalchemy").Column(Integer, nullable=False, default=0)
    unit = __import__("sqlalchemy").Column(String(32), nullable=False)
    min_stock = __import__("sqlalchemy").Column(Integer, nullable=False, default=0)
    price = __import__("sqlalchemy").Column(Float, nullable=False, default=0)
    cost = __import__("sqlalchemy").Column(Float, nullable=False, default=0)
    expiry_date = __import__("sqlalchemy").Column(String(32), nullable=True)
    supplier = __import__("sqlalchemy").Column(String(255), nullable=True)
    notes = __import__("sqlalchemy").Column(Text, nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class InvoiceModel(Base):
    __tablename__ = "invoices"

    invoice_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    invoice_number = __import__("sqlalchemy").Column(String(64), nullable=False)
    client_id = __import__("sqlalchemy").Column(String(32), ForeignKey("clients.client_id"), nullable=False)
    pet_id = __import__("sqlalchemy").Column(String(32), ForeignKey("pets.pet_id"), nullable=True)
    items = __import__("sqlalchemy").Column(JSON, nullable=False, default=list)
    subtotal = __import__("sqlalchemy").Column(Float, nullable=False, default=0)
    tax = __import__("sqlalchemy").Column(Float, nullable=False, default=0)
    total = __import__("sqlalchemy").Column(Float, nullable=False, default=0)
    notes = __import__("sqlalchemy").Column(Text, nullable=True)
    status = __import__("sqlalchemy").Column(String(32), nullable=False, default="pending")
    paid_at = __import__("sqlalchemy").Column(DateTime(timezone=True), nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    message_id = __import__("sqlalchemy").Column(String(32), primary_key=True)
    company_id = __import__("sqlalchemy").Column(String(32), ForeignKey("companies.company_id"), nullable=False, index=True)
    user_id = __import__("sqlalchemy").Column(String(32), ForeignKey("users.user_id"), nullable=False, index=True)
    session_id = __import__("sqlalchemy").Column(String(32), nullable=False, index=True)
    role = __import__("sqlalchemy").Column(String(16), nullable=False)
    content = __import__("sqlalchemy").Column(Text, nullable=False)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=utcnow, nullable=False)


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    clinic_name: str = Field(min_length=2)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    notes: Optional[str] = None


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


class DoctorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    schedule: Optional[Dict[str, Any]] = None


class CabinetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    equipment: Optional[List[str]] = None


class SpeciesCreate(BaseModel):
    name: str
    name_en: Optional[str] = None


class BreedCreate(BaseModel):
    name: str
    name_en: Optional[str] = None
    species_id: str


class InventoryItemCreate(BaseModel):
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


class InvoiceItemInput(BaseModel):
    description: str
    quantity: int
    unit_price: float


class InvoiceCreate(BaseModel):
    client_id: str
    pet_id: Optional[str] = None
    items: List[InvoiceItemInput]
    notes: Optional[str] = None
    status: str = "pending"


class EmailTestRequest(BaseModel):
    to_email: EmailStr
    subject: str = "VetFlow test email"
    message: str = "This is a test email from VetFlow CRM."


class VaccineReminderRequest(BaseModel):
    vaccine_ids: Optional[List[str]] = None
    days_ahead: int = 30


class ChatMessageInput(BaseModel):
    message: str
    session_id: Optional[str] = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: Optional[str]) -> bool:
    if not password_hash:
        return False
    return pwd_context.verify(password, password_hash)


def set_cookie(response: Response, name: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=name,
        value=value,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        path="/",
        max_age=max_age,
    )


def clear_cookie(response: Response, name: str) -> None:
    response.delete_cookie(
        key=name,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        path="/",
    )


async def create_session(response: Response, db: Session, user: UserModel) -> None:
    raw_token = secrets.token_hex(32)
    db.add(
        UserSessionModel(
            session_id=prefixed_id("sess"),
            user_id=user.user_id,
            session_token_hash=sha256(raw_token),
            expires_at=utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        )
    )
    db.commit()
    set_cookie(response, "session_token", raw_token, ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    session_token: Optional[str] = Cookie(default=None),
) -> UserModel:
    token = session_token or request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = (
        db.query(UserSessionModel)
        .filter(
            UserSessionModel.session_token_hash == sha256(token),
            UserSessionModel.expires_at > utcnow(),
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = db.query(UserModel).filter(UserModel.user_id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def company_query(db: Session, model: Any, user: UserModel):
    return db.query(model).filter(model.company_id == user.company_id)


def require_entity(entity: Any, message: str) -> Any:
    if not entity:
        raise HTTPException(status_code=404, detail=message)
    return entity


def maybe_serialize_date(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def user_to_dict(user: UserModel) -> Dict[str, Any]:
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "role": user.role,
        "company_id": user.company_id,
        "company_name": user.company.name if user.company else None,
        "created_at": user.created_at.isoformat(),
    }


def client_to_dict(client: ClientModel) -> Dict[str, Any]:
    return {
        "client_id": client.client_id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "address": client.address,
        "notes": client.notes,
        "created_at": client.created_at.isoformat(),
    }


def species_to_dict(species: SpeciesModel) -> Dict[str, Any]:
    return {
        "species_id": species.species_id,
        "name": species.name,
        "name_en": species.name_en,
        "created_at": species.created_at.isoformat(),
    }


def breed_to_dict(breed: BreedModel) -> Dict[str, Any]:
    return {
        "breed_id": breed.breed_id,
        "species_id": breed.species_id,
        "name": breed.name,
        "name_en": breed.name_en,
        "created_at": breed.created_at.isoformat(),
    }


def doctor_to_dict(doctor: DoctorModel) -> Dict[str, Any]:
    return {
        "doctor_id": doctor.doctor_id,
        "name": doctor.name,
        "email": doctor.email,
        "phone": doctor.phone,
        "specialty": doctor.specialty,
        "license_number": doctor.license_number,
        "schedule": doctor.schedule,
        "active": doctor.active,
        "created_at": doctor.created_at.isoformat(),
    }


def cabinet_to_dict(cabinet: CabinetModel) -> Dict[str, Any]:
    return {
        "cabinet_id": cabinet.cabinet_id,
        "name": cabinet.name,
        "description": cabinet.description,
        "equipment": cabinet.equipment or [],
        "active": cabinet.active,
        "created_at": cabinet.created_at.isoformat(),
    }


def inventory_to_dict(item: InventoryItemModel) -> Dict[str, Any]:
    return {
        "item_id": item.item_id,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "min_stock": item.min_stock,
        "price": item.price,
        "cost": item.cost,
        "expiry_date": item.expiry_date,
        "supplier": item.supplier,
        "notes": item.notes,
        "created_at": item.created_at.isoformat(),
    }


def pet_to_basic_dict(pet: Optional[PetModel]) -> Optional[Dict[str, Any]]:
    if not pet:
        return None
    return {"pet_id": pet.pet_id, "name": pet.name, "client_id": pet.client_id}


def pet_to_dict(
    pet: PetModel,
    client: Optional[ClientModel] = None,
    species: Optional[SpeciesModel] = None,
    breed: Optional[BreedModel] = None,
) -> Dict[str, Any]:
    return {
        "pet_id": pet.pet_id,
        "name": pet.name,
        "species_id": pet.species_id,
        "breed_id": pet.breed_id,
        "client_id": pet.client_id,
        "birth_date": pet.birth_date,
        "weight": pet.weight,
        "gender": pet.gender,
        "color": pet.color,
        "microchip": pet.microchip,
        "notes": pet.notes,
        "created_at": pet.created_at.isoformat(),
        "client_name": client.name if client else None,
        "species_name": species.name if species else None,
        "breed_name": breed.name if breed else None,
    }


def invoice_to_dict(invoice: InvoiceModel, client: Optional[ClientModel] = None, pet: Optional[PetModel] = None) -> Dict[str, Any]:
    return {
        "invoice_id": invoice.invoice_id,
        "invoice_number": invoice.invoice_number,
        "client_id": invoice.client_id,
        "pet_id": invoice.pet_id,
        "items": invoice.items or [],
        "subtotal": invoice.subtotal,
        "tax": invoice.tax,
        "total": invoice.total,
        "notes": invoice.notes,
        "status": invoice.status,
        "created_at": invoice.created_at.isoformat(),
        "paid_at": maybe_serialize_date(invoice.paid_at),
        "client_name": client.name if client else None,
        "client": client_to_dict(client) if client else None,
        "pet": pet_to_basic_dict(pet) if pet else None,
    }


async def seed_defaults_for_company(db: Session, company_id: str) -> None:
    if db.query(SpeciesModel).filter(SpeciesModel.company_id == company_id).count() > 0:
        return
    species_rows = [
        ("spe_dog", "Perro", "Dog"),
        ("spe_cat", "Gato", "Cat"),
        ("spe_bird", "Ave", "Bird"),
        ("spe_rabbit", "Conejo", "Rabbit"),
        ("spe_hamster", "Hamster", "Hamster"),
        ("spe_reptile", "Reptil", "Reptile"),
    ]
    for species_id, name, name_en in species_rows:
        db.add(SpeciesModel(species_id=species_id, company_id=company_id, name=name, name_en=name_en))
    breed_rows = [
        ("bre_labrador", "Labrador Retriever", "Labrador Retriever", "spe_dog"),
        ("bre_german", "Pastor Aleman", "German Shepherd", "spe_dog"),
        ("bre_bulldog", "Bulldog", "Bulldog", "spe_dog"),
        ("bre_poodle", "Caniche", "Poodle", "spe_dog"),
        ("bre_persian", "Persa", "Persian", "spe_cat"),
        ("bre_siamese", "Siames", "Siamese", "spe_cat"),
    ]
    for breed_id, name, name_en, species_id in breed_rows:
        db.add(BreedModel(breed_id=breed_id, company_id=company_id, species_id=species_id, name=name, name_en=name_en))
    db.commit()


def get_google_redirect_uri() -> str:
    return f"{API_BASE_URL}/api/auth/google/callback"


app = FastAPI(title="VetFlow CRM API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
def root() -> Dict[str, str]:
    return {"message": "VetFlow CRM API", "status": "running"}


@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response, db: Session = Depends(get_db)) -> Dict[str, Any]:
    existing = db.query(UserModel).filter(UserModel.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    company_slug = slugify(data.clinic_name)
    base_slug = company_slug
    counter = 1
    while db.query(CompanyModel).filter(CompanyModel.slug == company_slug).first():
        counter += 1
        company_slug = f"{base_slug}-{counter}"

    company = CompanyModel(company_id=prefixed_id("comp"), name=data.clinic_name.strip(), slug=company_slug)
    user = UserModel(
        user_id=prefixed_id("user"),
        company_id=company.company_id,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        name=data.name.strip(),
        role="admin",
    )
    db.add(company)
    db.add(user)
    db.commit()
    db.refresh(user)
    await seed_defaults_for_company(db, company.company_id)
    await create_session(response, db, user)
    return user_to_dict(user)


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(UserModel).filter(UserModel.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await create_session(response, db, user)
    return user_to_dict(user)


@api_router.get("/auth/google/start")
def auth_google_start(response: Response, popup: int = 0) -> Response:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured")
    state = secrets.token_hex(24)
    set_cookie(response, "google_oauth_state", f"{state}:{1 if popup else 0}", 10 * 60)
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": get_google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    url = httpx.URL("https://accounts.google.com/o/oauth2/v2/auth").copy_merge_params(params)
    response.status_code = 307
    response.headers["Location"] = str(url)
    return response


@api_router.get("/auth/google/callback")
async def auth_google_callback(request: Request, code: str, state: str, db: Session = Depends(get_db)) -> HTMLResponse:
    stored = request.cookies.get("google_oauth_state", "")
    stored_state, _, popup = stored.partition(":")
    if not stored_state or state != stored_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    async with httpx.AsyncClient(timeout=30) as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": get_google_redirect_uri(),
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Google token exchange failed: {token_response.text}")
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=502, detail="Google token response missing access_token")

        profile_response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if profile_response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Google profile fetch failed: {profile_response.text}")
        profile = profile_response.json()

    google_sub = profile.get("sub")
    email = (profile.get("email") or "").lower()
    full_name = (profile.get("name") or email).strip()
    picture = profile.get("picture")
    if not google_sub or not email:
        raise HTTPException(status_code=502, detail="Google profile missing required fields")

    user = db.query(UserModel).filter(UserModel.google_sub == google_sub).first()
    if not user:
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            user.google_sub = google_sub
            user.picture = picture or user.picture
            user.name = user.name or full_name
        else:
            company_name = f"{full_name.split(' ')[0] or 'VetFlow'} Clinic"
            company_slug = slugify(company_name)
            base_slug = company_slug
            counter = 1
            while db.query(CompanyModel).filter(CompanyModel.slug == company_slug).first():
                counter += 1
                company_slug = f"{base_slug}-{counter}"
            company = CompanyModel(company_id=prefixed_id("comp"), name=company_name, slug=company_slug)
            user = UserModel(
                user_id=prefixed_id("user"),
                company_id=company.company_id,
                email=email,
                name=full_name,
                google_sub=google_sub,
                picture=picture,
                role="admin",
            )
            db.add(company)
            db.add(user)
    db.commit()
    db.refresh(user)
    await seed_defaults_for_company(db, user.company_id)

    if popup == "1":
        html = f"""<!doctype html>
<html>
  <body>
    <script>
      if (window.opener) {{
        window.opener.postMessage({{ type: "vetflow-auth-success" }}, "{APP_BASE_URL}");
      }}
      window.close();
    </script>
  </body>
</html>"""
        popup_response = HTMLResponse(html)
        clear_cookie(popup_response, "google_oauth_state")
        await create_session(popup_response, db, user)
        return popup_response

    redirect_response = HTMLResponse("", status_code=302)
    redirect_response.headers["Location"] = APP_BASE_URL
    clear_cookie(redirect_response, "google_oauth_state")
    await create_session(redirect_response, db, user)
    return redirect_response


@api_router.get("/auth/me")
def auth_me(user: UserModel = Depends(get_current_user)) -> Dict[str, Any]:
    return user_to_dict(user)


@api_router.post("/auth/logout")
def auth_logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
) -> Dict[str, str]:
    token = request.cookies.get("session_token")
    if token:
        db.query(UserSessionModel).filter(UserSessionModel.session_token_hash == sha256(token)).delete()
        db.commit()
    clear_cookie(response, "session_token")
    return {"message": "Logged out"}


@api_router.post("/seed")
async def seed_company_defaults(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    await seed_defaults_for_company(db, user.company_id)
    return {"message": "Data seeded successfully"}


@api_router.get("/dashboard/stats")
def dashboard_stats(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_clients = company_query(db, ClientModel, user).count()
    total_pets = company_query(db, PetModel, user).count()
    total_doctors = company_query(db, DoctorModel, user).filter(DoctorModel.active.is_(True)).count()
    pending_invoices = company_query(db, InvoiceModel, user).filter(InvoiceModel.status == "pending").count()
    pending_amount = (
        company_query(db, InvoiceModel, user)
        .filter(InvoiceModel.status == "pending")
        .with_entities(func.coalesce(func.sum(InvoiceModel.total), 0))
        .scalar()
        or 0
    )
    low_stock_items = company_query(db, InventoryItemModel, user).filter(InventoryItemModel.quantity <= InventoryItemModel.min_stock).count()
    today = utcnow().strftime("%Y-%m-%d")
    thirty_days = (utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    upcoming_vaccines = (
        company_query(db, VaccineModel, user)
        .filter(VaccineModel.next_due_date >= today, VaccineModel.next_due_date <= thirty_days)
        .count()
    )
    recent_analyses = company_query(db, AnalysisModel, user).order_by(AnalysisModel.created_at.desc()).limit(5).all()
    return {
        "total_clients": total_clients,
        "total_pets": total_pets,
        "total_doctors": total_doctors,
        "pending_invoices": pending_invoices,
        "pending_amount": pending_amount,
        "low_stock_items": low_stock_items,
        "upcoming_vaccines": upcoming_vaccines,
        "recent_analyses": [
            {
                "analysis_id": item.analysis_id,
                "pet_id": item.pet_id,
                "type": item.type,
                "description": item.description,
                "diagnosis": item.diagnosis,
                "treatment": item.treatment,
                "date": item.date,
                "created_at": item.created_at.isoformat(),
            }
            for item in recent_analyses
        ],
    }


@api_router.get("/dashboard/upcoming-vaccines")
def dashboard_upcoming_vaccines(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    today = utcnow().strftime("%Y-%m-%d")
    thirty_days = (utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    vaccines = (
        company_query(db, VaccineModel, user)
        .filter(VaccineModel.next_due_date >= today, VaccineModel.next_due_date <= thirty_days)
        .order_by(VaccineModel.next_due_date.asc())
        .all()
    )
    result = []
    for vaccine in vaccines:
        pet = company_query(db, PetModel, user).filter(PetModel.pet_id == vaccine.pet_id).first()
        client = company_query(db, ClientModel, user).filter(ClientModel.client_id == pet.client_id).first() if pet else None
        result.append(
            {
                "vaccine_id": vaccine.vaccine_id,
                "pet_id": vaccine.pet_id,
                "name": vaccine.name,
                "applied_date": vaccine.applied_date,
                "next_due_date": vaccine.next_due_date,
                "doctor_id": vaccine.doctor_id,
                "batch_number": vaccine.batch_number,
                "notes": vaccine.notes,
                "created_at": vaccine.created_at.isoformat(),
                "pet_name": pet.name if pet else None,
                "client_name": client.name if client else None,
                "client_phone": client.phone if client else None,
            }
        )
    return result


@api_router.get("/clients")
def get_clients(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db), search: Optional[str] = None) -> List[Dict[str, Any]]:
    query = company_query(db, ClientModel, user)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            func.lower(ClientModel.name).like(pattern)
            | func.lower(func.coalesce(ClientModel.email, "")).like(pattern)
            | func.lower(ClientModel.phone).like(pattern)
        )
    return [client_to_dict(item) for item in query.order_by(ClientModel.name.asc()).all()]


@api_router.get("/clients/{client_id}")
def get_client(client_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    client = require_entity(company_query(db, ClientModel, user).filter(ClientModel.client_id == client_id).first(), "Client not found")
    pets = company_query(db, PetModel, user).filter(PetModel.client_id == client_id).all()
    payload = client_to_dict(client)
    payload["pets"] = [pet_to_basic_dict(item) for item in pets]
    return payload


@api_router.post("/clients")
def create_client(data: ClientCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = ClientModel(client_id=prefixed_id("cli"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return client_to_dict(item)


@api_router.put("/clients/{client_id}")
def update_client(client_id: str, data: ClientCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, ClientModel, user).filter(ClientModel.client_id == client_id).first(), "Client not found")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    return client_to_dict(item)


@api_router.delete("/clients/{client_id}")
def delete_client(client_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, ClientModel, user).filter(ClientModel.client_id == client_id).first(), "Client not found")
    db.delete(item)
    db.commit()
    return {"message": "Client deleted"}


@api_router.get("/species")
def get_species(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return [species_to_dict(item) for item in company_query(db, SpeciesModel, user).order_by(SpeciesModel.name.asc()).all()]


@api_router.post("/species")
def create_species(data: SpeciesCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = SpeciesModel(species_id=prefixed_id("spe"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return species_to_dict(item)


@api_router.delete("/species/{species_id}")
def delete_species(species_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, SpeciesModel, user).filter(SpeciesModel.species_id == species_id).first(), "Species not found")
    db.delete(item)
    db.commit()
    return {"message": "Species deleted"}


@api_router.get("/breeds")
def get_breeds(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db), species_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = company_query(db, BreedModel, user)
    if species_id:
        query = query.filter(BreedModel.species_id == species_id)
    return [breed_to_dict(item) for item in query.order_by(BreedModel.name.asc()).all()]


@api_router.post("/breeds")
def create_breed(data: BreedCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    require_entity(company_query(db, SpeciesModel, user).filter(SpeciesModel.species_id == data.species_id).first(), "Species not found")
    item = BreedModel(breed_id=prefixed_id("bre"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return breed_to_dict(item)


@api_router.delete("/breeds/{breed_id}")
def delete_breed(breed_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, BreedModel, user).filter(BreedModel.breed_id == breed_id).first(), "Breed not found")
    db.delete(item)
    db.commit()
    return {"message": "Breed deleted"}


@api_router.get("/pets")
def get_pets(
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    client_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query = company_query(db, PetModel, user)
    if client_id:
        query = query.filter(PetModel.client_id == client_id)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(func.lower(PetModel.name).like(pattern))
    pets = query.order_by(PetModel.name.asc()).all()
    clients = {item.client_id: item for item in company_query(db, ClientModel, user).all()}
    species = {item.species_id: item for item in company_query(db, SpeciesModel, user).all()}
    breeds = {item.breed_id: item for item in company_query(db, BreedModel, user).all()}
    return [pet_to_dict(item, clients.get(item.client_id), species.get(item.species_id), breeds.get(item.breed_id)) for item in pets]


@api_router.get("/pets/{pet_id}")
def get_pet(pet_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    pet = require_entity(company_query(db, PetModel, user).filter(PetModel.pet_id == pet_id).first(), "Pet not found")
    client = company_query(db, ClientModel, user).filter(ClientModel.client_id == pet.client_id).first()
    species = company_query(db, SpeciesModel, user).filter(SpeciesModel.species_id == pet.species_id).first()
    breed = company_query(db, BreedModel, user).filter(BreedModel.breed_id == pet.breed_id).first() if pet.breed_id else None
    vaccines = company_query(db, VaccineModel, user).filter(VaccineModel.pet_id == pet_id).order_by(VaccineModel.applied_date.desc()).all()
    analyses = company_query(db, AnalysisModel, user).filter(AnalysisModel.pet_id == pet_id).order_by(AnalysisModel.date.desc()).all()
    payload = pet_to_dict(pet, client, species, breed)
    payload["client"] = client_to_dict(client) if client else None
    payload["vaccines"] = [
        {
            "vaccine_id": item.vaccine_id,
            "name": item.name,
            "applied_date": item.applied_date,
            "next_due_date": item.next_due_date,
            "doctor_id": item.doctor_id,
            "batch_number": item.batch_number,
            "notes": item.notes,
            "created_at": item.created_at.isoformat(),
        }
        for item in vaccines
    ]
    payload["medical_history"] = [
        {
            "analysis_id": item.analysis_id,
            "type": item.type,
            "description": item.description,
            "diagnosis": item.diagnosis,
            "treatment": item.treatment,
            "date": item.date,
            "next_appointment": item.next_appointment,
            "attachments": item.attachments or [],
            "created_at": item.created_at.isoformat(),
        }
        for item in analyses
    ]
    return payload


@api_router.post("/pets")
def create_pet(data: PetCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    require_entity(company_query(db, ClientModel, user).filter(ClientModel.client_id == data.client_id).first(), "Client not found")
    require_entity(company_query(db, SpeciesModel, user).filter(SpeciesModel.species_id == data.species_id).first(), "Species not found")
    if data.breed_id:
        require_entity(company_query(db, BreedModel, user).filter(BreedModel.breed_id == data.breed_id).first(), "Breed not found")
    item = PetModel(pet_id=prefixed_id("pet"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return get_pet(item.pet_id, user, db)


@api_router.put("/pets/{pet_id}")
def update_pet(pet_id: str, data: PetCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, PetModel, user).filter(PetModel.pet_id == pet_id).first(), "Pet not found")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    return get_pet(item.pet_id, user, db)


@api_router.delete("/pets/{pet_id}")
def delete_pet(pet_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, PetModel, user).filter(PetModel.pet_id == pet_id).first(), "Pet not found")
    db.delete(item)
    db.commit()
    return {"message": "Pet deleted"}


@api_router.get("/doctors")
def get_doctors(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db), active_only: bool = True) -> List[Dict[str, Any]]:
    query = company_query(db, DoctorModel, user)
    if active_only:
        query = query.filter(DoctorModel.active.is_(True))
    return [doctor_to_dict(item) for item in query.order_by(DoctorModel.name.asc()).all()]


@api_router.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, DoctorModel, user).filter(DoctorModel.doctor_id == doctor_id).first(), "Doctor not found")
    return doctor_to_dict(item)


@api_router.post("/doctors")
def create_doctor(data: DoctorCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = DoctorModel(doctor_id=prefixed_id("doc"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return doctor_to_dict(item)


@api_router.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: str, data: DoctorCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, DoctorModel, user).filter(DoctorModel.doctor_id == doctor_id).first(), "Doctor not found")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    return doctor_to_dict(item)


@api_router.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, DoctorModel, user).filter(DoctorModel.doctor_id == doctor_id).first(), "Doctor not found")
    db.delete(item)
    db.commit()
    return {"message": "Doctor deleted"}


@api_router.get("/cabinets")
def get_cabinets(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db), active_only: bool = True) -> List[Dict[str, Any]]:
    query = company_query(db, CabinetModel, user)
    if active_only:
        query = query.filter(CabinetModel.active.is_(True))
    return [cabinet_to_dict(item) for item in query.order_by(CabinetModel.name.asc()).all()]


@api_router.get("/cabinets/{cabinet_id}")
def get_cabinet(cabinet_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, CabinetModel, user).filter(CabinetModel.cabinet_id == cabinet_id).first(), "Cabinet not found")
    return cabinet_to_dict(item)


@api_router.post("/cabinets")
def create_cabinet(data: CabinetCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = CabinetModel(cabinet_id=prefixed_id("cab"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return cabinet_to_dict(item)


@api_router.put("/cabinets/{cabinet_id}")
def update_cabinet(cabinet_id: str, data: CabinetCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, CabinetModel, user).filter(CabinetModel.cabinet_id == cabinet_id).first(), "Cabinet not found")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    return cabinet_to_dict(item)


@api_router.delete("/cabinets/{cabinet_id}")
def delete_cabinet(cabinet_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, CabinetModel, user).filter(CabinetModel.cabinet_id == cabinet_id).first(), "Cabinet not found")
    db.delete(item)
    db.commit()
    return {"message": "Cabinet deleted"}


@api_router.get("/inventory")
def get_inventory(
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    low_stock: bool = False,
) -> List[Dict[str, Any]]:
    query = company_query(db, InventoryItemModel, user)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(func.lower(InventoryItemModel.name).like(pattern))
    if low_stock:
        query = query.filter(InventoryItemModel.quantity <= InventoryItemModel.min_stock)
    return [inventory_to_dict(item) for item in query.order_by(InventoryItemModel.name.asc()).all()]


@api_router.get("/inventory/{item_id}")
def get_inventory_item(item_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, InventoryItemModel, user).filter(InventoryItemModel.item_id == item_id).first(), "Inventory item not found")
    return inventory_to_dict(item)


@api_router.post("/inventory")
def create_inventory_item(data: InventoryItemCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = InventoryItemModel(item_id=prefixed_id("inv"), company_id=user.company_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return inventory_to_dict(item)


@api_router.put("/inventory/{item_id}")
def update_inventory_item(item_id: str, data: InventoryItemCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    item = require_entity(company_query(db, InventoryItemModel, user).filter(InventoryItemModel.item_id == item_id).first(), "Inventory item not found")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    return inventory_to_dict(item)


@api_router.delete("/inventory/{item_id}")
def delete_inventory_item(item_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, str]:
    item = require_entity(company_query(db, InventoryItemModel, user).filter(InventoryItemModel.item_id == item_id).first(), "Inventory item not found")
    db.delete(item)
    db.commit()
    return {"message": "Inventory item deleted"}


@api_router.get("/invoices")
def get_invoices(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db), status: Optional[str] = None) -> List[Dict[str, Any]]:
    query = company_query(db, InvoiceModel, user)
    if status and status != "all":
        query = query.filter(InvoiceModel.status == status)
    invoices = query.order_by(InvoiceModel.created_at.desc()).all()
    clients = {item.client_id: item for item in company_query(db, ClientModel, user).all()}
    pets = {item.pet_id: item for item in company_query(db, PetModel, user).all()}
    return [invoice_to_dict(item, clients.get(item.client_id), pets.get(item.pet_id)) for item in invoices]


@api_router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    invoice = require_entity(company_query(db, InvoiceModel, user).filter(InvoiceModel.invoice_id == invoice_id).first(), "Invoice not found")
    client = company_query(db, ClientModel, user).filter(ClientModel.client_id == invoice.client_id).first()
    pet = company_query(db, PetModel, user).filter(PetModel.pet_id == invoice.pet_id).first() if invoice.pet_id else None
    return invoice_to_dict(invoice, client, pet)


@api_router.post("/invoices")
def create_invoice(data: InvoiceCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    require_entity(company_query(db, ClientModel, user).filter(ClientModel.client_id == data.client_id).first(), "Client not found")
    if data.pet_id:
        require_entity(company_query(db, PetModel, user).filter(PetModel.pet_id == data.pet_id).first(), "Pet not found")
    count = company_query(db, InvoiceModel, user).count()
    invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{count + 1:04d}"
    items = []
    subtotal = 0.0
    for item in data.items:
        total = item.quantity * item.unit_price
        items.append({"description": item.description, "quantity": item.quantity, "unit_price": item.unit_price, "total": total})
        subtotal += total
    tax = subtotal * 0.16
    invoice = InvoiceModel(
        invoice_id=prefixed_id("inv"),
        company_id=user.company_id,
        invoice_number=invoice_number,
        client_id=data.client_id,
        pet_id=data.pet_id,
        items=items,
        subtotal=subtotal,
        tax=tax,
        total=subtotal + tax,
        notes=data.notes,
        status=data.status,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return get_invoice(invoice.invoice_id, user, db)


@api_router.put("/invoices/{invoice_id}/pay")
def pay_invoice(invoice_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    invoice = require_entity(company_query(db, InvoiceModel, user).filter(InvoiceModel.invoice_id == invoice_id).first(), "Invoice not found")
    invoice.status = "paid"
    invoice.paid_at = utcnow()
    db.commit()
    return get_invoice(invoice.invoice_id, user, db)


@api_router.put("/invoices/{invoice_id}/cancel")
def cancel_invoice(invoice_id: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    invoice = require_entity(company_query(db, InvoiceModel, user).filter(InvoiceModel.invoice_id == invoice_id).first(), "Invoice not found")
    invoice.status = "cancelled"
    db.commit()
    return get_invoice(invoice.invoice_id, user, db)


@api_router.get("/email/status")
def email_status(user: UserModel = Depends(get_current_user)) -> Dict[str, Any]:
    return {"configured": bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD), "smtp_user": SMTP_USER or None}


@api_router.post("/email/test")
def send_test_email(data: EmailTestRequest, user: UserModel = Depends(get_current_user)) -> Dict[str, Any]:
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
        raise HTTPException(status_code=400, detail="Email not configured. Set SMTP_USER and SMTP_PASSWORD in environment.")
    return {"message": "Email transport configured", "to": data.to_email}


@api_router.post("/email/vaccine-reminders")
def send_vaccine_reminders(data: VaccineReminderRequest, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    today = utcnow().strftime("%Y-%m-%d")
    future_date = (utcnow() + timedelta(days=data.days_ahead)).strftime("%Y-%m-%d")
    query = company_query(db, VaccineModel, user).filter(VaccineModel.next_due_date >= today, VaccineModel.next_due_date <= future_date)
    if data.vaccine_ids:
        query = query.filter(VaccineModel.vaccine_id.in_(data.vaccine_ids))
    vaccines = query.all()
    sent = 0
    skipped = 0
    results = []
    for vaccine in vaccines:
        pet = company_query(db, PetModel, user).filter(PetModel.pet_id == vaccine.pet_id).first()
        client = company_query(db, ClientModel, user).filter(ClientModel.client_id == pet.client_id).first() if pet else None
        if client and client.email:
            sent += 1
            results.append({"pet": pet.name if pet else None, "email": client.email, "status": "queued"})
        else:
            skipped += 1
            results.append({"pet": pet.name if pet else None, "status": "skipped", "reason": "No client email"})
    return {"message": "Vaccine reminders processed", "sent": sent, "failed": 0, "skipped": skipped, "results": results}


@api_router.post("/ai/chat")
async def ai_chat(data: ChatMessageInput, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    session_id = data.session_id or prefixed_id("chat")
    db.add(
        ChatMessageModel(
            message_id=prefixed_id("msg"),
            company_id=user.company_id,
            user_id=user.user_id,
            session_id=session_id,
            role="user",
            content=data.message,
        )
    )
    db.commit()
    stats = {
        "clients": company_query(db, ClientModel, user).count(),
        "pets": company_query(db, PetModel, user).count(),
        "doctors": company_query(db, DoctorModel, user).filter(DoctorModel.active.is_(True)).count(),
        "pending_invoices": company_query(db, InvoiceModel, user).filter(InvoiceModel.status == "pending").count(),
    }
    response_text = (
        "VetFlow AI aun no esta conectado al modelo final. "
        f"Resumen actual: {stats['clients']} clientes, {stats['pets']} mascotas, "
        f"{stats['doctors']} doctores activos y {stats['pending_invoices']} facturas pendientes."
    )
    db.add(
        ChatMessageModel(
            message_id=prefixed_id("msg"),
            company_id=user.company_id,
            user_id=user.user_id,
            session_id=session_id,
            role="assistant",
            content=response_text,
        )
    )
    db.commit()
    return {"session_id": session_id, "response": response_text}


@api_router.get("/ai/history")
def ai_history(session_id: Optional[str] = None, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    query = company_query(db, ChatMessageModel, user).filter(ChatMessageModel.user_id == user.user_id)
    if session_id:
        query = query.filter(ChatMessageModel.session_id == session_id)
    messages = query.order_by(ChatMessageModel.created_at.asc()).all()
    return [
        {
            "message_id": item.message_id,
            "user_id": item.user_id,
            "session_id": item.session_id,
            "role": item.role,
            "content": item.content,
            "created_at": item.created_at.isoformat(),
        }
        for item in messages
    ]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS or ["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
