import os
import time

from dotenv import load_dotenv
from google import genai

load_dotenv()

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
    Envoie une question à Gemini.
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
                raise

            attente = 2 ** (tentative + 1)
            print(
                f"Gemini temporairement indisponible. "
                f"Nouvel essai dans {attente} secondes..."
            )
            time.sleep(attente)

    raise RuntimeError("Impossible d'obtenir une réponse de Gemini.")