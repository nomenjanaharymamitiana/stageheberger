from typing import List, Optional
import uuid
import bcrypt

from sqlalchemy.orm import Session

from models.utilisateur import Utilisateur, DAG, RH, RSI, DAGRH
from models.demande import DemandeChangementMdp
from schemas.utilisateur import (
    PasswordChange,
    UtilisateurCreate,
    UtilisateurUpdate,
)
from schemas import utilisateur as schemas_user

# Dictionnaire de correspondance entre le rôle (chaine) et la sous-classe SQLAlchemy
ROLE_MAP = {
    "dag": DAG,
    "rh": RH,
    "rsi": RSI,
    "dag_rh": DAGRH,
}


# ============================================================
# MOT DE PASSE
# ============================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    plain_bytes = plain_password.encode("utf-8")[:72]

    if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
        try:
            return bcrypt.checkpw(
                plain_bytes,
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False

    # Ancien mot de passe éventuellement stocké en clair
    return plain_password == hashed_password


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(
        password_bytes,
        salt
    ).decode("utf-8")


# ============================================================
# RECHERCHE UTILISATEUR
# ============================================================

def get_utilisateur_by_im(
    db: Session,
    im: str
) -> Optional[Utilisateur]:
    return (
        db.query(Utilisateur)
        .filter(Utilisateur.im == im)
        .first()
    )


def get_utilisateurs_by_role(
    db: Session,
    role: Optional[str] = None
) -> List[Utilisateur]:

    query = db.query(Utilisateur)

    if role:
        # Filtrer sur la colonne 'type_user' du modèle
        query = query.filter(Utilisateur.type_user == role)

    return query.all()


# ============================================================
# DEMANDE DE CHANGEMENT DE MOT DE PASSE
# ============================================================

def request_password_change_for_rsi(
    db: Session,
    im: str,
    password_data: schemas_user.PasswordChange
):
    user = get_utilisateur_by_im(db, im)

    if not user:
        return {"error": "not_found"}

    if not verify_password(
        password_data.old_password,
        user.mdp
    ):
        return {"error": "invalid_password"}

    # Vérifier qu'il n'existe pas déjà une demande en attente
    existing = (
        db.query(DemandeChangementMdp)
        .filter(
            DemandeChangementMdp.im_user == im,
            DemandeChangementMdp.statut == "en_attente"
        )
        .first()
    )

    if existing:
        return {"error": "pending_request"}

    id_genere = f"DMD-{uuid.uuid4().hex[:8].upper()}"

    pending_req = DemandeChangementMdp(
        id_dmd=id_genere,
        im_user=im,
        new_password_hash=hash_password(
            password_data.new_password
        ),
        statut="en_attente"
    )

    db.add(pending_req)
    db.commit()

    return {
        "status": "pending",
        "id_dmd": id_genere
    }


# ============================================================
# CRÉATION UTILISATEUR
# ============================================================

def create_utilisateur(
    db: Session,
    user_data: UtilisateurCreate
) -> Optional[Utilisateur]:

    # Vérification du matricule
    existing_user = get_utilisateur_by_im(
        db,
        user_data.im
    )

    if existing_user:
        raise ValueError(
            f"L'utilisateur avec le matricule '{user_data.im}' existe déjà."
        )

    # Récupération du rôle transmis (role ou type_user selon le schéma Pydantic)
    requested_role = getattr(user_data, "role", getattr(user_data, "type_user", None))
    
    # Résolution de la sous-classe polymorphe appropriée
    role_key = str(requested_role).lower() if requested_role else ""
    ModelClass = ROLE_MAP.get(role_key, Utilisateur)

    hashed_pwd = hash_password(
        user_data.password if hasattr(user_data, "password") else getattr(user_data, "mdp", "")
    )

    # Instanciation dynamique avec la bonne classe polymorphe
    db_user = ModelClass(
        im=user_data.im,
        nom=user_data.nom,
        prenom=user_data.prenom,
        mdp=hashed_pwd,
    )

    db.add(db_user)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_utilisateur_by_im(
        db,
        user_data.im
    )


# ============================================================
# MISE À JOUR INFORMATIONS UTILISATEUR
# ============================================================

def update_utilisateur_info(
    db: Session,
    im: str,
    data: UtilisateurUpdate
) -> Optional[Utilisateur]:

    db_user = get_utilisateur_by_im(
        db,
        im
    )

    if not db_user:
        return None

    # Nom
    if data.nom is not None:
        db_user.nom = data.nom

    # Prénom
    if data.prenom is not None:
        db_user.prenom = data.prenom

    # Mise à jour de type_user si transmis
    new_role = getattr(data, "role", getattr(data, "type_user", None))
    if new_role is not None:
        db_user.type_user = new_role

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_utilisateur_by_im(
        db,
        im
    )


# ============================================================
# MODIFICATION MOT DE PASSE
# ============================================================

def update_utilisateur_password(
    db: Session,
    im: str,
    password_data: PasswordChange
):
    db_user = get_utilisateur_by_im(
        db,
        im
    )

    if not db_user:
        return {"error": "not_found"}

    if not verify_password(
        password_data.old_password,
        db_user.mdp
    ):
        return {"error": "invalid_password"}

    db_user.mdp = hash_password(
        password_data.new_password
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"success": True}


# ============================================================
# SUPPRESSION
# ============================================================

def delete_utilisateur(
    db: Session,
    im: str
) -> bool:

    db_user = get_utilisateur_by_im(
        db,
        im
    )

    if not db_user:
        return False

    db.delete(db_user)
    db.commit()

    return True