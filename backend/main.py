import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine

from routes.auth import router as auth_router
from routes.document import router as document_router
from routes.utilisateur import router as utilisateur_router
from routes.journal import router as journal_router
from routes.demande import router as demande_router


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS
# ============================================================

origins = [
    # Local
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    # Production Vercel
    "https://stageheberger-jqr0mqhev-nomenjanaharymamitianas-projects.vercel.app",
]

# Ajout éventuel d'une autre URL depuis Render
frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    frontend_url = frontend_url.rstrip("/")

    if frontend_url not in origins:
        origins.append(frontend_url)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)
app.include_router(journal_router)
app.include_router(demande_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "API GED Haute Matsiatra fonctionnelle"
    }