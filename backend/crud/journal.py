from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
import models

def get_journals(
    db: Session,
    date_action: Optional[date] = None,
    im_user: Optional[str] = None,
    num_ref_doc: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[models.Journal]:
    """
    Récupère le journal d'audit avec des filtres optionnels 
    par date, utilisateur ou référence de document.
    """
    query = db.query(models.Journal).order_by(models.Journal.date_action.desc())

    if date_action:
        query = query.filter(models.Journal.date_action == date_action)

    if im_user:
        query = query.filter(models.Journal.im_user.ilike(f"%{im_user}%"))

    if num_ref_doc:
        query = query.filter(models.Journal.num_ref_doc.ilike(f"%{num_ref_doc}%"))

    return query.offset(skip).limit(limit).all()