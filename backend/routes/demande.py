from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from crud import demande as crud_demande
from schemas import demande as schemas_demande


router = APIRouter(
    prefix="/api/v1/demandes-mdp",
    tags=["Gestion des Demandes de Mot de Passe (RSI)"]
)


@router.post(
    "/demander",
    response_model=schemas_demande.DemandeOut,
    status_code=status.HTTP_201_CREATED
)
def creer_demande(
    demande_in: schemas_demande.DemandeCreate,
    db: Session = Depends(get_db)
):
    try:
        demande = crud_demande.creer_demande_mdp(
            db=db,
            im_user=demande_in.im_user,
            old_password=demande_in.old_password,
            new_password=demande_in.new_password
        )

        return demande

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/pending",
    response_model=List[schemas_demande.DemandeOut]
)
def get_pending_requests(
    db: Session = Depends(get_db)
):
    return crud_demande.get_pending_demandes(db)


@router.put(
    "/{id_dmd}/valider",
    response_model=schemas_demande.DemandeOut
)
def valider_demande(
    id_dmd: str,
    db: Session = Depends(get_db)
):
    demande = crud_demande.valider_demande_mdp(db, id_dmd)

    if not demande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande introuvable, déjà traitée ou utilisateur introuvable."
        )

    return demande
@router.get(
    "/statut/{im_user}",
    response_model=schemas_demande.DemandeOut
)
def get_statut_demande(
    im_user: str,
    db: Session = Depends(get_db)
):
    demande = crud_demande.get_latest_demande_by_im(db, im_user)

    if not demande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune demande de changement de mot de passe trouvée."
        )

    return demande

@router.put(
    "/{id_dmd}/rejeter",
    response_model=schemas_demande.DemandeOut
)
def rejeter_demande(
    id_dmd: str,
    db: Session = Depends(get_db)
):
    demande = crud_demande.rejeter_demande_mdp(db, id_dmd)

    if not demande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande introuvable ou déjà traitée."
        )

    return demande