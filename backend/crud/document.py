import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status

import models
import schemas


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


def get_agent_dag_rh(db: Session, im_dag_rh: str):
    return (
        db.query(models.Utilisateur)
        .filter(models.Utilisateur.im == im_dag_rh)
        .first()
    )


def get_document_by_ref(db: Session, num_ref: str):
    return (
        db.query(models.Document)
        .filter(models.Document.num_ref == num_ref)
        .first()
    )


# =========================================================
# AJOUT DOCUMENT
# =========================================================

def create_document(
    db: Session,
    num_ref: str,
    date_num: date,
    cat: str,
    annee_redac: str,
    title: str,
    im_dag_rh: str,
    file: UploadFile
):

    agent = get_agent_dag_rh(db, im_dag_rh)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"L'agent DAG/RH avec le matricule '{im_dag_rh}' n'existe pas."
        )

    # Vérifier référence existante
    db_doc = get_document_by_ref(db, num_ref)

    if db_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un document avec cette référence existe déjà."
        )

    # -----------------------------------------------------
    # Vérification extension
    # -----------------------------------------------------

    original_filename = file.filename or "document"

    file_ext = (
        original_filename.split(".")[-1].lower()
        if "." in original_filename
        else "inconnu"
    )

    # -----------------------------------------------------
    # Lire le fichier directement en mémoire
    # -----------------------------------------------------

    file_content = file.file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Le fichier est vide."
        )

    # -----------------------------------------------------
    # Limite exemple : 50 Mo par fichier
    # -----------------------------------------------------

    max_size = 50 * 1024 * 1024

    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Le fichier ne doit pas dépasser 50 Mo."
        )

    # -----------------------------------------------------
    # Créer le document
    # -----------------------------------------------------

    new_doc = models.Document(
        num_ref=num_ref,
        date_num=date_num,
        format=file_ext,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        im_dag_rh=im_dag_rh,

        # On ne dépend plus du disque Render
        file_path=None,

        # Contenu réel du PDF
        file_data=file_content,

        date_suppression=None
    )

    db.add(new_doc)

    create_log(
        db,
        f"Ajout du document {num_ref}",
        im_dag_rh,
        num_ref
    )

    db.commit()
    db.refresh(new_doc)

    return new_doc


# =========================================================
# JOURNAL
# =========================================================

def log_document_action(
    db: Session,
    num_ref: str,
    im_user: str,
    action_desc: str
):
    create_log(
        db,
        f"{action_desc} du document {num_ref}",
        im_user,
        num_ref
    )

    db.commit()


# =========================================================
# RECHERCHE
# =========================================================

def search_documents(
    db: Session,
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[str] = None,
    file_format: Optional[str] = None,
    title: Optional[str] = None
) -> List[models.Document]:

    query = (
        db.query(models.Document)
        .filter(models.Document.date_suppression.is_(None))
    )

    if num_ref:
        query = query.filter(
            models.Document.num_ref.ilike(f"%{num_ref}%")
        )

    if cat:
        query = query.filter(
            models.Document.cat == cat
        )

    if annee_redac:
        query = query.filter(
            models.Document.annee_redac == annee_redac
        )

    if file_format:
        query = query.filter(
            models.Document.format == file_format.lower()
        )

    if title:
        query = query.filter(
            models.Document.title.ilike(f"%{title}%")
        )

    return query.all()


# =========================================================
# TOUS LES DOCUMENTS
# =========================================================

def get_all_documents(
    db: Session,
    skip: int = 0,
    limit: int = 50
) -> List[models.Document]:

    return (
        db.query(models.Document)
        .filter(models.Document.date_suppression.is_(None))
        .order_by(models.Document.date_num.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# DOCUMENTS D'UN UTILISATEUR
# =========================================================

def get_documents_by_user(
    db: Session,
    im_user: str,
    skip: int = 0,
    limit: int = 50
) -> List[models.Document]:

    return (
        db.query(models.Document)
        .filter(
            models.Document.im_dag_rh == im_user,
            models.Document.date_suppression.is_(None)
        )
        .order_by(models.Document.date_num.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# CORBEILLE
# =========================================================

def get_trash_documents(
    db: Session
) -> List[models.Document]:

    return (
        db.query(models.Document)
        .filter(models.Document.date_suppression.is_not(None))
        .order_by(models.Document.date_suppression.desc())
        .all()
    )


# =========================================================
# SUPPRESSION LOGIQUE
# =========================================================

def soft_delete_document(
    db: Session,
    num_ref: str,
    im_user: str
):

    doc = (
        db.query(models.Document)
        .filter(
            models.Document.num_ref == num_ref,
            models.Document.date_suppression.is_(None)
        )
        .first()
    )

    if not doc:
        return None

    doc.date_suppression = datetime.utcnow()

    create_log(
        db,
        f"Mise en corbeille du document {num_ref}",
        im_user,
        num_ref
    )

    db.commit()
    db.refresh(doc)

    return doc


# =========================================================
# RESTAURATION
# =========================================================

def restore_document(
    db: Session,
    num_ref: str,
    im_user: str
):

    doc = (
        db.query(models.Document)
        .filter(
            models.Document.num_ref == num_ref,
            models.Document.date_suppression.is_not(None)
        )
        .first()
    )

    if not doc:
        return None

    doc.date_suppression = None

    create_log(
        db,
        f"Restauration du document {num_ref}",
        im_user,
        num_ref
    )

    db.commit()
    db.refresh(doc)

    return doc


# =========================================================
# SUPPRESSION DEFINITIVE
# =========================================================

def hard_delete_document(
    db: Session,
    num_ref: str,
    im_user: str
):

    doc = get_document_by_ref(db, num_ref)

    if not doc:
        return False

    # Le PDF étant maintenant dans PostgreSQL,
    # il n'y a plus de os.remove()

    create_log(
        db,
        f"Suppression définitive du document {num_ref}",
        im_user,
        None
    )

    db.delete(doc)

    db.commit()

    return True


# =========================================================
# MODIFICATION
# =========================================================

def update_document(
    db: Session,
    num_ref: str,
    doc_update: schemas.DocumentUpdate,
    im_user: str
):

    db_doc = (
        db.query(models.Document)
        .filter(
            models.Document.num_ref == num_ref,
            models.Document.date_suppression.is_(None)
        )
        .first()
    )

    if not db_doc:
        return None

    update_data = doc_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(db_doc, key, value)

    create_log(
        db,
        f"Mise à jour des informations du document {num_ref}",
        im_user,
        num_ref
    )

    db.commit()
    db.refresh(db_doc)

    return db_doc


# =========================================================
# PURGE CORBEILLE
# =========================================================

def purge_expired_trash_documents(
    db: Session
):

    limit_date = datetime.utcnow() - timedelta(days=30)

    expired_docs = (
        db.query(models.Document)
        .filter(
            models.Document.date_suppression.is_not(None),
            models.Document.date_suppression <= limit_date
        )
        .all()
    )

    for doc in expired_docs:

        create_log(
            db,
            f"Purge automatique du document expiré {doc.num_ref}",
            "SYSTEM",
            None
        )

        # Suppression du PDF dans PostgreSQL
        # en même temps que l'enregistrement
        db.delete(doc)

    db.commit()