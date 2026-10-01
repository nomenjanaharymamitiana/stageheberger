from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DemandeCreate(BaseModel):
    im_user: str
    old_password: str
    new_password: str


class DemandeOut(BaseModel):
    id_dmd: str
    im_user: str
    date_demande: datetime
    statut: str

    model_config = ConfigDict(from_attributes=True)