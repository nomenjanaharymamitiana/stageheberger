from .auth import router as auth_router
from .document import router as document_router
from .utilisateur import router as utilisateur_router  # 👈 S'assurer que routes/utilisateur.py existe
from .journal import router as journal_router          # 👈 S'assurer que routes/journal.py existe
#integrer le route demandes
from .demande import router as demande_router  # 👈 S'assurer que routes/demande.py existe
__all__ = [
    "auth_router",
    "document_router",
    "utilisateur_router",
    "journal_router",
    "demande_router",
]