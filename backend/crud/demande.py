import uuid
from datetime import date
from typing import Optional, List  # 👈 Importation de Optional et List ajoutée ici
from sqlalchemy.orm import Session

from models.demande import DemandeChangementMdp
from crud.utilisateur import (
    get_utilisateur_by_im,
    verify_password,
    hash_password
)
import models


def create_log(
    db: Session,
    desc: str,
    im_user: str,
    num_ref_doc: Optional[str] = None
):
    """Enregistre une action dans le journal."""
    log_entry = models.Journal(
        id_jour=str(uuid.uuid4())[:8],
        date_action=date.today(),
        desc=desc,
        num_ref_doc=num_ref_doc,
        im_user=im_user
    )
    db.add(log_entry)


def creer_demande_mdp(
    db: Session,
    im_user: str,
    old_password: str,
    new_password: str
):
    user = get_utilisateur_by_im(db, im_user)

    if not user:
        raise ValueError("Utilisateur introuvable")

    if not verify_password(old_password, user.mdp):
        raise ValueError("Ancien mot de passe incorrect")

    demande_existante = (
        db.query(DemandeChangementMdp)
        .filter(
            DemandeChangementMdp.im_user == im_user,
            DemandeChangementMdp.statut == "en_attente"
        )
        .first()
    )

    if demande_existante:
        raise ValueError(
            "Une demande de changement de mot de passe est déjà en attente."
        )

    id_dmd = f"DMD-{uuid.uuid4().hex[:8].upper()}"

    new_password_hash = hash_password(new_password)

    nouvelle_demande = DemandeChangementMdp(
        id_dmd=id_dmd,
        im_user=im_user,
        new_password_hash=new_password_hash,
        statut="en_attente"
    )

    db.add(nouvelle_demande)

    # Enregistrement du log pour la création de la demande
    create_log(
        db,
        f"Création de la demande de changement de mot de passe ({id_dmd})",
        im_user
    )

    db.commit()
    db.refresh(nouvelle_demande)

    return nouvelle_demande


def get_pending_demandes(db: Session):
    return (
        db.query(DemandeChangementMdp)
        .filter(
            DemandeChangementMdp.statut == "en_attente"
        )
        .order_by(
            DemandeChangementMdp.date_demande.desc()
        )
        .all()
    )


def valider_demande_mdp(
    db: Session,
    id_dmd: str,
    im_admin: str = "SYSTEM"
):
    demande = (
        db.query(DemandeChangementMdp)
        .filter(
            DemandeChangementMdp.id_dmd == id_dmd
        )
        .first()
    )

    if not demande or demande.statut != "en_attente":
        return None

    user = get_utilisateur_by_im(
        db,
        demande.im_user
    )

    if not user:
        return None

    user.mdp = demande.new_password_hash
    demande.statut = "validee"

    # Enregistrement du log pour la validation de la demande
    create_log(
        db,
        f"Validation de la demande de changement de mot de passe ({id_dmd}) pour l'utilisateur {demande.im_user}",
        im_admin
    )

    db.commit()
    db.refresh(demande)

    return demande


def rejeter_demande_mdp(
    db: Session,
    id_dmd: str,
    im_admin: str = "SYSTEM"
):
    demande = (
        db.query(DemandeChangementMdp)
        .filter(
            DemandeChangementMdp.id_dmd == id_dmd
        )
        .first()
    )

    if not demande or demande.statut != "en_attente":
        return None

    demande.statut = "rejetee"

    # Enregistrement du log pour le rejet de la demande
    create_log(
        db,
        f"Rejet de la demande de changement de mot de passe ({id_dmd}) pour l'utilisateur {demande.im_user}",
        im_admin
    )

    db.commit()
    db.refresh(demande)

    return demande


def get_latest_demande_by_im(db: Session, im_user: str):
    return (
        db.query(DemandeChangementMdp)
        .filter(
            DemandeChangementMdp.im_user == im_user
        )
        .order_by(
            DemandeChangementMdp.date_demande.desc()
        )
        .first()
    )