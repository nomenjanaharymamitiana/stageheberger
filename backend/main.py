import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from routes.assistant import router as assistant_router
import models
from database import engine

from routes.auth import router as auth_router
from routes.document import router as document_router
from routes.utilisateur import router as utilisateur_router
from routes.journal import router as journal_router
from routes.demande import router as demande_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("==========================================")
    print("DEMARRAGE API GED HAUTE MATSIATRA")
    print("==========================================")

    models.Base.metadata.create_all(bind=engine)

    yield


app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)

# Enregistrement des routes
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)
app.include_router(journal_router)
app.include_router(demande_router)
app.include_router(assistant_router)
# Origines autorisées pour le frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://stageheberger.vercel.app",
]

# CORS doit envelopper l'application complète.
app = CORSMiddleware(
    app=app,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)