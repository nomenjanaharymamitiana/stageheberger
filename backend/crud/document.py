import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status

import models
import schemas
import hashlib

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

def get_document_by_hash(db: Session, file_hash: str):
    """
    Recherche un document ayant exactement la même empreinte SHA-256.
    """
    return (
        db.query(models.Document)
        .filter(models.Document.file_hash == file_hash)
        .first()
    )
# AJOUT DOCUMENT AVEC DÉTECTION DES DOUBLONS

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
    # 1. Vérifier l'existence de l'agent

    agent = get_agent_dag_rh(db, im_dag_rh)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"L'agent DAG/RH avec le matricule "
                f"'{im_dag_rh}' n'existe pas."
            )
        )

    # 2. Vérifier si la référence existe déjà

    db_doc = get_document_by_ref(db, num_ref)

    if db_doc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_REFERENCE",
                "message": "Un document avec cette référence existe déjà.",
                "num_ref": db_doc.num_ref,
                "title": db_doc.title
            }
        )
    # 3. Vérifier l'extension du fichier

    original_filename = file.filename or "document"

    file_ext = (
        original_filename.rsplit(".", 1)[-1].lower()
        if "." in original_filename
        else "inconnu"
    )

    if file_ext != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les fichiers PDF sont acceptés."
        )

    # 4. Lire le contenu du fichier

    file_content = file.file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier est vide."
        )

    # 5. Vérifier la taille : maximum 50 Mo

    max_size = 50 * 1024 * 1024

    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier ne doit pas dépasser 50 Mo."
        )
    
    # 6. Vérifier la signature PDF

    if not file_content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier envoyé n'est pas un PDF valide."
        )
 
    # 7. Calculer l'empreinte SHA-256
 
    file_hash = hashlib.sha256(file_content).hexdigest()

    # 8. Rechercher un fichier identique

    existing_document = get_document_by_hash(
        db=db,
        file_hash=file_hash
    )

    if existing_document:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_DOCUMENT",
                "message": "Ce fichier PDF est déjà enregistré.",
                "num_ref": existing_document.num_ref,
                "title": existing_document.title
            }
        )
    # 9. Créer le document

    new_doc = models.Document(
        num_ref=num_ref,
        date_num=date_num,
        format=file_ext,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        im_dag_rh=im_dag_rh,

        # Le fichier n'est pas stocké sur le disque
        file_path=None,

        # Contenu PDF stocké dans PostgreSQL
        file_data=file_content,

        # Empreinte du fichier
        file_hash=file_hash,

        date_suppression=None
    )

    try:
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

    except Exception:
        db.rollback()
        raise

# =========================================================
# CORBEILLE D'UN UTILISATEUR
# =========================================================

def get_trash_documents_by_user(
    db: Session,
    im_user: str
) -> List[models.Document]:

    return (
        db.query(models.Document)
        .filter(
            models.Document.im_dag_rh == im_user,
            models.Document.date_suppression.is_not(None)
        )
        .order_by(
            models.Document.date_suppression.desc()
        )
        .all()
    )

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


def get_all_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[models.Journal]:
    """
    Récupère l'intégralité du journal d'audit (actions documents et actions utilisateurs).
    """
    return (
        db.query(models.Journal)
        .order_by(models.Journal.date_action.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


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

        db.delete(doc)

    db.commit()


# =========================================================
# HISTORIQUE DE CONSULTATION (BASÉ SUR LE JOURNAL)
# =========================================================

def get_user_history_documents(
    db: Session,
    im_user: str,
    skip: int = 0,
    limit: int = 50
) -> List[models.Document]:
    """
    Récupère les documents uniques consultés ou manipulés 
    par l'utilisateur à partir du journal d'actions.
    """
    subquery = (
        db.query(models.Journal.num_ref_doc)
        .filter(
            models.Journal.im_user == im_user,
            models.Journal.num_ref_doc.is_not(None)
        )
        .order_by(models.Journal.date_action.desc())
        .distinct()
        .subquery()
    )

    return (
        db.query(models.Document)
        .filter(
            models.Document.num_ref.in_(subquery),
            models.Document.date_suppression.is_(None)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# DOCUMENTS FAVORIS / IMPORTANTS
# =========================================================

def get_important_documents(
    db: Session,
    im_user: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[models.Document]:
    """
    Récupère la liste des documents marqués comme importants/favoris.
    """
    query = (
        db.query(models.Document)
        .filter(
            models.Document.est_important.is_(True),
            models.Document.date_suppression.is_(None)
        )
        .order_by(models.Document.date_num.desc())
    )

    return query.offset(skip).limit(limit).all()