import io
import logging

import pytesseract
from pdf2image import convert_from_bytes
from pypdf import PdfReader

logger = logging.getLogger(__name__)

# Nombre maximal de pages acceptées pour un document.
MAX_PAGES = 100

# Nombre maximal de pages nécessitant un OCR par analyse.
MAX_PAGES_OCR = 20

# Quantité maximale de texte retournée.
MAX_TEXTE = 20000

# Nombre minimal de caractères pour considérer
# qu'une page contient suffisamment de texte exploitable.
MIN_TEXTE_PAGE = 40


def extraire_texte_pdf(pdf_bytes: bytes) -> str:
    """
    Extrait le texte de chaque page d'un PDF.

    - Utilise pypdf pour les pages contenant du texte.
    - Utilise Tesseract pour les pages scannées.
    - Gère les PDF mixtes.
    - Limite le nombre de pages et la taille du texte.
    """

    # 1. Vérifier le fichier.
    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("Le fichier PDF est invalide.")

    try:
        lecteur = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as erreur:
        logger.warning("Impossible de lire le PDF : %s", erreur)
        raise ValueError("Impossible de lire ce fichier PDF.") from erreur

    # 2. Vérifier si le PDF est protégé.
    if lecteur.is_encrypted:
        raise ValueError(
            "Le PDF est protégé par un mot de passe."
        )

    nombre_pages = len(lecteur.pages)

    if nombre_pages == 0:
        raise ValueError("Le PDF ne contient aucune page.")

    if nombre_pages > MAX_PAGES:
        raise ValueError(
            f"Le PDF contient {nombre_pages} pages. "
            f"La limite est de {MAX_PAGES} pages par analyse."
        )

    textes_pages = []
    pages_a_ocr = []

    # 3. Extraire le texte de chaque page.
    for numero, page in enumerate(lecteur.pages, start=1):

        try:
            texte = (page.extract_text() or "").strip()
        except Exception:
            logger.warning(
                "Extraction du texte impossible à la page %s.",
                numero
            )
            texte = ""

        if len(texte) >= MIN_TEXTE_PAGE:
            # Le texte est exploitable : pas besoin d'OCR.
            textes_pages.append(
                f"--- Page {numero} ---\n{texte}"
            )
        else:
            # Page scannée, vide ou contenant très peu de texte.
            pages_a_ocr.append(numero)

    # 4. Vérifier la limite OCR.
    if len(pages_a_ocr) > MAX_PAGES_OCR:
        raise ValueError(
            f"{len(pages_a_ocr)} pages nécessitent un OCR. "
            f"La limite est de {MAX_PAGES_OCR} pages par analyse."
        )

    # 5. Appliquer l'OCR uniquement aux pages nécessaires.
    for numero in pages_a_ocr:

        try:
            images = convert_from_bytes(
               pdf_bytes,
               first_page=numero,
               last_page=numero,
               dpi=200,
               fmt="png",
               thread_count=1,
               timeout=30
            )

            if not images:
                logger.warning(
                    "Impossible de convertir la page %s en image.",
                    numero
                )
                continue

            try:
                texte_ocr = pytesseract.image_to_string(
                  images[0],
                  lang="fra+eng",
                  config="--oem 1 --psm 3",
                  timeout=30
).strip()
              
            finally:
                for image in images:
                    image.close()

            if texte_ocr:
                textes_pages.append(
                    f"--- Page {numero} (OCR) ---\n{texte_ocr}"
                )

        except Exception:
            logger.exception(
                "Échec de l'OCR pour la page %s.",
                numero
            )

    # 6. Remettre les pages dans leur ordre d'origine.
    textes_pages.sort(
        key=lambda texte: int(
            texte.split("--- Page ", 1)[1].split(" ", 1)[0]
        )
    )

    texte_final = "\n\n".join(textes_pages).strip()

    if not texte_final:
        raise ValueError(
            "Aucun texte exploitable n'a été trouvé dans ce PDF."
        )

    # 7. Limiter la taille du texte.
    return texte_final[:MAX_TEXTE]