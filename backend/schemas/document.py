from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


# =========================================================
# DOCUMENT BASE
# =========================================================

class DocumentBase(BaseModel):
    num_ref: str
    date_num: date
    format: str
    cat: str
    annee_redac: str
    title: str = "Sans titre"


# =========================================================
# CREATION
# =========================================================

class DocumentCreate(DocumentBase):
    pass


# =========================================================
# MODIFICATION
# =========================================================

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[str] = None


# =========================================================
# SORTIE API
# =========================================================

class DocumentOut(DocumentBase):
    # Maintenant nullable car les nouveaux PDF
    # sont stockés dans PostgreSQL et non sur le disque
    file_path: Optional[str] = None

    im_dag_rh: Optional[str] = None

    date_suppression: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# FILTRE DE RECHERCHE
# =========================================================

class SearchFilter(BaseModel):
    num_ref: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[str] = None
    format: Optional[str] = None
    title: Optional[str] = None