import logging
import re
import unicodedata
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, extract
from sqlalchemy.orm import Session

from database import get_db
from models.document import Document
from routes.auth import get_current_user
from crud import document as crud_document

from services.ai_service import ask_gemini
from services.pdf_service import extraire_texte_pdf
from services.metadata_service import extraire_metadonnees


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/assistant",
    tags=["Assistant IA"],
)


# ============================================================
# MODÈLES DE DONNÉES
# ============================================================

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str


# ============================================================
# OUTILS
# ============================================================

def normaliser_texte(texte: str) -> str:
    """Normalise le texte pour faciliter les recherches."""
    texte = texte.lower().strip()
    texte = unicodedata.normalize("NFD", texte)
    texte = "".join(
        caractere
        for caractere in texte
        if unicodedata.category(caractere) != "Mn"
    )
    return texte


def date_vers_chaine(valeur) -> Optional[str]:
    """Convertit une date en chaîne sans provoquer d'erreur."""
    if valeur is None:
        return None

    if isinstance(valeur, (date, datetime)):
        return valeur.isoformat()

    return str(valeur)


def verifier_role_gestion_ou_rsi(current_user):
    """Autorise les rôles DAG, RH et RSI à utiliser l'assistant/analyse."""
    role = getattr(current_user, "type_user", None) or getattr(current_user, "role", None)
    if role not in ["RSI", "DAG", "RH"]:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux rôles autorisés (RSI, DAG, RH).",
        )


# ============================================================
# RECHERCHE DE DOCUMENTS DANS POSTGRESQL
# ============================================================

def rechercher_documents(question: str, db: Session):
    """
    Recherche les documents actifs avec SQLAlchemy.

    Gemini ne construit pas de requêtes SQL.
    """

    q = normaliser_texte(question)

    query = db.query(Document).filter(
        Document.date_suppression.is_(None)
    )

    # --------------------------------------------------------
    # 1. Référence
    # Exemples : DOC-001, REF-2025-001
    # --------------------------------------------------------

    reference = re.search(
        r"\b[A-Z]{2,10}-[A-Z0-9-]+\b",
        question,
        re.IGNORECASE,
    )

    if reference:
        ref = reference.group(0)

        query = query.filter(
            Document.num_ref.ilike(f"%{ref}%")
        )

    # --------------------------------------------------------
    # 2. Année
    # --------------------------------------------------------

    annee = re.search(
        r"\b(19\d{2}|20\d{2})\b",
        question,
    )

    if annee:
        annee_value = int(annee.group(1))

        if any(
            mot in q
            for mot in [
                "numerise",
                "numerises",
                "numerisee",
                "numerisees",
                "numerisation",
            ]
        ):
            query = query.filter(
                extract("year", Document.date_num) == annee_value
            )
        else:
            query = query.filter(
                Document.annee_redac == str(annee_value)
            )

    # --------------------------------------------------------
    # 3. Catégorie
    # --------------------------------------------------------

    categories = [
        "nomination",
        "correspondance",
        "decision",
        "rapport",
        "note de service",
        "arrete",
        "contrat",
        "conge",
        "ordonnance",
        "finance",
        "budget",
    ]

    categorie_detectee = next(
        (
            categorie
            for categorie in categories
            if categorie in q
        ),
        None,
    )

    if categorie_detectee:
        variantes = {
            "decision": ["décision", "decision"],
            "arrete": ["arrêté", "arrete"],
            "conge": ["congé", "conge"],
        }

        termes = variantes.get(
            categorie_detectee,
            [categorie_detectee],
        )

        conditions = []

        for terme in termes:
            conditions.extend([
                Document.cat.ilike(f"%{terme}%"),
                Document.title.ilike(f"%{terme}%"),
            ])

        query = query.filter(or_(*conditions))

    # --------------------------------------------------------
    # 4. Trier les résultats du plus récent au plus ancien
    # --------------------------------------------------------

    query = query.order_by(
        Document.date_num.desc()
    )

    documents = query.limit(20).all()

    return [
        {
            "reference": doc.num_ref,
            "titre": doc.title,
            "categorie": doc.cat,
            "annee_redaction": doc.annee_redac,
            "date_numerisation": date_vers_chaine(doc.date_num),
            "format": doc.format,
        }
        for doc in documents
    ]


# ============================================================
# CHAT DE L'ASSISTANT
# ============================================================

@router.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assistant conversationnel de la GED Haute Matsiatra."""

    verifier_role_gestion_ou_rsi(current_user)

    question = data.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Veuillez saisir une question.",
        )

    q = normaliser_texte(question)

    mots_documents = [
        "document",
        "documents",
        "nomination",
        "numerise",
        "numerisation",
        "reference",
        "rapport",
        "correspondance",
        "decision",
        "arrete",
        "contrat",
        "note de service",
        "dernier",
        "derniers",
        "redige",
        "redaction",
        "annee",
        "combien",
    ]

    question_documents = any(
        mot in q for mot in mots_documents
    )

    if question_documents:
        try:
            resultats = rechercher_documents(question, db)

            demande_compte = (
                "combien" in q
                or "nombre de documents" in q
                or "total des documents" in q
            )

            if demande_compte:
                demande_categorie = any(
                    mot in q
                    for mot in [
                        "nomination",
                        "rapport",
                        "correspondance",
                        "contrat",
                        "decision",
                        "arrete",
                        "conge",
                        "ordonnance",
                        "finance",
                        "budget",
                    ]
                )

                annee = re.search(
                    r"\b(19\d{2}|20\d{2})\b",
                    question,
                )

                reference = re.search(
                    r"\b[A-Z]{2,10}-[A-Z0-9-]+\b",
                    question,
                    re.IGNORECASE,
                )

                if not demande_categorie and not annee and not reference:
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
                (
                    f"- Référence : {doc['reference']}; "
                    f"Titre : {doc['titre']}; "
                    f"Catégorie : {doc['categorie']}; "
                    f"Année de rédaction : {doc['annee_redaction']}; "
                    f"Date de numérisation : {doc['date_numerisation']}; "
                    f"Format : {doc['format']}"
                )
                for doc in resultats
            )

            prompt = f"""
Tu es l'assistant de la GED Haute Matsiatra.

Réponds en français, clairement et de manière concise.

RÈGLES :
- Utilise uniquement les résultats fournis pour répondre
  aux questions sur les documents.
- N'invente aucune référence, aucun titre ni aucune date.
- Si une information est absente, indique-le clairement.
- Ne prétends pas avoir consulté d'autres données.
- Ne révèle aucune information secrète.
- Les résultats correspondent à des documents actifs.
- Si plusieurs résultats sont fournis, distingue-les clairement.

Question de l'utilisateur :
{question}

Résultats récupérés depuis PostgreSQL :
{contexte}

Réponds à la question en t'appuyant uniquement sur ces résultats.
"""

            answer = ask_gemini(prompt)

            return ChatResponse(answer=answer)

        except HTTPException:
            raise

        except Exception:
            logger.exception(
                "Erreur pendant la recherche documentaire."
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "Impossible de traiter la recherche documentaire "
                    "pour le moment. Réessaie plus tard."
                ),
            )

    prompt_general = f"""
Tu es l'assistant intelligent officiel de la GED Haute Matsiatra.

OBJECTIF :
Fournir des réponses professionnelles, claires et utiles.

RÈGLES :
- Réponds en français.
- Structure la réponse avec des titres et des listes si nécessaire.
- N'invente pas de documents, de références, de dates ou de statistiques.
- Ne prétends pas avoir consulté PostgreSQL si aucune recherche
  n'a été effectuée.
- Si tu ne disposes pas d'une information, indique-le.
- Ne révèle aucune clé API, aucun mot de passe ni secret.

QUESTION :
{question}

Réponds de manière claire, professionnelle et utile.
"""

    try:
        answer = ask_gemini(prompt_general)
        return ChatResponse(answer=answer)

    except Exception:
      logger.exception(
          "L'assistant général est indisponible."
      )

      raise HTTPException(
          status_code=503,
          detail="L'assistant IA est temporairement indisponible.",
      )


# ============================================================
# ANALYSE LOCALE DE SECOURS — SANS GEMINI
# ============================================================

def analyser_document_local(
    texte: str,
    reference: str,
    titre: Optional[str] = None,
    categorie: Optional[str] = None,
    annee: Optional[str] = None,
) -> str:
    """
    Produit une fiche d'analyse heuristique sans appel à une API.
    """

    if not texte or not texte.strip():
        return """# Analyse locale du document

Le texte du PDF est vide ou n'a pas pu être extrait.
Une analyse fiable est impossible.
"""

    texte_propre = re.sub(r"[ \t]+", " ", texte)
    texte_propre = re.sub(
        r"\n{3,}",
        "\n\n",
        texte_propre,
    ).strip()

    try:
        metadata = extraire_metadonnees(texte_propre) or {}
    except Exception:
        logger.exception(
            "Impossible d'extraire les métadonnées localement."
        )
        metadata = {}

    titre_detecte = (
        titre
        or metadata.get("title")
        or "Non précisé"
    )

    categorie_detectee = (
        categorie
        or metadata.get("cat")
        or "Non précisée"
    )

    annee_detectee = (
        annee
        or metadata.get("annee_redac")
        or "Non précisée"
    )

    dates = list(dict.fromkeys(
        re.findall(
            r"\b(?:0?[1-9]|[12]\d|3[01])"
            r"[/-](?:0?[1-9]|1[0-2])"
            r"[/-](?:19|20)\d{2}\b"
            r"|\b(?:19|20)\d{2}\b",
            texte_propre,
        )
    ))

    mots_cles = [
        "arrêté",
        "arrete",
        "décision",
        "decision",
        "ordonnance",
        "nomination",
        "nommé",
        "nommee",
        "portant",
        "relatif",
        "relative",
        "finance",
        "budget",
        "contrat",
        "ministère",
        "ministere",
        "commune",
        "direction",
        "obligation",
        "autorisation",
        "approbation",
        "développement",
        "developpement",
    ]

    texte_normalise = normaliser_texte(texte_propre)

    elements = [
        mot
        for mot in mots_cles
        if normaliser_texte(mot) in texte_normalise
    ]

    lignes = [
        re.sub(r"\s+", " ", ligne).strip()
        for ligne in texte_propre.splitlines()
        if ligne.strip()
    ]

    marqueurs = [
        "objet",
        "portant",
        "relatif",
        "relative",
        "décide",
        "decide",
        "article",
        "considérant",
        "considerant",
        "est nommé",
        "est nomme",
        "nomination",
        "ordonne",
    ]

    lignes_prioritaires = []

    for ligne in lignes:
        ligne_normalisee = normaliser_texte(ligne)

        if any(
            normaliser_texte(marqueur) in ligne_normalisee
            for marqueur in marqueurs
        ):
            if ligne not in lignes_prioritaires:
                lignes_prioritaires.append(ligne)

        if len(lignes_prioritaires) >= 10:
            break

    extraits = lignes_prioritaires[:8]

    if not extraits:
        extraits = lignes[:8]

    resume = (
        "\n".join(
            f"- {ligne[:500]}"
            for ligne in extraits
        )
        if extraits
        else "- Aucun extrait exploitable."
    )

    dates_formatees = (
        ", ".join(dates[:20])
        if dates
        else "Aucune date détectée automatiquement."
    )

    mots_cles_formates = (
        ", ".join(dict.fromkeys(elements))
        if elements
        else "Aucun mot-clé prédéfini détecté."
    )

    return f"""# Analyse locale du document

**Mode d'analyse :** secours local, sans Gemini.

## 1. Identification du document

- Référence : 
{reference or "Non précisée"}
- Titre : 
{titre_detecte}
- Catégorie : 
{categorie_detectee}
- Année de rédaction : 
{annee_detectee}

## 2. Résumé du contenu disponible

Cette analyse locale ne comprend pas de modèle linguistique.
Les passages ci-dessous sont des extraits du texte et ne constituent
pas un résumé sémantique garanti.

{resume}

## 3. Informations essentielles détectées
Mots-clés présents dans le texte : {mots_cles_formates}

## 4. Dates détectées

{dates_formatees}

## 5. Décisions et mesures

Les décisions ne peuvent pas être confirmées automatiquement.

## 6. Personnes et organismes concernés

L'identification fiable des personnes et organismes nécessite
une analyse approfondie du texte.

## 7. Obligations et échéances

Les obligations, les responsables et les délais doivent être vérifiés
dans le document original.

## 8. Points de vigilance

- L'analyse est heuristique et non sémantique.
- Le texte extrait peut contenir des erreurs de reconnaissance OCR.

## 9. Mots-clés

{mots_cles_formates}

## 10. Conclusion

Le texte extrait a été traité localement.
"""


# ============================================================
# ANALYSE INTELLIGENTE D'UN PDF
# ============================================================

@router.post("/analyser-pdf/{num_ref}")
def analyser_pdf(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Analyse un PDF stocké dans la GED (ouvert pour RSI, DAG, RH).
    """

    # 1. Vérification des rôles autorisés (RSI, DAG, RH)
    verifier_role_gestion_ou_rsi(current_user)

    # 2. Récupérer le document
    doc = crud_document.get_document_by_ref(
        db=db,
        num_ref=num_ref,
    )

    if not doc or doc.date_suppression is not None:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable ou supprimé.",
        )

    # 3. Vérifier la présence du PDF
    if not doc.file_data:
        raise HTTPException(
            status_code=404,
            detail="Le fichier PDF n'est pas disponible.",
        )

    try:
        pdf_bytes = bytes(doc.file_data)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422,
            detail="Impossible de récupérer les données du PDF.",
        )

    # 4. Vérifier la signature du PDF
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=422,
            detail="Le fichier enregistré n'est pas un PDF valide.",
        )

    # 5. Extraire le texte
    try:
        texte_pdf = extraire_texte_pdf(pdf_bytes)
    except ValueError:
        logger.exception(
            "Impossible d'extraire le texte du PDF %s",
            num_ref,
        )
        raise HTTPException(
            status_code=422,
            detail=(
                "Impossible d'extraire le texte de ce PDF. "
                "Vérifie que le document est lisible."
            ),
        )
    except Exception:
        logger.exception(
            "Erreur pendant l'extraction du PDF %s",
            num_ref,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "Le service d'extraction du PDF est temporairement "
                "indisponible."
            ),
        )

    if not texte_pdf or not texte_pdf.strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "Aucun texte exploitable n'a été extrait du PDF. "
                "Vérifie l'OCR ou la qualité du document."
            ),
        )

    # promp
    prompt = f"""
Tu es un assistant spécialisé dans l'analyse des documents
administratifs de la GED Haute Matsiatra.

MISSION :
Analyse le contenu extrait et produis une fiche claire,
professionnelle et fidèle au document.

RÈGLES IMPORTANTES :
- Réponds en français.
- Utilise uniquement le contenu fourni et les métadonnées indiquées.
- N'invente aucune information.
- Si une information manque, écris « Non précisé dans le document ».
- Signale les éventuelles erreurs OCR.
- Distingue les décisions explicites des observations.

MÉTADONNÉES DE LA GED :
- Référence : 
{doc.num_ref}
- Titre : 
{doc.title or "Non renseigné"}
- Catégorie : 
{doc.cat or "Non renseignée"}
- Année de rédaction : 
{doc.annee_redac or "Non renseignée"}
- Date de numérisation : 
{doc.date_num or "Non renseignée"}
- Format : 
{doc.format or "Non renseigné"}

RUBRIQUES OBLIGATOIRES :

1. Identification du document
2. Résumé général
3. Informations essentielles
4. Décisions et mesures
5. Personnes et organismes concernés
6. Dates et échéances
7. Obligations et actions
8. Points de vigilance
9. Mots-clés
10. Conclusion

CONTENU EXTRAIT DU PDF :
--- DÉBUT DU DOCUMENT ---
{texte_pdf}
--- FIN DU DOCUMENT ---

Produis maintenant la fiche d'analyse en respectant toutes les règles.
"""

    # 7. Gemini avec analyse locale de secours
    try:
        analyse = ask_gemini(prompt)
        mode_analyse = "gemini"

    except Exception:
        logger.exception(
            "Échec de Gemini pour le document %s. "
            "Bascule vers l'analyse locale.",
            num_ref,
        )

        try:
            analyse = analyser_document_local(
                texte=texte_pdf,
                reference=doc.num_ref,
                titre=doc.title,
                categorie=doc.cat,
                annee=(
                    str(doc.annee_redac)
                    if doc.annee_redac is not None
                    else None
                ),
            )
            mode_analyse = "local"

        except Exception:
            logger.exception(
                "Échec de l'analyse locale du document %s",
                num_ref,
            )
            raise HTTPException(
                status_code=503,
                detail=(
                    "Gemini est indisponible et l'analyse locale "
                    "a échoué."
                ),
            )

    # 8. Réponse au frontend
    return {
        "reference": doc.num_ref,
        "titre": doc.title,
        "analyse": analyse,
        "mode_analyse": mode_analyse,
    }