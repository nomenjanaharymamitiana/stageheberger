import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

import models

from database import engine, SessionLocal

from crud.document import purge_expired_trash_documents

from routes.assistant import router as assistant_router
from routes.auth import router as auth_router
from routes.document import router as document_router
from routes.utilisateur import router as utilisateur_router
from routes.journal import router as journal_router
from routes.demande import router as demande_router


# =========================================================
# PURGE AUTOMATIQUE DE LA CORBEILLE
# =========================================================

def run_trash_purge():
    """
    Supprime définitivement les documents présents
    dans la corbeille depuis au moins 30 jours.
    """

    db = SessionLocal()

    try:
        purge_expired_trash_documents(db)

        print(
            "[CORBEILLE] Vérification terminée : "
            "les documents expirés ont été supprimés."
        )

    except Exception as e:
        db.rollback()

        print(
            f"[CORBEILLE] Erreur pendant la purge : {e}"
        )

    finally:
        db.close()


async def trash_purge_loop():
    """
    Exécute la purge au démarrage de l'API,
    puis toutes les heures.
    """

    while True:
        await asyncio.to_thread(run_trash_purge)

        await asyncio.sleep(3600)


# =========================================================
# CYCLE DE VIE DE L'APPLICATION FASTAPI
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("==========================================")
    print("DEMARRAGE API GED HAUTE MATSIATRA")
    print("==========================================")

    # Création des tables si elles n'existent pas
    models.Base.metadata.create_all(bind=engine)

    # Démarrage de la purge automatique
    purge_task = asyncio.create_task(
        trash_purge_loop()
    )

    try:
        yield

    finally:
        # Arrêt propre de la tâche à l'arrêt de l'API
        purge_task.cancel()

        try:
            await purge_task

        except asyncio.CancelledError:
            pass

        print("[CORBEILLE] Tâche automatique arrêtée.")


# =========================================================
# APPLICATION FASTAPI
# =========================================================

app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)


# =========================================================
# ENREGISTREMENT DES ROUTES
# =========================================================

app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)
app.include_router(journal_router)
app.include_router(demande_router)
app.include_router(assistant_router)


# =========================================================
# CONFIGURATION CORS
# =========================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://stageheberger.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTE DE TEST
# =========================================================

@app.get("/")
def accueil():
    return {
        "message": "API GED Haute Matsiatra opérationnelle",
        "status": "OK"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }