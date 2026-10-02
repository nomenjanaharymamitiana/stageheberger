from typing import Optional
from pydantic import BaseModel, ConfigDict


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
# RÉPONSE
# ============================================================

class UtilisateurOut(BaseModel):
    im: str
    nom: str
    prenom: str
    role: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# CHANGEMENT MOT DE PASSE
# ============================================================

class PasswordChange(BaseModel):
    old_password: str
    new_password: str