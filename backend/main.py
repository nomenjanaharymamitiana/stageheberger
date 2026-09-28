from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routes import auth_router, document_router
from routes.utlisateur import router as utilisateur_router

# Création des tables au démarrage de l'application
@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)

@app.get("/")
def root():
    return {"message": "API GED Haute Matsiatra fonctionnelle"}