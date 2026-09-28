import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.wsgi import WSGIMiddleware

import models
from database import engine
from routes import auth_router, document_router
from routes.utlisateur import router as utilisateur_router


# Création des tables au démarrage
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Remarque : Si vous utilisez Alembic pour les migrations, 
    # create_all est sans danger (il ne réécrira pas les tables existantes).
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)

# --- CONFIGURATION CORS DYNAMIQUE ---
# Liste des origines autorisées en local et en production
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# Si l'URL du frontend est définie sur Render via une variable d'environnement
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    # Permet de charger toutes les origines en dev si besoin, 
    # ou d'utiliser la liste précise pour respecter allow_credentials=True
    allow_origin_regex=r"https?://.*" if os.getenv("ENVIRONMENT") == "dev" else None,
    allow_origins=origins if os.getenv("ENVIRONMENT") != "dev" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUSION DES ROUTEURS ---
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)


@app.get("/")
def root():
    return {"message": "API GED Haute Matsiatra fonctionnelle"}