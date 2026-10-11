import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

import schemas
from crud import auth as crud_auth
from database import get_db

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentification"]
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


def create_access_token(user_im: str) -> str:
    """Crée un jeton JWT signé pour un utilisateur authentifié."""

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="La configuration JWT du serveur est manquante."
        )

    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_im,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    credentials: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """Authentifie un utilisateur et lui délivre un JWT."""

    user = crud_auth.authenticate_user(db, credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Matricule ou mot de passe incorrect."
        )

    token = create_access_token(user.im)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


def get_current_user(
    authorization: str = Header(
        default=None,
        alias="Authorization"
    ),
    db: Session = Depends(get_db)
):
    """Vérifie le JWT et récupère l'utilisateur depuis la base."""

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentification requise."
        )

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="La configuration JWT du serveur est manquante."
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        user_im = payload.get("sub")

        if not user_im:
            raise HTTPException(
                status_code=401,
                detail="Jeton invalide."
            )

    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Jeton invalide ou expiré."
        )

    user = crud_auth.get_user_by_im(db, im=user_im)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Utilisateur introuvable."
        )

    return user