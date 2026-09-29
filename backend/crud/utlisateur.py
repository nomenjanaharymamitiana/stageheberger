import bcrypt
from typing import List, Optional
from sqlalchemy.orm import Session
from models.utilisateur import Utilisateur
from schemas.utlisateur import UtilisateurUpdate, PasswordChange, UtilisateurCreate


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    plain_bytes = plain_password.encode('utf-8')[:72]

    if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
        try:
            return bcrypt.checkpw(plain_bytes, hashed_password.encode('utf-8'))
        except Exception:
            return False
            
    return plain_password == hashed_password


def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def get_utilisateur_by_im(db: Session, im: str) -> Optional[Utilisateur]:
    return db.query(Utilisateur).filter(Utilisateur.im == im).first()


def get_utilisateur_by_email(db: Session, email: str) -> Optional[Utilisateur]:
    return db.query(Utilisateur).filter(Utilisateur.email == email).first()


def get_utilisateurs_by_role(db: Session, role: Optional[str] = None) -> List[Utilisateur]:
    query = db.query(Utilisateur)
    if role:
        query = query.filter(Utilisateur.role == role)
    return query.all()


def create_utilisateur(db: Session, user_data: UtilisateurCreate) -> Utilisateur:
    hashed_pwd = hash_password(user_data.password)
    db_user = Utilisateur(
        im=user_data.im,
        nom=user_data.nom,
        prenom=user_data.prenom,
        email=user_data.email,
        mdp=hashed_pwd,
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_utilisateur_info(db: Session, im: str, data: UtilisateurUpdate) -> Optional[Utilisateur]:
    db_user = get_utilisateur_by_im(db, im)
    if not db_user:
        return None

    if data.nom is not None:
        db_user.nom = data.nom
    if data.prenom is not None:
        db_user.prenom = data.prenom
    if hasattr(data, 'email') and data.email is not None:
        db_user.email = data.email
    if hasattr(data, 'role') and data.role is not None:
        db_user.role = data.role

    db.commit()
    db.refresh(db_user)
    return db_user


def update_utilisateur_password(db: Session, im: str, password_data: PasswordChange):
    db_user = get_utilisateur_by_im(db, im)
    if not db_user:
        return {"error": "not_found"}

    if not verify_password(password_data.old_password, db_user.mdp):
        return {"error": "invalid_password"}

    db_user.mdp = hash_password(password_data.new_password)
    db.commit()
    return {"success": True}


def delete_utilisateur(db: Session, im: str) -> bool:
    db_user = get_utilisateur_by_im(db, im)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True