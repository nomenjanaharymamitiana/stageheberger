import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, extract
from sqlalchemy.orm import Session

from database import get_db
from models.document import Document
from routes.auth import get_current_user
from services.ai_service import ask_gemini


router = APIRouter(
    prefix="/api/v1/assistant",
    tags=["Assistant IA"]
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str


def rechercher_documents(question: str, db: Session):
    """
    Recherche les documents actifs dans PostgreSQL.

    Cette fonction n'utilise pas Gemini pour construire du SQL.
    Les recherches sont effectuées avec SQLAlchemy.
    """

    q = question.lower().strip()

    # On commence par les documents actifs.
    query = db.query(Document).filter(
        Document.date_suppression.is_(None)
    )

    # --------------------------------------------------
    # 1. Détecter une référence de document
    # --------------------------------------------------

    # Exemples : DOC-001, REF-2025-001
    reference = re.search(
        r"\b[A-Z]{2,10}-[A-Z0-9-]+\b",
        question,
        re.IGNORECASE
    )

    if reference:
        ref = reference.group(0)

        query = query.filter(
            Document.num_ref.ilike(f"%{ref}%")
        )

    # --------------------------------------------------
    # 2. Détecter une année
    # --------------------------------------------------

    annee = re.search(r"\b(19\d{2}|20\d{2})\b", question)

    if annee:
        annee_value = annee.group(1)

        if any(mot in q for mot in [
            "numérisé", "numérisés",
            "numérisée", "numérisées",
            "numérisation"
        ]):
            # Année de numérisation : date_num
            query = query.filter(
                extract("year", Document.date_num)
                == int(annee_value)
            )

        else:
            # Par défaut : année de rédaction
            query = query.filter(
                Document.annee_redac == annee_value
            )

    # --------------------------------------------------
    # 3. Détecter quelques catégories connues
    # --------------------------------------------------

    categories = [
        "nomination",
        "correspondance",
        "décision",
        "decision",
        "rapport",
        "note de service",
        "arrêté",
        "arrete",
        "contrat",
        "congé",
        "conge",
    ]

    categorie_detectee = next(
        (cat for cat in categories if cat in q),
        None
    )

    if categorie_detectee:
        query = query.filter(
            or_(
                Document.cat.ilike(
                    f"%{categorie_detectee}%"
                ),
                Document.title.ilike(
                    f"%{categorie_detectee}%"
                )
            )
        )

    # --------------------------------------------------
    # 4. Recherche de documents récents
    # --------------------------------------------------

    if any(mot in q for mot in [
        "dernier", "derniers",
        "dernière", "dernières",
        "récent", "récents",
        "recente", "recentes"
    ]):
        query = query.order_by(
            Document.date_num.desc()
        )

    else:
        query = query.order_by(
            Document.date_num.desc()
        )

    # Limiter le nombre de résultats
    documents = query.limit(20).all()

    # Ne transmettre que les champs nécessaires.
    # file_data et file_path ne sont pas envoyés à Gemini.
    return [
        {
            "reference": doc.num_ref,
            "titre": doc.title,
            "categorie": doc.cat,
            "annee_redaction": doc.annee_redac,
            "date_numerisation": (
                doc.date_num.isoformat()
                if doc.date_num
                else None
            ),
            "format": doc.format,
        }
        for doc in documents
    ]


@router.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assistant IA de la GED Haute Matsiatra.
    """

    question = data.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Veuillez saisir une question."
        )

    # Conserver la restriction existante.
    if current_user.type_user != "RSI":
        raise HTTPException(
            status_code=403,
            detail="Accès réservé au rôle RSI."
        )

    q = question.lower()

    # --------------------------------------------------
    # Questions concernant les documents
    # --------------------------------------------------

    mots_documents = [
        "document", "documents",
        "nomination", "numérisé",
        "numérisés", "numérisation",
        "référence", "reference",
        "rapport", "correspondance",
        "décision", "decision",
        "arrêté", "arrete",
        "contrat", "note de service",
        "dernier", "derniers",
        "rédigé", "redige",
        "rédaction", "annee",
        "année", "combien",
    ]

    question_documents = any(
        mot in q for mot in mots_documents
    )

    if question_documents:
        try:
            resultats = rechercher_documents(question, db)

            # Une question de comptage doit compter
            # les documents actifs de la base.
            demande_compte = (
                "combien" in q
                or "nombre de documents" in q
                or "total des documents" in q
            )

            if demande_compte and not any(
                mot in q for mot in [
                    "nomination", "rapport",
                    "correspondance", "contrat",
                    "décision", "decision",
                    "arrêté", "arrete"
                ]
            ):
                total = (
                    db.query(Document)
                    .filter(
                        Document.date_suppression.is_(None)
                    )
                    .count()
                )

                return ChatResponse(
                    answer=(
                        f"La GED contient actuellement "
                        f"{total} document(s) actif(s)."
                    )
                )

            if not resultats:
                return ChatResponse(
                    answer=(
                        "Aucun document actif correspondant "
                        "aux critères de recherche n'a été trouvé."
                    )
                )

            contexte = "\n".join(
                [
                    f"- Référence : {doc['reference']}; "
                    f"Titre : {doc['titre']}; "
                    f"Catégorie : {doc['categorie']}; "
                    f"Année de rédaction : "
                    f"{doc['annee_redaction']}; "
                    f"Date de numérisation : "
                    f"{doc['date_numerisation']}; "
                    f"Format : {doc['format']}"
                    for doc in resultats
                ]
            )

            prompt = f"""
Tu es l'assistant de la GED Haute Matsiatra.

Réponds en français, clairement et de manière concise.

RÈGLES :
- Utilise uniquement les données ci-dessous pour répondre
  aux questions sur les documents.
- N'invente jamais de référence, de titre ou de date.
- Si une information n'est pas présente, dis-le.
- Ne prétends pas avoir consulté d'autres données.
- Ne révèle aucune information secrète.
- Les résultats fournis correspondent à des documents actifs.

Question de l'utilisateur :
{question}

Résultats récupérés depuis PostgreSQL :
{contexte}

Réponds maintenant à la question en t'appuyant sur ces résultats.
"""

            answer = ask_gemini(prompt)

            return ChatResponse(answer=answer)

        except Exception:
            # Ne pas exposer les détails de connexion ou les secrets.
            raise HTTPException(
                status_code=503,
                detail=(
                    "Impossible de rechercher les documents "
                    "pour le moment. Réessaie plus tard."
                )
            )

    # --------------------------------------------------
    # Questions générales : réponse de Gemini
    # --------------------------------------------------

    prompt_general = f"""
Tu es l'assistant IA de la GED Haute Matsiatra.

Réponds en français.
Explique clairement les concepts informatiques.
N'invente pas de données réelles issues de la GED.
Si une question nécessite des données de la GED
que tu n'as pas reçues, précise cette limite.
Ne demande jamais de mot de passe ni de clé API.

Question :
{question}
"""

    try:
        answer = ask_gemini(prompt_general)
        return ChatResponse(answer=answer)

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="L'assistant IA est temporairement indisponible."
        )