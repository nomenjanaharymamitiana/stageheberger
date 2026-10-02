from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from crud import utilisateur as crud_user
from schemas import utilisateur as schemas_user

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Gestion Utilisateurs (DAG / RH)"]
)


# ============================================================
# RÉCUPÉRATION DU MATRICULE DE L'UTILISATEUR CONNECTÉ
# ============================================================

def get_current_user_im(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_im: Optional[str] = Header(None, alias="X-User-IM")
) -> str:

    user_im = x_user_im or (
        authorization.replace("Bearer ", "")
        if authorization
        else None
    )

    if not user_im:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant (IM) manquant dans les en-têtes"
        )

    return user_im


# ============================================================
# PROFIL PERSONNEL
# ============================================================

@router.put(
    "/me",
    response_model=schemas_user.UtilisateurOut
)
def update_profile(
    user_data: schemas_user.UtilisateurUpdate,
    db: Session = Depends(get_db),
    current_im: str = Depends(get_current_user_im)
):

    updated_user = crud_user.update_utilisateur_info(
        db,
        current_im,
        user_data
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )

    return updated_user


# ============================================================
# CHANGEMENT DE MOT DE PASSE
# ============================================================

@router.put("/change-password")
def change_password(
    password_data: schemas_user.PasswordChange,
    db: Session = Depends(get_db),
    current_im: str = Depends(get_current_user_im)
):

    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit contenir au moins 6 caractères"
        )

    user = crud_user.get_utilisateur_by_im(
        db,
        current_im
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )

    user_role = (
        str(user.type_user).lower()
        if hasattr(user, "type_user") and user.type_user
        else ""
    )

    is_dag_or_rh = user_role in [
        "dag",
        "rh",
        "dag_rh"
    ]

    if is_dag_or_rh:

        res = crud_user.request_password_change_for_rsi(
            db,
            current_im,
            password_data
        )

        if "error" in res:

            if res["error"] == "invalid_password":
                raise HTTPException(
                    status_code=400,
                    detail="Mot de passe actuel incorrect"
                )

            if res["error"] == "pending_request":
                raise HTTPException(
                    status_code=400,
                    detail="Une demande de changement de mot de passe est déjà en attente"
                )

            raise HTTPException(
                status_code=400,
                detail="Impossible de soumettre la demande"
            )

        return {
            "status": "pending_rsi_validation",
            "message": "Demande de modification de mot de passe transmise au RSI pour validation"
        }

    else:

        res = crud_user.update_utilisateur_password(
            db,
            current_im,
            password_data
        )

        if "error" in res:

            if res["error"] == "invalid_password":
                raise HTTPException(
                    status_code=400,
                    detail="Mot de passe actuel incorrect"
                )

            raise HTTPException(
                status_code=400,
                detail="Erreur lors du changement de mot de passe"
            )

        return {
            "status": "success",
            "message": "Mot de passe modifié avec succès"
        }


# ============================================================
# LISTE DES UTILISATEURS
# ============================================================

@router.get(
    "/",
    response_model=List[schemas_user.UtilisateurOut]
)
def get_users(
    role: Optional[str] = Query(
        None,
        description="Filtrer par rôle"
    ),
    db: Session = Depends(get_db)
):

    return crud_user.get_utilisateurs_by_role(
        db,
        role=role
    )


# ============================================================
# CRÉATION D'UN UTILISATEUR
# ============================================================

@router.post(
    "/",
    response_model=schemas_user.UtilisateurOut,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    user_data: schemas_user.UtilisateurCreate,
    db: Session = Depends(get_db)
):

    if crud_user.get_utilisateur_by_im(
        db,
        user_data.im
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec ce matricule (IM) existe déjà"
        )

    try:

        return crud_user.create_utilisateur(
            db,
            user_data
        )

    except ValueError as e:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============================================================
# OBTENIR UN UTILISATEUR
# ============================================================

@router.get(
    "/{im}",
    response_model=schemas_user.UtilisateurOut
)
def get_user_by_im(
    im: str,
    db: Session = Depends(get_db)
):

    user = crud_user.get_utilisateur_by_im(
        db,
        im
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )

    return user


# ============================================================
# MODIFIER UN UTILISATEUR
# ============================================================

@router.put(
    "/{im}",
    response_model=schemas_user.UtilisateurOut
)
def update_user_by_im(
    im: str,
    user_data: schemas_user.UtilisateurUpdate,
    db: Session = Depends(get_db)
):

    updated = crud_user.update_utilisateur_info(
        db,
        im,
        user_data
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )

    return updated


# ============================================================
# SUPPRIMER UN UTILISATEUR
# ============================================================

@router.delete("/{im}")
def delete_user(
    im: str,
    db: Session = Depends(get_db)
):

    success = crud_user.delete_utilisateur(
        db,
        im
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )

    return {
        "message": f"Utilisateur {im} supprimé avec succès"
    }