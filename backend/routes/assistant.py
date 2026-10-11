from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from routes.auth import get_current_user
from services.ai_service import ask_gemini

router = APIRouter(
    prefix="/api/v1/assistant",
    tags=["Assistant IA"]
)


# Structure d'une question envoyée par React
class ChatRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=2000
    )


# Structure de la réponse envoyée à React
class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    current_user=Depends(get_current_user)
):
    """
    Point d'entrée de l'assistant IA.
    L'utilisateur doit être authentifié.
    """

    # Vérifier que la question n'est pas vide
    question = data.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Veuillez saisir une question."
        )

    # Réserver cette première version au rôle RSI
    if current_user.type_user != "RSI":
        raise HTTPException(
            status_code=403,
            detail="Accès réservé au rôle RSI."
        )

    # Consignes de réponse pour Gemini
    prompt = f"""
Tu es l'assistant IA de la GED Haute Matsiatra.

Tes missions :
- Répondre en français.
- Expliquer clairement les concepts informatiques.
- Aider l'utilisateur à comprendre le fonctionnement d'une GED.
- Ne jamais prétendre avoir consulté la base de données.
  Tu n'y as pas encore accès.
- Si une question nécessite des données réelles de la GED,
  expliquer que cette fonctionnalité sera bientôt disponible.
- Ne jamais demander de mot de passe ni de clé API.

Question de l'utilisateur :
{question}
"""

    try:
        answer = ask_gemini(prompt)

        return ChatResponse(answer=answer)

    except Exception:
        # Ne pas révéler la clé API ou les détails internes
        raise HTTPException(
            status_code=503,
            detail="L'assistant IA est temporairement indisponible."
        )