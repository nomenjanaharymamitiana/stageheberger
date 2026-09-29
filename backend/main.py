import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine

# Imports directs depuis chaque fichier dans le dossier routes/
from routes import journal
from routes.auth import router as auth_router            # Ajustez selon le nom réel du fichier auth
from routes.document import router as document_router    # Ajustez selon le nom réel du fichier document
from routes.utilisateur import router as utilisateur_router  # Assurez-vous que le fichier est routes/utilisateur.py
from routes import auth_router, document_router, utilisateur_router, journal_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)

# --- LISTE DES ORIGINES ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUSION DES ROUTEURS ---
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)
app.include_router(journal_router)  # Utilisez journal_router au lieu de journal.router


@app.get("/")
def root():
    return {"message": "API GED Haute Matsiatra fonctionnelle"}