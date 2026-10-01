from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Utilisateur(Base):
    __tablename__ = "utilisateur"

    im = Column(String(50), primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    mdp = Column(String(255), nullable=False)
    type_user = Column(String(20))

    # Relations
    documents = relationship("Document", back_populates="dag_rh_rel")
    # Dans ton modèle Utilisateur :
    demandes_mdp = relationship("DemandeChangementMdp", back_populates="demandeur", cascade="all, delete-orphan")

    __mapper_args__ = {
        "polymorphic_on": type_user,
        "polymorphic_identity": "utilisateur",
    }


class DAG(Utilisateur):
    __tablename__ = "dag"
    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)
    __mapper_args__ = {"polymorphic_identity": "DAG"}


class RH(Utilisateur):
    __tablename__ = "rh"
    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)
    __mapper_args__ = {"polymorphic_identity": "RH"}


class RSI(Utilisateur):
    __tablename__ = "rsi"
    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)
    __mapper_args__ = {"polymorphic_identity": "RSI"}