from pydantic import BaseModel, EmailStr
from typing import Optional

# Schéma pour la création d'un agent (DAG / RH / RSI)
class UtilisateurCreate(BaseModel):
    im: str
    nom: str
    prenom: str
    email: EmailStr
    password: str
    role: str  # ex: "DAG", "RH", "RSI"


# Schéma pour mettre à jour les informations d'un utilisateur
class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None  # Permet de réattribuer le service DAG/RH si nécessaire


# Schéma pour le changement de mot de passe
class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# Schéma de sortie pour retourner les données de l'utilisateur
class UtilisateurOut(BaseModel):
    im: str
    nom: str
    prenom: str
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    type_user: Optional[str] = None  # Rétrocompatibilité si votre BDD utilise type_user

    class Config:
        from_attributes = True