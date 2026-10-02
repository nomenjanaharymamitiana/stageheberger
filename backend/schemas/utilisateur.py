from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CRÉATION
# ============================================================

class UtilisateurCreate(BaseModel):
    im: str
    nom: str
    prenom: str
    password: str
    role: str


# ============================================================
# MODIFICATION
# ============================================================

class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


# ============================================================
# RÉPONSE API
# ============================================================

class UtilisateurOut(BaseModel):
    im: str
    nom: str
    prenom: str

    # Le modèle SQLAlchemy possède "type_user"
    # mais l'API renvoie "role"
    role: str = Field(
        validation_alias="type_user",
        serialization_alias="role"
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


# ============================================================
# CHANGEMENT DE MOT DE PASSE
# ============================================================

class PasswordChange(BaseModel):
    old_password: str
    new_password: str