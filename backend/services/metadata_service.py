import re


def extraire_metadonnees(texte: str) -> dict:
    """
    Extrait les métadonnées principales d'un document administratif.

    Retourne :
        num_ref     : numéro de référence
        title       : titre du document
        cat         : catégorie
        annee_redac : année de rédaction
    """

    resultat = {
        "num_ref": None,
        "title": None,
        "cat": None,
        "annee_redac": None,
    }

    if not texte or not texte.strip():
        return resultat

    # Normaliser les espaces sans supprimer les retours à la ligne.
    texte_nettoye = texte.replace("\r", "\n")
    texte_nettoye = re.sub(r"[ \t]+", " ", texte_nettoye)

    # -----------------------------------------------------
    # 1. NUMÉRO DE RÉFÉRENCE
    # Exemple : ARRETE N° 035-26 /REG/HM
    # -----------------------------------------------------

    pattern_reference = (
        r"(?:ARR[ÊE]T[ÉE]|D[ÉE]CISION|ORDONNANCE)"
        r"\s*N[°ºo]?\s*"
        r"([0-9]{1,5}\s*-\s*[0-9]{2,4}"
        r"(?:\s*/\s*[A-ZÀ-ÖØ-Ý0-9_-]+)+)"
    )

    match_reference = re.search(
        pattern_reference,
        texte_nettoye,
        flags=re.IGNORECASE
    )

    if match_reference:
        resultat["num_ref"] = re.sub(
            r"\s+",
            " ",
            match_reference.group(1).strip()
        )

        resultat["num_ref"] = re.sub(
            r"\s*/\s*",
            "/",
            resultat["num_ref"]
        )

    # -----------------------------------------------------
    # 2. TITRE DU DOCUMENT
    # Exemple :
    # Portant nomination d'un Inspecteur à la Région
    # Haute Matsiatra
    # -----------------------------------------------------

    lignes = [
        ligne.strip()
        for ligne in texte_nettoye.split("\n")
        if ligne.strip()
    ]

    mots_cles_titre = (
        "portant ",
        "relatif ",
        "relative ",
        "fixant ",
        "autorisant ",
        "approuvant ",
        "nommant ",
        "nomination ",
    )

    for ligne in lignes:
        ligne_minuscule = ligne.lower()

        if any(
            mot_cle in ligne_minuscule
            for mot_cle in mots_cles_titre
        ):
            # Ignorer les lignes trop courtes ou trop longues.
            if 10 <= len(ligne) <= 300:
                resultat["title"] = ligne
                break

    # -----------------------------------------------------
    # 3. CATÉGORIE
    # Les catégories doivent correspondre aux valeurs
    # autorisées par le formulaire React.
    # -----------------------------------------------------

    texte_minuscule = texte_nettoye.lower()

    if any(
        mot in texte_minuscule
        for mot in (
            "portant nomination",
            "nomination d'un",
            "nomination d'une",
            "nommant ",
        )
    ):
        resultat["cat"] = "Nomination"

    elif any(
        mot in texte_minuscule
        for mot in (
            "budget",
            "financement",
            "dépense",
            "depense",
            "crédit budgétaire",
            "crédit",
            "comptable",
        )
    ):
        resultat["cat"] = "Finance"

    elif any(
        mot in texte_minuscule
        for mot in (
            "développement",
            "developpement",
            "projet de développement",
            "projet de developpement",
            "aménagement",
            "amenagement",
        )
    ):
        resultat["cat"] = "Développement"

    # -----------------------------------------------------
    # 4. ANNÉE DE RÉDACTION
    # Priorité à une année présente dans le numéro de référence.
    # Exemple : 035-26 /REG/HM -> 2026
    #
    # Attention : cette méthode est une déduction.
    # Le suffixe de référence ne garantit pas toujours l'année.
    # -----------------------------------------------------

    if resultat["num_ref"]:
        match_annee_ref = re.search(
            r"-\s*(\d{2,4})(?:\s*/|$)",
            resultat["num_ref"]
        )

        if match_annee_ref:
            annee = match_annee_ref.group(1)

            if len(annee) == 2:
                annee = "20" + annee

            resultat["annee_redac"] = annee

    # Si aucune année n'a été trouvée dans la référence,
    # chercher une année dans le texte.
    if not resultat["annee_redac"]:
        annees = re.findall(
            r"\b(19\d{2}|20\d{2})\b",
            texte_nettoye
        )

        if annees:
            # On ne choisit pas automatiquement la première année :
            # un document peut citer plusieurs lois anciennes.
            # La valeur reste vide pour éviter une mauvaise déduction.
            resultat["annee_redac"] = None

    return resultat