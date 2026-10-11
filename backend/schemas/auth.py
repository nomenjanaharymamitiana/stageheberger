from pydantic import BaseModel


class LoginRequest(BaseModel):
    im: str
    mdp: str


class UserOut(BaseModel):
    im: str
    nom: str
    prenom: str
    type_user: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut