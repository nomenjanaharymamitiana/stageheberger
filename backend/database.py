import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from supabase import create_client, Client

load_dotenv()

# --- DATABASE CONFIGURATION ---
# Utilise ta BDD locale en fallback si DATABASE_URL n'est pas définie
DEFAULT_LOCAL_DB = "postgresql://postgres:allerenavant@localhost:5433/ged_db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_LOCAL_DB)

# Correction du préfixe pour SQLAlchemy en cas d'URL de prod (ex: Render/Heroku)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine, 
    expire_on_commit=False
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- SUPABASE STORAGE CLIENT ---
# Récupération des clés Supabase depuis le .env (local ou variables Render)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

supabase_client: Client = None

if SUPABASE_URL and SUPABASE_SECRET_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
else:
    print("⚠️ Attention: SUPABASE_URL ou SUPABASE_SECRET_KEY est manquante dans le .env")