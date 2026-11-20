content = '''import io
import logging
import shutil
import subprocess

import pytesseract
from pdf2image import convert_from_bytes
from pypdf import PdfReader

logger = logging.getLogger(__name__)

# Configuration
MAX_PAGES = 100
MAX_PAGES_OCR = 20
MAX_TEXTE = 20000
MIN_TEXTE_PAGE = 40

# Détection des exécutables système
TESSERACT_PATH = shutil.which("tesseract")
POPPLER_PATH = shutil.which("pdftoppm")

if TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def verifier_environnement_ocr():
    """Vérifie la présence de Tesseract, Poppler et des langues OCR."""
    logger.info("========== DIAGNOSTIC OCR ==========")
    logger.info("Tesseract : %s", TESSERACT_PATH)
    logger.info("Poppler : %s", POPPLER_PATH)

    if not TESSERACT_PATH:
        logger.error("Tesseract est introuvable.")
        return

    try:
        resultat = subprocess.run(
            [TESSERACT_PATH, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            check=True,
        )
        version = resultat.stdout.splitlines()
        if version:
            logger.info("Version Tesseract : %s", version[0])

        langues = pytesseract.get_languages(config="")
        logger.info("Langues OCR disponibles : %s", langues)

        if "fra" not in langues:
            logger.warning("La langue française (fra) est absente.")
        if "eng" not in langues:
            logger.warning("La langue anglaise (eng) est absente.")

    except Exception:
        logger.exception("Erreur pendant le diagnostic Tesseract.")

    if not POPPLER_PATH:
        logger.error("Poppler est introuvable.")

    logger.info("========== FIN DIAGNOSTIC OCR ==========")


def extraire_texte_pdf(pdf_bytes: bytes) -> str:
    """Extrait le texte d'un PDF et utilise l'OCR pour les pages scannées."""

    # 1. Vérification du fichier
    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("Le fichier PDF est invalide.")

    # 2. Lecture du PDF
    try:
        lecteur = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as erreur:
        logger.exception("Impossible de lire le PDF.")
        raise ValueError(
            "Impossible de lire ce fichier PDF."
        ) from erreur

    # 3. Vérification de la protection
    if lecteur.is_encrypted:
        raise ValueError("Le PDF est protégé par un mot de passe.")

    nombre_pages = len(lecteur.pages)
    if nombre_pages == 0:
        raise ValueError("Le PDF ne contient aucune page.")

    if nombre_pages > MAX_PAGES:
        raise ValueError(
            f"Le PDF contient {nombre_pages} pages. "
            f"La limite est de {MAX_PAGES} pages."
        )

    logger.info("Début extraction : %s page(s).", nombre_pages)

    textes_pages = []
    pages_a_ocr = []

    # 4. Extraction classique du texte
    for numero, page in enumerate(lecteur.pages, start=1):
        try:
            texte = (page.extract_text() or "").strip()
        except Exception:
            logger.exception("Erreur extraction page %s.", numero)
            texte = ""

        if len(texte) >= MIN_TEXTE_PAGE:
            textes_pages.append(f"--- Page {numero} ---\\n{texte}")
        else:
            pages_a_ocr.append(numero)

    # 5. Vérification de la limite OCR
    if len(pages_a_ocr) > MAX_PAGES_OCR:
        raise ValueError(
            f"{len(pages_a_ocr)} pages nécessitent un OCR. "
            f"La limite est de {MAX_PAGES_OCR} pages."
        )

    # 6. Vérification des dépendances OCR
    if pages_a_ocr:
        if not TESSERACT_PATH:
            raise RuntimeError(
                "Tesseract OCR n'est pas installé sur le serveur."
            )

        if not POPPLER_PATH:
            raise RuntimeError(
                "Poppler n'est pas installé sur le serveur."
            )

        try:
            langues = pytesseract.get_languages(config="")
        except Exception as erreur:
            logger.exception("Impossible de vérifier les langues OCR.")
            raise RuntimeError(
                "Impossible de vérifier les langues de Tesseract."
            ) from erreur

        langues_manquantes = {"fra", "eng"} - set(langues)
        if langues_manquantes:
            raise RuntimeError(
                "Langues OCR manquantes : "
                + ", ".join(sorted(langues_manquantes))
            )

    # 7. OCR des pages scannées
    for numero in pages_a_ocr:
        images = []

        try:
            logger.info("OCR de la page %s.", numero)
            images = convert_from_bytes(
                pdf_bytes,
                first_page=numero,
                last_page=numero,
                dpi=200,
                fmt="png",
                thread_count=1,
                timeout=30,
            )

            if not images:
                logger.warning(
                    "Impossible de convertir la page %s.",
                    numero,
                )
                continue

            texte_ocr = pytesseract.image_to_string(
                images[0],
                lang="fra+eng",
                config="--oem 1 --psm 3",
                timeout=30,
            ).strip()

            if texte_ocr:
                textes_pages.append(
                    f"--- Page {numero} (OCR) ---\\n{texte_ocr}"
                )
                logger.info("OCR réussi page %s.", numero)
            else:
                logger.warning("Aucun texte détecté page %s.", numero)

        except Exception:
            logger.exception("Échec OCR page %s.", numero)

        finally:
            for image in images:
                image.close()

    # 8. Remettre les pages dans l'ordre
    textes_pages.sort(
        key=lambda texte: int(
            texte.split("--- Page ", 1)[1].split(" ", 1)[0]
        )
    )

    # 9. Construire le texte final
    texte_final = "\\n\\n".join(textes_pages).strip()
    if not texte_final:
        raise ValueError(
            "Aucun texte exploitable n'a été trouvé dans ce PDF."
        )

    # 10. Limiter la taille du texte
    texte_final = texte_final[:MAX_TEXTE]
    logger.info(
        "Extraction terminée : %s caractères.",
        len(texte_final),
    )

    return texte_final
'''
path = "/mnt/data/pdf_service.py"
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
import py_compile
py_compile.compile(path, doraise=True)
print("Fichier créé et syntaxe vérifiée :", path)
