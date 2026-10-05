from typing import List, Optional
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
    status
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .auth import get_current_user
import schemas
from crud import document as crud_document
from database import get_db


router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"]
)


# =========================================================
# UTILITAIRE : récupérer le matricule de l'utilisateur
# =========================================================

def get_user_im(current_user) -> str:

    user_im = (
        getattr(current_user, "im", None)
        or getattr(current_user, "im_dag_rh", None)
    )

    if not user_im:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Matricule utilisateur introuvable."
        )

    return user_im


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post(
    "/upload",
    response_model=schemas.DocumentOut,
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    num_ref: str = Form(...),
    date_num: date = Form(...),
    cat: str = Form(...),
    annee_redac: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    return crud_document.create_document(
        db=db,
        num_ref=num_ref,
        date_num=date_num,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        im_dag_rh=user_im,
        file=file
    )


# =========================================================
# MES DOCUMENTS
# =========================================================

@router.get(
    "/me",
    response_model=List[schemas.DocumentOut]
)
def list_my_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    return crud_document.get_documents_by_user(
        db=db,
        im_user=user_im,
        skip=skip,
        limit=limit
    )


# =========================================================
# RECHERCHE
# =========================================================

@router.get(
    "/search",
    response_model=List[schemas.DocumentOut]
)
def search_documents(
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[str] = None,
    file_format: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db)
):

    return crud_document.search_documents(
        db=db,
        num_ref=num_ref,
        cat=cat,
        annee_redac=annee_redac,
        file_format=file_format,
        title=title
    )


# =========================================================
# CORBEILLE
# =========================================================

# =========================================================
# CORBEILLE
#
# RSI  -> voit tous les documents supprimés
# autres utilisateurs -> voient uniquement leurs documents
# =========================================================

@router.get(
    "/trash",
    response_model=List[schemas.DocumentOut]
)
def list_trash_documents(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    # Récupérer le rôle/type de l'utilisateur
    user_role = (
        getattr(current_user, "type_user", None)
        or getattr(current_user, "role", None)
        or ""
    )

    user_role = str(user_role).upper()

    # -----------------------------------------------------
    # RSI : accès à toute la corbeille
    # -----------------------------------------------------
    if user_role == "RSI":
        return crud_document.get_trash_documents(
            db=db
        )

    # -----------------------------------------------------
    # Autres utilisateurs :
    # uniquement leurs documents supprimés
    # -----------------------------------------------------
    return crud_document.get_trash_documents_by_user(
        db=db,
        im_user=user_im
    )
# =========================================================
# RESTAURER
# =========================================================

@router.post(
    "/{num_ref}/restore",
    response_model=schemas.DocumentOut,
    status_code=status.HTTP_200_OK
)
def restore_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    restored_doc = crud_document.restore_document(
        db=db,
        num_ref=num_ref,
        im_user=user_im
    )

    if not restored_doc:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable dans la corbeille."
        )

    return restored_doc


# =========================================================
# SUPPRESSION DEFINITIVE
# =========================================================

@router.delete(
    "/{num_ref}/hard",
    status_code=status.HTTP_200_OK
)
def hard_delete_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    success = crud_document.hard_delete_document(
        db=db,
        num_ref=num_ref,
        im_user=user_im
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable pour la suppression définitive."
        )

    return {
        "message": f"Le document {num_ref} a été supprimé définitivement."
    }


# =========================================================
# PREVIEW PDF
# =========================================================

@router.get("/{num_ref}/preview")
def preview_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    # Chercher le document dans PostgreSQL
    doc = crud_document.get_document_by_ref(
        db=db,
        num_ref=num_ref
    )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable."
        )

    # Vérifier que le PDF est bien stocké dans PostgreSQL
    if not doc.file_data:
        raise HTTPException(
            status_code=404,
            detail="Le fichier PDF n'est pas disponible."
        )

    # Journalisation
    crud_document.log_document_action(
        db=db,
        num_ref=num_ref,
        im_user=user_im,
        action_desc="Consultation/Aperçu"
    )

    # Retourner directement le PDF
    return Response(
        content=doc.file_data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline"
        }
    )


# =========================================================
# DOWNLOAD PDF
# =========================================================

@router.get("/{num_ref}/download")
def download_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    # Chercher le document
    doc = crud_document.get_document_by_ref(
        db=db,
        num_ref=num_ref
    )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable."
        )

    # Vérifier le PDF
    if not doc.file_data:
        raise HTTPException(
            status_code=404,
            detail="Le fichier n'est pas disponible."
        )

    # Journalisation
    crud_document.log_document_action(
        db=db,
        num_ref=num_ref,
        im_user=user_im,
        action_desc="Téléchargement"
    )

    extension = doc.format or "pdf"

    filename = f"{doc.num_ref}.{extension}"

    return Response(
        content=doc.file_data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# =========================================================
# SUPPRESSION LOGIQUE
# =========================================================

@router.delete(
    "/{num_ref}",
    status_code=status.HTTP_200_OK
)
def delete_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    deleted_doc = crud_document.soft_delete_document(
        db=db,
        num_ref=num_ref,
        im_user=user_im
    )

    if not deleted_doc:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable ou déjà supprimé."
        )

    return {
        "message": f"Le document {num_ref} a été placé dans la corbeille."
    }


# =========================================================
# TOUS LES DOCUMENTS
# =========================================================

@router.get(
    "/",
    response_model=List[schemas.DocumentOut]
)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):

    return crud_document.get_all_documents(
        db=db,
        skip=skip,
        limit=limit
    )


# =========================================================
# MODIFICATION
# =========================================================

@router.put(
    "/{num_ref}",
    response_model=schemas.DocumentOut,
    status_code=status.HTTP_200_OK
)
def update_document(
    num_ref: str,
    doc_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_im = get_user_im(current_user)

    updated_doc = crud_document.update_document(
        db=db,
        num_ref=num_ref,
        doc_update=doc_update,
        im_user=user_im
    )

    if not updated_doc:
        raise HTTPException(
            status_code=404,
            detail="Document introuvable sur le serveur."
        )

    return updated_doc