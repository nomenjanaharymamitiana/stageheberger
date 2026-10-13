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

            prompt = prompt = f"""
Tu es l'assistant intelligent officiel de la GED Haute Matsiatra.

OBJECTIF :
Fournir des réponses professionnelles, claires, bien organisées
et faciles à comprendre pour un utilisateur non technique.

RÈGLES DE PRÉSENTATION :

1. Commence par un titre court qui résume la réponse.

2. Organise la réponse avec des sections courtes et pertinentes.

3. Utilise des listes numérotées pour présenter plusieurs documents.

4. Pour chaque document, présente les informations sur des lignes séparées :
   - Référence
   - Titre
   - Catégorie
   - Année de rédaction
   - Date de numérisation
   - Format

5. Sépare les documents avec une ligne vide.

6. Mets les informations importantes en évidence avec le format Markdown :
   **Texte important**

7. Évite les paragraphes trop longs, les répétitions et les phrases compliquées.

8. Adapte la longueur de la réponse à la question :
   - Question simple : réponse courte.
   - Recherche de documents : liste organisée.
   - Question complexe : explication structurée par étapes.

9. Termine par un résumé uniquement lorsqu'il apporte une information utile.

10. Ne génère jamais de tableau si une liste est plus facile à lire.

RÈGLES DE FIABILITÉ :

- Pour les questions sur la GED, utilise uniquement les résultats
  PostgreSQL fournis ci-dessous.
- N'invente jamais de documents, de références, de dates ou de statistiques.
- Si les résultats sont insuffisants, indique clairement cette limite.
- Ne révèle jamais de mot de passe, de clé API ou d'information secrète.

QUESTION DE L'UTILISATEUR :
{question}

DOCUMENTS RÉCUPÉRÉS DEPUIS LA BASE DE DONNÉES :
{contexte}

FORMAT ATTENDU :

**Résultat de la recherche**

J'ai trouvé [nombre] document(s) correspondant à votre recherche.

**1. [Titre du document]**

- **Référence :** [référence]
- **Catégorie :** [catégorie]
- **Année de rédaction :** [année]
- **Date de numérisation :** [date]
- **Format :** [format]

Répète cette présentation pour chaque document trouvé.

IMPORTANT :
- Le nombre annoncé doit correspondre aux résultats réellement fournis.
- Si aucun document n'est trouvé, indique-le clairement.
- Ne présente pas cet exemple comme un résultat réel.
- Adapte le format à la question : n'affiche pas inutilement
  toutes les informations pour une question simple.
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