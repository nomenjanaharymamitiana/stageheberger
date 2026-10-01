from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Utilisateur(Base):
    __tablename__ = "utilisateur"

    im = Column(
        String(50),
        primary_key=True,
        index=True
    )

    nom = Column(
        String(100),
        nullable=False
    )

    prenom = Column(
        String(100),
        nullable=False
    )

    mdp = Column(
        String(255),
        nullable=False
    )

    type_user = Column(
        String(20)
    )

    # ========================================================
    # RELATIONS
    # ========================================================

    documents = relationship(
        "Document",
        back_populates="dag_rh_rel"
    )

    demandes_mdp = relationship(
        "DemandeChangementMdp",
        back_populates="demandeur",
        cascade="all, delete-orphan"
    )

    # ========================================================
    # POLYMORPHISME
    # ========================================================

    __mapper_args__ = {
        "polymorphic_on": type_user,
        "polymorphic_identity": "utilisateur",
    }


# ============================================================
# DAG
# ============================================================

class DAG(Utilisateur):
    __tablename__ = "dag"

    im = Column(
        String(50),
        ForeignKey("utilisateur.im"),
        primary_key=True
    )

    __mapper_args__ = {
        "polymorphic_identity": "DAG"
    }


# ============================================================
# RH
# ============================================================

class RH(Utilisateur):
    __tablename__ = "rh"

    im = Column(
        String(50),
        ForeignKey("utilisateur.im"),
        primary_key=True
    )

    __mapper_args__ = {
        "polymorphic_identity": "RH"
    }


# ============================================================
# RSI
# ============================================================

class RSI(Utilisateur):
    __tablename__ = "rsi"

    im = Column(
        String(50),
        ForeignKey("utilisateur.im"),
        primary_key=True
    )

    __mapper_args__ = {
        "polymorphic_identity": "RSI"
    }


# ============================================================
# DAG / RH
# ============================================================
# Cette classe utilise directement la table utilisateur.
# Elle n'a donc pas de __tablename__.
# Elle permet à SQLAlchemy de reconnaître :
# type_user = "dag_rh"
# ============================================================

class DAGRH(Utilisateur):

    __mapper_args__ = {
        "polymorphic_identity": "dag_rh"
    }