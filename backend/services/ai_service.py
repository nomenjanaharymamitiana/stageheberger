import os
import time
import logging

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash-lite"
)

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY est absente du fichier .env"
    )

client = genai.Client(api_key=GEMINI_API_KEY)


def ask_gemini(question: str) -> str:
    """
    Envoie une question textuelle à Gemini.
    Réessaie en cas d'erreur temporaire de disponibilité.
    """

    for tentative in range(3):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=question,
            )

            if not response.text:
                raise RuntimeError(
                    "Gemini n'a retourné aucune réponse."
                )

            return response.text.strip()

        except Exception as erreur:
            message = str(erreur).upper()

            erreur_temporaire = (
                "503" in message
                or "UNAVAILABLE" in message
                or "429" in message
                or "RESOURCE_EXHAUSTED" in message
            )

            if not erreur_temporaire or tentative == 2:
                logger.exception(
                    "Échec de la requête textuelle Gemini."
                )
                raise

            attente = 2 ** (tentative + 1)

            logger.warning(
                "Gemini temporairement indisponible. "
                "Nouvel essai dans %s secondes.",
                attente
            )

            time.sleep(attente)

    raise RuntimeError(
        "Impossible d'obtenir une réponse de Gemini."
    )


def analyser_pdf_avec_gemini(pdf_bytes: bytes, prompt: str) -> str:
    """
    Analyse un PDF avec Gemini, y compris les documents scannés.
    Réessaie automatiquement en cas de surcharge temporaire.
    """

    if not pdf_bytes:
        raise ValueError("Le fichier PDF est vide.")

    if not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("Le fichier fourni n'est pas un PDF valide.")

    contenu_pdf = types.Part.from_bytes(
        data=pdf_bytes,
        mime_type="application/pdf"
    )

    contenu_prompt = types.Part.from_text(text=prompt)

    contenu = [
        types.Content(
            role="user",
            parts=[contenu_pdf, contenu_prompt]
        )
    ]

    for tentative in range(4):
        try:
            print(
                f"Analyse PDF avec Gemini : "
                f"modèle={GEMINI_MODEL}, "
                f"tentative={tentative + 1}/4"
            )

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contenu
            )

            if not response.text:
                raise RuntimeError(
                    "Gemini n'a retourné aucun texte."
                )

            return response.text.strip()

        except Exception as erreur:
            message = str(erreur).upper()

            erreur_temporaire = any(
                code in message
                for code in (
                    "503",
                    "UNAVAILABLE",
                    "429",
                    "RESOURCE_EXHAUSTED",
                    "500",
                    "INTERNAL",
                    "504",
                    "DEADLINE_EXCEEDED"
                )
            )

            if not erreur_temporaire or tentative == 3:
                raise

            attente = 2 ** (tentative + 1)

            print(
                f"Gemini est temporairement indisponible. "
                f"Nouvelle tentative dans {attente} secondes."
            )

            time.sleep(attente)

    raise RuntimeError(
        "Impossible d'analyser le PDF après plusieurs tentatives."
    )
    