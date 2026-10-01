import uuid

from sqlalchemy.orm import Session

from models.demande import DemandeChangementMdp
from crud.utilisateur import (
    get_utilisateur_by_im,
    verify_password,
    hash_password
)


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
    id_dmd: str
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

    db.commit()
    db.refresh(demande)

    return demande


def rejeter_demande_mdp(
    db: Session,
    id_dmd: str
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