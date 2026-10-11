from sqlalchemy.orm import Session
import models
import schemas
from passlib.context import CryptContext

# Configuration du hachage de mot de passe (si tu utilises passlib/bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_im(db: Session, im: str):
    return db.query(models.Utilisateur).filter(models.Utilisateur.im == im).first()
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie le mot de passe fourni par l'utilisateur
    par rapport au hash bcrypt enregistré en base.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False
def authenticate_user(db: Session, credentials: schemas.LoginRequest):
    user = get_user_by_im(db, credentials.im)
    if not user:
        return None
    
    # Vérification du mot de passe
    if not verify_password(credentials.mdp, user.mdp):
        return None

    return user